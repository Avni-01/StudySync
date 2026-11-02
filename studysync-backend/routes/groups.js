
const express = require("express");
const db = require("../db");

const router = express.Router();

// --------------------------------------------------
// HELPER: CHECK GROUP ROLE
// --------------------------------------------------
function checkGroupRole(groupID, studentID, allowedRoles, callback) {
  const query = `
    SELECT Role
    FROM groupmembers
    WHERE GroupID = ? AND StudentID = ?
    LIMIT 1
  `;

  db.query(query, [groupID, studentID], (err, results) => {
    if (err) return callback(err, false);

    if (
      results.length === 0 ||
      !allowedRoles.includes(results[0].Role)
    ) {
      return callback(null, false);
    }

    callback(null, true);
  });
}

// --------------------------------------------------
// HELPER: SAVE NOTIFICATION
// --------------------------------------------------
function saveNotification(studentID, message, callback) {
  db.query(
    `INSERT INTO notifications (StudentID, Message, Status)
     VALUES (?, ?, 'Unread')`,
    [studentID, message],
    callback
  );
}

// --------------------------------------------------
// HELPER: NOTIFY ADMINS AND CO-ADMINS
// --------------------------------------------------
function notifyGroupManagers(groupID, message, callback) {
  db.query(
    `SELECT StudentID
     FROM groupmembers
     WHERE GroupID = ?
       AND Role IN ('Admin', 'Co-admin')`,
    [groupID],
    (err, managers) => {
      if (err) return callback(err);
      if (managers.length === 0) return callback(null);

      let completed = 0;
      let failed = false;

      managers.forEach((manager) => {
        saveNotification(manager.StudentID, message, (notificationErr) => {
          if (notificationErr) {
            failed = true;
            console.error("Save manager notification error:", notificationErr);
          }

          completed++;

          if (completed === managers.length) {
            callback(
              failed
                ? new Error("Some manager notifications could not be saved")
                : null
            );
          }
        });
      });
    }
  );
}

// --------------------------------------------------
// HELPER: ADD STUDENT TO GROUP CHAT
// --------------------------------------------------
function addStudentToGroupChat(groupID, studentID, callback) {
  db.query(
    `SELECT ChatID
     FROM chats
     WHERE GroupID = ? AND ChatType = 'Group'
     LIMIT 1`,
    [groupID],
    (err, chats) => {
      if (err) return callback(err);
      if (chats.length === 0) return callback(null);

      db.query(
        `INSERT IGNORE INTO chatmembers (ChatID, StudentID)
         VALUES (?, ?)`,
        [chats[0].ChatID, studentID],
        callback
      );
    }
  );
}

// --------------------------------------------------
// CREATE GROUP
// POST /api/groups
// Body: { groupName, createdBy }
// --------------------------------------------------
router.post("/", (req, res) => {
  const groupName = (req.body.groupName || "").trim();
  const createdBy = Number(req.body.createdBy);

  if (!groupName || !Number.isInteger(createdBy) || createdBy <= 0) {
    return res.status(400).json({
      message: "Group name and valid creator ID are required"
    });
  }

  db.query(
    `INSERT INTO studygroup (GroupName, CreatedBy)
     VALUES (?, ?)`,
    [groupName, createdBy],
    (err, result) => {
      if (err) {
        console.error("Create group error:", err);
        return res.status(500).json({ message: "Could not create group" });
      }

      const groupID = result.insertId;

      db.query(
        `INSERT INTO groupmembers (GroupID, StudentID, Role)
         VALUES (?, ?, 'Admin')`,
        [groupID, createdBy],
        (memberErr) => {
          if (memberErr) {
            console.error("Add group admin error:", memberErr);
            return res.status(500).json({
              message: "Group created, but admin membership could not be saved",
              groupID
            });
          }

          db.query(
            `INSERT INTO chats (ChatType, GroupID, CreatedBy)
             VALUES ('Group', ?, ?)`,
            [groupID, createdBy],
            (chatErr, chatResult) => {
              if (chatErr) {
                console.error("Create group chat error:", chatErr);
                return res.status(500).json({
                  message: "Group created, but its chat could not be created",
                  groupID
                });
              }

              db.query(
                `INSERT INTO chatmembers (ChatID, StudentID)
                 VALUES (?, ?)`,
                [chatResult.insertId, createdBy],
                (chatMemberErr) => {
                  if (chatMemberErr) {
                    console.error("Add admin to chat error:", chatMemberErr);
                    return res.status(500).json({
                      message: "Group created, but chat membership could not be saved",
                      groupID
                    });
                  }

                  res.status(201).json({
                    message: "Group created successfully",
                    groupID,
                    chatID: chatResult.insertId,
                    role: "Admin"
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// --------------------------------------------------
// LIST ALL GROUPS
// GET /api/groups?studentID=123
// --------------------------------------------------
router.get("/", (req, res) => {
  const studentID = Number(req.query.studentID) || 0;

  const query = `
    SELECT
      g.GroupID,
      g.GroupName,
      g.CreatedBy,
      CASE
        WHEN gm.StudentID IS NOT NULL THEN gm.Role
        ELSE 'Not a member'
      END AS Role,
      CASE
        WHEN gm.StudentID IS NOT NULL THEN 1
        ELSE 0
      END AS IsMember,
      (
        SELECT jr.Status
        FROM groupjoinrequests jr
        WHERE jr.GroupID = g.GroupID
          AND jr.StudentID = ?
          AND jr.Status IN ('Pending', 'Invited')
        ORDER BY jr.RequestID DESC
        LIMIT 1
      ) AS RequestStatus
    FROM studygroup g
    LEFT JOIN groupmembers gm
      ON gm.GroupID = g.GroupID
      AND gm.StudentID = ?
    ORDER BY g.CreatedAt DESC
  `;

  db.query(query, [studentID, studentID], (err, results) => {
    if (err) {
      console.error("List groups error:", err);
      return res.status(500).json({ message: "Could not load groups" });
    }

    res.json(results);
  });
});

// --------------------------------------------------
// GET GROUPS FOR A STUDENT
// GET /api/groups/student/:studentID
// --------------------------------------------------
router.get("/student/:studentID", (req, res) => {
  const studentID = Number(req.params.studentID);

  if (!Number.isInteger(studentID) || studentID <= 0) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  const query = `
    SELECT
      g.GroupID,
      g.GroupName,
      g.CreatedBy,
      gm.Role,
      c.ChatID
    FROM groupmembers gm
    JOIN studygroup g ON g.GroupID = gm.GroupID
    LEFT JOIN chats c
      ON c.GroupID = g.GroupID
      AND c.ChatType = 'Group'
    WHERE gm.StudentID = ?
    ORDER BY g.CreatedAt DESC
  `;

  db.query(query, [studentID], (err, results) => {
    if (err) {
      console.error("Get student groups error:", err);
      return res.status(500).json({ message: "Could not load groups" });
    }

    res.json(results);
  });
});

// --------------------------------------------------
// REQUEST TO JOIN A GROUP
// POST /api/groups/:groupID/request
// Body: { studentID }
// --------------------------------------------------
router.post("/:groupID/request", (req, res) => {
  const groupID = Number(req.params.groupID);
  const studentID = Number(req.body.studentID);

  if (
    !Number.isInteger(groupID) || groupID <= 0 ||
    !Number.isInteger(studentID) || studentID <= 0
  ) {
    return res.status(400).json({
      message: "Valid group ID and student ID are required"
    });
  }

  db.query(
    `SELECT GroupID, GroupName FROM studygroup WHERE GroupID = ?`,
    [groupID],
    (groupErr, groups) => {
      if (groupErr) {
        console.error(groupErr);
        return res.status(500).json({ message: "Could not check group" });
      }

      if (groups.length === 0) {
        return res.status(404).json({ message: "Group not found" });
      }

      db.query(
        `SELECT StudentID FROM student WHERE StudentID = ?`,
        [studentID],
        (studentErr, students) => {
          if (studentErr) {
            console.error(studentErr);
            return res.status(500).json({ message: "Could not check student" });
          }

          if (students.length === 0) {
            return res.status(404).json({ message: "Student not found" });
          }

          db.query(
            `SELECT StudentID FROM groupmembers
             WHERE GroupID = ? AND StudentID = ?`,
            [groupID, studentID],
            (memberErr, members) => {
              if (memberErr) {
                console.error(memberErr);
                return res.status(500).json({ message: "Could not check membership" });
              }

              if (members.length > 0) {
                return res.status(409).json({
                  message: "You are already a group member"
                });
              }

              db.query(
                `SELECT RequestID, Status
                 FROM groupjoinrequests
                 WHERE GroupID = ? AND StudentID = ?
                   AND Status IN ('Pending', 'Invited')
                 ORDER BY RequestID DESC
                 LIMIT 1`,
                [groupID, studentID],
                (requestErr, existing) => {
                  if (requestErr) {
                    console.error(requestErr);
                    return res.status(500).json({
                      message: "Could not check existing requests"
                    });
                  }

                  if (existing.length > 0) {
                    return res.status(409).json({
                      message: existing[0].Status === "Invited"
                        ? "You already have an invitation to this group"
                        : "Your join request is already pending"
                    });
                  }

                  db.query(
                    `SELECT RequestID FROM groupjoinrequests
                     WHERE GroupID = ? AND StudentID = ?
                       AND Status = 'Rejected'
                     LIMIT 1`,
                    [groupID, studentID],
                    (rejectedErr, rejected) => {
                      if (rejectedErr) {
                        console.error(rejectedErr);
                        return res.status(500).json({
                          message: "Could not check previous requests"
                        });
                      }

                      const finish = (requestID, statusCode) => {
                        notifyGroupManagers(
                          groupID,
                          `A student (ID: ${studentID}) has requested to join "${groups[0].GroupName}" (Group ID: ${groupID}).`,
                          (notifyErr) => {
                            if (notifyErr) console.error(notifyErr);

                            res.status(statusCode).json({
                              message: notifyErr
                                ? "Join request submitted, but some notifications could not be saved"
                                : "Join request submitted and Admins notified",
                              requestID
                            });
                          }
                        );
                      };

                      if (rejected.length > 0) {
                        const requestID = rejected[0].RequestID;

                        return db.query(
                          `UPDATE groupjoinrequests
                           SET Status = 'Pending'
                           WHERE RequestID = ? AND Status = 'Rejected'`,
                          [requestID],
                          (updateErr, result) => {
                            if (updateErr) {
                              console.error(updateErr);
                              return res.status(500).json({
                                message: "Could not resubmit join request"
                              });
                            }

                            if (!result || result.affectedRows === 0) {
                              return res.status(409).json({
                                message: "The request has changed. Please refresh and try again."
                              });
                            }

                            finish(requestID, 200);
                          }
                        );
                      }

                      db.query(
                        `INSERT INTO groupjoinrequests (GroupID, StudentID, Status)
                         VALUES (?, ?, 'Pending')`,
                        [groupID, studentID],
                        (insertErr, result) => {
                          if (insertErr) {
                            console.error(insertErr);
                            return res.status(
                              insertErr.code === "ER_DUP_ENTRY" ? 409 : 500
                            ).json({
                              message: insertErr.code === "ER_DUP_ENTRY"
                                ? "A request already exists for this group. Refresh and try again."
                                : "Could not submit join request"
                            });
                          }

                          finish(result.insertId, 201);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// --------------------------------------------------
// VIEW PENDING JOIN REQUESTS
// GET /api/groups/:groupID/requests?studentID=123
// --------------------------------------------------
router.get("/:groupID/requests", (req, res) => {
  const groupID = Number(req.params.groupID);
  const studentID = Number(req.query.studentID);

  if (
    !Number.isInteger(groupID) || groupID <= 0 ||
    !Number.isInteger(studentID) || studentID <= 0
  ) {
    return res.status(400).json({
      message: "Valid group ID and student ID are required"
    });
  }

  checkGroupRole(groupID, studentID, ["Admin", "Co-admin"], (roleErr, allowed) => {
    if (roleErr) {
      console.error(roleErr);
      return res.status(500).json({ message: "Could not check permissions" });
    }

    if (!allowed) {
      return res.status(403).json({
        message: "Only Admins and Co-admins can view join requests"
      });
    }

    const query = `
      SELECT jr.RequestID, jr.GroupID, jr.StudentID, jr.Status,
             jr.RequestDate, s.Name
      FROM groupjoinrequests jr
      JOIN student s ON s.StudentID = jr.StudentID
      WHERE jr.GroupID = ? AND jr.Status = 'Pending'
      ORDER BY jr.RequestDate ASC
    `;

    db.query(query, [groupID], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not load join requests" });
      }

      res.json(results);
    });
  });
});

// --------------------------------------------------
// ACCEPT OR REJECT A JOIN REQUEST
// PUT /api/groups/request/:requestID
// Body: { studentID, action }
// --------------------------------------------------
router.put("/request/:requestID", (req, res) => {
  const requestID = Number(req.params.requestID);
  const studentID = Number(req.body.studentID);
  const action = (req.body.action || "").toLowerCase();

  if (
    !Number.isInteger(requestID) || requestID <= 0 ||
    !Number.isInteger(studentID) || studentID <= 0 ||
    !["accept", "reject"].includes(action)
  ) {
    return res.status(400).json({
      message: "Valid request ID, student ID, and action are required"
    });
  }

  db.query(
    `SELECT jr.GroupID, jr.StudentID, jr.Status, g.GroupName
     FROM groupjoinrequests jr
     JOIN studygroup g ON g.GroupID = jr.GroupID
     WHERE jr.RequestID = ?`,
    [requestID],
    (err, requests) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not find join request" });
      }

      if (requests.length === 0) {
        return res.status(404).json({ message: "Join request not found" });
      }

      const request = requests[0];

      checkGroupRole(
        request.GroupID,
        studentID,
        ["Admin", "Co-admin"],
        (roleErr, allowed) => {
          if (roleErr) {
            console.error(roleErr);
            return res.status(500).json({ message: "Could not check permissions" });
          }

          if (!allowed) {
            return res.status(403).json({
              message: "Only Admins and Co-admins can handle requests"
            });
          }

          if (request.Status !== "Pending") {
            return res.status(409).json({
              message: "This request has already been handled"
            });
          }

          const newStatus = action === "accept" ? "Accepted" : "Rejected";

          db.query(
            `UPDATE groupjoinrequests
             SET Status = ?
             WHERE RequestID = ? AND Status = 'Pending'`,
            [newStatus, requestID],
            (updateErr, result) => {
              if (updateErr) {
                console.error(updateErr);
                return res.status(500).json({
                  message: "Could not update join request"
                });
              }

              if (!result || result.affectedRows === 0) {
                return res.status(409).json({
                  message: "This request has already been handled"
                });
              }

              const finish = () => {
                saveNotification(
                  request.StudentID,
                  `Your request to join "${request.GroupName}" was ${action === "accept" ? "accepted" : "rejected"}.`,
                  (notificationErr) => {
                    if (notificationErr) console.error(notificationErr);

                    res.json({
                      message: notificationErr
                        ? "Request handled, but the student notification could not be saved"
                        : "Request handled successfully"
                    });
                  }
                );
              };

              if (action === "reject") return finish();

              db.query(
                `INSERT INTO groupmembers (GroupID, StudentID, Role)
                 VALUES (?, ?, 'Member')`,
                [request.GroupID, request.StudentID],
                (memberErr) => {
                  if (memberErr) {
                    console.error(memberErr);
                    return res.status(500).json({
                      message: "Request accepted, but group membership could not be saved"
                    });
                  }

                  addStudentToGroupChat(
                    request.GroupID,
                    request.StudentID,
                    (chatErr) => {
                      if (chatErr) {
                        console.error(chatErr);
                        return res.status(500).json({
                          message: "Member added, but chat membership could not be saved"
                        });
                      }

                      finish();
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// --------------------------------------------------
// INVITE A STUDENT
// POST /api/groups/:groupID/invite
// Body: { senderID, studentID }
// --------------------------------------------------
router.post("/:groupID/invite", (req, res) => {
  const groupID = Number(req.params.groupID);
  const senderID = Number(req.body.senderID);
  const invitedStudentID = Number(req.body.studentID);

  if (
    !Number.isInteger(groupID) || groupID <= 0 ||
    !Number.isInteger(senderID) || senderID <= 0 ||
    !Number.isInteger(invitedStudentID) || invitedStudentID <= 0
  ) {
    return res.status(400).json({
      message: "Valid group, sender, and invited student IDs are required"
    });
  }

  if (senderID === invitedStudentID) {
    return res.status(400).json({ message: "You cannot invite yourself" });
  }

  checkGroupRole(groupID, senderID, ["Admin", "Co-admin"], (roleErr, allowed) => {
    if (roleErr) {
      console.error(roleErr);
      return res.status(500).json({ message: "Could not check permissions" });
    }

    if (!allowed) {
      return res.status(403).json({
        message: "Only Admins and Co-admins can invite students"
      });
    }

    db.query(
      `SELECT GroupName FROM studygroup WHERE GroupID = ?`,
      [groupID],
      (groupErr, groups) => {
        if (groupErr) {
          console.error(groupErr);
          return res.status(500).json({ message: "Could not find group" });
        }

        if (groups.length === 0) {
          return res.status(404).json({ message: "Group not found" });
        }

        db.query(
          `SELECT StudentID FROM student WHERE StudentID = ?`,
          [invitedStudentID],
          (studentErr, students) => {
            if (studentErr) {
              console.error(studentErr);
              return res.status(500).json({ message: "Could not check student" });
            }

            if (students.length === 0) {
              return res.status(404).json({ message: "Student not found" });
            }

            db.query(
              `SELECT StudentID FROM groupmembers
               WHERE GroupID = ? AND StudentID = ?`,
              [groupID, invitedStudentID],
              (memberErr, members) => {
                if (memberErr) {
                  console.error(memberErr);
                  return res.status(500).json({ message: "Could not check membership" });
                }

                if (members.length > 0) {
                  return res.status(409).json({
                    message: "This student is already a member"
                  });
                }

                db.query(
                  `SELECT RequestID, Status
                   FROM groupjoinrequests
                   WHERE GroupID = ? AND StudentID = ?
                     AND Status IN ('Pending', 'Invited')
                   LIMIT 1`,
                  [groupID, invitedStudentID],
                  (requestErr, existing) => {
                    if (requestErr) {
                      console.error(requestErr);
                      return res.status(500).json({
                        message: "Could not check existing requests"
                      });
                    }

                    if (existing.length > 0) {
                      return res.status(409).json({
                        message: "A pending request or invitation already exists"
                      });
                    }

                    db.query(
                      `SELECT RequestID FROM groupjoinrequests
                       WHERE GroupID = ? AND StudentID = ?
                         AND Status = 'Rejected'
                       LIMIT 1`,
                      [groupID, invitedStudentID],
                      (rejectedErr, rejected) => {
                        if (rejectedErr) {
                          console.error(rejectedErr);
                          return res.status(500).json({
                            message: "Could not check previous invitations"
                          });
                        }

                        const finishInvitation = (requestID, statusCode) => {
                          saveNotification(
                            invitedStudentID,
                            `You have been invited to join "${groups[0].GroupName}" (Group ID: ${groupID}).`,
                            (notificationErr) => {
                              if (notificationErr) console.error(notificationErr);

                              res.status(statusCode).json({
                                message: notificationErr
                                  ? "Invitation created, but its notification could not be saved"
                                  : "Invitation sent successfully",
                                requestID
                              });
                            }
                          );
                        };

                        if (rejected.length > 0) {
                          const requestID = rejected[0].RequestID;

                          return db.query(
                            `UPDATE groupjoinrequests
                             SET Status = 'Invited'
                             WHERE RequestID = ? AND Status = 'Rejected'`,
                            [requestID],
                            (updateErr, result) => {
                              if (updateErr) {
                                console.error(updateErr);
                                return res.status(500).json({
                                  message: "Could not resend invitation"
                                });
                              }

                              if (!result || result.affectedRows === 0) {
                                return res.status(409).json({
                                  message: "Invitation has changed. Refresh and try again."
                                });
                              }

                              finishInvitation(requestID, 200);
                            }
                          );
                        }

                        db.query(
                          `INSERT INTO groupjoinrequests (GroupID, StudentID, Status)
                           VALUES (?, ?, 'Invited')`,
                          [groupID, invitedStudentID],
                          (insertErr, result) => {
                            if (insertErr) {
                              console.error(insertErr);
                              return res.status(
                                insertErr.code === "ER_DUP_ENTRY" ? 409 : 500
                              ).json({
                                message: insertErr.code === "ER_DUP_ENTRY"
                                  ? "A request already exists for this group. Refresh and try again."
                                  : "Could not create invitation"
                              });
                            }

                            finishInvitation(result.insertId, 201);
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// --------------------------------------------------
// VIEW A STUDENT'S PENDING INVITATIONS
// GET /api/groups/invitations/:studentID
// --------------------------------------------------
router.get("/invitations/:studentID", (req, res) => {
  const studentID = Number(req.params.studentID);

  if (!Number.isInteger(studentID) || studentID <= 0) {
    return res.status(400).json({ message: "Valid student ID is required" });
  }

  const query = `
    SELECT jr.RequestID, jr.GroupID, jr.StudentID, jr.Status,
           jr.RequestDate, g.GroupName
    FROM groupjoinrequests jr
    JOIN studygroup g ON g.GroupID = jr.GroupID
    WHERE jr.StudentID = ? AND jr.Status = 'Invited'
    ORDER BY jr.RequestDate DESC
  `;

  db.query(query, [studentID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Could not load invitations" });
    }

    res.json(results);
  });
});

// --------------------------------------------------
// ACCEPT OR DECLINE AN INVITATION
// PUT /api/groups/invitation/:requestID
// Body: { studentID, action }
// --------------------------------------------------
router.put("/invitation/:requestID", (req, res) => {
  const requestID = Number(req.params.requestID);
  const studentID = Number(req.body.studentID);
  const action = (req.body.action || "").toLowerCase();

  if (
    !Number.isInteger(requestID) || requestID <= 0 ||
    !Number.isInteger(studentID) || studentID <= 0 ||
    !["accept", "decline"].includes(action)
  ) {
    return res.status(400).json({
      message: "Valid request ID, student ID, and action are required"
    });
  }

  db.query(
    `SELECT jr.GroupID, g.GroupName
     FROM groupjoinrequests jr
     JOIN studygroup g ON g.GroupID = jr.GroupID
     WHERE jr.RequestID = ?
       AND jr.StudentID = ?
       AND jr.Status = 'Invited'`,
    [requestID, studentID],
    (err, invitations) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not check invitation" });
      }

      if (invitations.length === 0) {
        return res.status(404).json({
          message: "Invitation not found or already handled"
        });
      }

      const invitation = invitations[0];
      const newStatus = action === "accept" ? "Accepted" : "Rejected";

      db.query(
        `UPDATE groupjoinrequests
         SET Status = ?
         WHERE RequestID = ? AND StudentID = ? AND Status = 'Invited'`,
        [newStatus, requestID, studentID],
        (updateErr, result) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ message: "Could not update invitation" });
          }

          if (!result || result.affectedRows === 0) {
            return res.status(409).json({
              message: "Invitation has already been handled"
            });
          }

          const notifyManagers = (responseMessage) => {
            notifyGroupManagers(
              invitation.GroupID,
              `Student ID ${studentID} ${action === "accept" ? "accepted" : "declined"} the invitation to "${invitation.GroupName}".`,
              (notifyErr) => {
                if (notifyErr) console.error(notifyErr);
                res.json({ message: responseMessage });
              }
            );
          };

          if (action === "decline") {
            return notifyManagers("Invitation declined");
          }

          db.query(
            `INSERT INTO groupmembers (GroupID, StudentID, Role)
             VALUES (?, ?, 'Member')`,
            [invitation.GroupID, studentID],
            (memberErr) => {
              if (memberErr) {
                console.error(memberErr);
                return res.status(500).json({
                  message: "Invitation accepted, but membership could not be saved"
                });
              }

              addStudentToGroupChat(invitation.GroupID, studentID, (chatErr) => {
                if (chatErr) {
                  console.error(chatErr);
                  return res.status(500).json({
                    message: "Member added, but chat membership could not be saved"
                  });
                }

                notifyManagers("Invitation accepted; you joined the group");
              });
            }
          );
        }
      );
    }
  );
});

// --------------------------------------------------
// CHANGE MEMBER ROLE
// PUT /api/groups/:groupID/role
// Body: { adminID, memberID, role }
// --------------------------------------------------
router.put("/:groupID/role", (req, res) => {
  const groupID = Number(req.params.groupID);

  // Accept adminID and legacy studentID for compatibility.
  const adminID = Number(req.body.adminID ?? req.body.studentID);
  const memberID = Number(req.body.memberID);
  const role = req.body.role;

  if (
    !Number.isInteger(groupID) || groupID <= 0 ||
    !Number.isInteger(adminID) || adminID <= 0 ||
    !Number.isInteger(memberID) || memberID <= 0 ||
    !["Co-admin", "Member"].includes(role)
  ) {
    return res.status(400).json({
      message: "Valid group ID, admin ID, member ID, and role are required"
    });
  }

  if (adminID === memberID) {
    return res.status(400).json({
      message: "The Admin cannot change their own role"
    });
  }

  checkGroupRole(groupID, adminID, ["Admin"], (roleErr, allowed) => {
    if (roleErr) {
      console.error(roleErr);
      return res.status(500).json({ message: "Could not check permissions" });
    }

    if (!allowed) {
      return res.status(403).json({
        message: "Only the group Admin can change member roles"
      });
    }

    db.query(
      `UPDATE groupmembers
       SET Role = ?
       WHERE GroupID = ?
         AND StudentID = ?
         AND Role <> 'Admin'`,
      [role, groupID, memberID],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Could not update member role" });
        }

        if (!result || result.affectedRows === 0) {
          return res.status(404).json({
            message: "Member not found, or Admin role cannot be changed"
          });
        }

        res.json({
          message: role === "Co-admin"
            ? "Member promoted to Co-admin"
            : "Member changed to Member"
        });
      }
    );
  });
});

// --------------------------------------------------
// VIEW GROUP MEMBERS
// GET /api/groups/:groupID/members
// --------------------------------------------------
router.get("/:groupID/members", (req, res) => {
  const groupID = Number(req.params.groupID);

  if (!Number.isInteger(groupID) || groupID <= 0) {
    return res.status(400).json({ message: "Valid group ID is required" });
  }

  const query = `
    SELECT gm.StudentID, s.Name, gm.Role, gm.JoinedAt
    FROM groupmembers gm
    JOIN student s ON s.StudentID = gm.StudentID
    WHERE gm.GroupID = ?
    ORDER BY
      CASE gm.Role
        WHEN 'Admin' THEN 1
        WHEN 'Co-admin' THEN 2
        ELSE 3
      END,
      gm.JoinedAt ASC
  `;

  db.query(query, [groupID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Could not load group members" });
    }

    res.json(results);
  });
});

module.exports = router;
