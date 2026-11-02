
const express = require("express");
const db = require("../db");

const router = express.Router();

// ==========================================
// SEND CONNECTION REQUEST
// POST /api/connections/request
// ==========================================

router.post("/request", (req, res) => {
    const senderID = Number(req.body.senderID);
    const receiverID = Number(req.body.receiverID);

    if (
        !Number.isInteger(senderID) ||
        senderID <= 0 ||
        !Number.isInteger(receiverID) ||
        receiverID <= 0
    ) {
        return res.status(400).json({
            message: "Valid SenderID and ReceiverID are required",
        });
    }

    if (senderID === receiverID) {
        return res.status(400).json({
            message: "You cannot send a request to yourself",
        });
    }

    const checkQuery = `
        SELECT RequestID
        FROM ConnectionRequests
        WHERE (SenderID = ? AND ReceiverID = ?)
           OR (SenderID = ? AND ReceiverID = ?)
        LIMIT 1
    `;

    db.query(
        checkQuery,
        [senderID, receiverID, receiverID, senderID],
        (err, results) => {
            if (err) {
                console.error("Check connection error:", err);
                return res.status(500).json({
                    message: "Database error",
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message: "Connection request already exists",
                });
            }

            const insertQuery = `
                INSERT INTO ConnectionRequests
                    (SenderID, ReceiverID, Status)
                VALUES (?, ?, 'Pending')
            `;

            db.query(
                insertQuery,
                [senderID, receiverID],
                (err, result) => {
                    if (err) {
                        console.error("Send request error:", err);
                        return res.status(500).json({
                            message: "Could not send connection request",
                        });
                    }

                    const notificationQuery = `
                        INSERT INTO Notifications
                            (StudentID, Message, Status)
                        SELECT
                            ?,
                            CONCAT(Name, ' sent you a connection request'),
                            'Unread'
                        FROM Student
                        WHERE StudentID = ?
                    `;

                    db.query(
                        notificationQuery,
                        [receiverID, senderID],
                        (notificationErr) => {
                            if (notificationErr) {
                                console.error(
                                    "Request notification error:",
                                    notificationErr
                                );
                            }

                            res.status(201).json({
                                message: "Connection request sent successfully",
                                requestID: result.insertId,
                            });
                        }
                    );
                }
            );
        }
    );
});

// ==========================================
// GET CONNECTIONS
// GET /api/connections/:studentID
// ==========================================

router.get("/:studentID", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Valid student ID is required",
        });
    }

    const query = `
        SELECT
            cr.RequestID,
            cr.SenderID,
            cr.ReceiverID,
            cr.Status,
            cr.RequestDate,
            CASE
                WHEN cr.SenderID = ? THEN receiver.Name
                ELSE sender.Name
            END AS Name
        FROM ConnectionRequests cr
        JOIN Student sender
            ON cr.SenderID = sender.StudentID
        JOIN Student receiver
            ON cr.ReceiverID = receiver.StudentID
        WHERE cr.SenderID = ? OR cr.ReceiverID = ?
        ORDER BY cr.RequestDate DESC
    `;

    db.query(
        query,
        [studentID, studentID, studentID],
        (err, results) => {
            if (err) {
                console.error("Get connections error:", err);
                return res.status(500).json({
                    message: "Could not load connections",
                });
            }

            res.json(results);
        }
    );
});

// ==========================================
// ACCEPT CONNECTION REQUEST
// PUT /api/connections/accept/:requestID
// ==========================================

router.put("/accept/:requestID", (req, res) => {
    const requestID = Number(req.params.requestID);
    const studentID = Number(req.body.studentID);

    if (!Number.isInteger(requestID) || requestID <= 0) {
        return res.status(400).json({
            message: "Valid request ID is required",
        });
    }

    // Only the receiver should be able to accept the request.
    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Student ID is required",
        });
    }

    const findQuery = `
        SELECT RequestID, SenderID, ReceiverID, Status
        FROM ConnectionRequests
        WHERE RequestID = ?
    `;

    db.query(findQuery, [requestID], (err, requests) => {
        if (err) {
            console.error("Find request error:", err);
            return res.status(500).json({
                message: "Could not find connection request",
            });
        }

        if (requests.length === 0) {
            return res.status(404).json({
                message: "Connection request not found",
            });
        }

        const request = requests[0];

        if (Number(request.ReceiverID) !== studentID) {
            return res.status(403).json({
                message: "Only the receiver can accept this request",
            });
        }

        if (request.Status !== "Pending") {
            return res.status(400).json({
                message: "This request is no longer pending",
            });
        }

        const updateQuery = `
            UPDATE ConnectionRequests
            SET Status = 'Accepted'
            WHERE RequestID = ? AND Status = 'Pending'
        `;

        db.query(updateQuery, [requestID], (err, result) => {
            if (err) {
                console.error("Accept request error:", err);
                return res.status(500).json({
                    message: "Could not accept connection request",
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message: "Request has already been processed",
                });
            }

            const notificationQuery = `
                INSERT INTO Notifications
                    (StudentID, Message, Status)
                SELECT
                    ?,
                    CONCAT(Name, ' accepted your connection request'),
                    'Unread'
                FROM Student
                WHERE StudentID = ?
            `;

            db.query(
                notificationQuery,
                [request.SenderID, request.ReceiverID],
                (notificationErr) => {
                    if (notificationErr) {
                        console.error(
                            "Acceptance notification error:",
                            notificationErr
                        );
                    }

                    res.json({
                        message: "Connection request accepted",
                    });
                }
            );
        });
    });
});

// ==========================================
// REJECT CONNECTION REQUEST
// PUT /api/connections/reject/:requestID
// ==========================================

router.put("/reject/:requestID", (req, res) => {
    const requestID = Number(req.params.requestID);
    const studentID = Number(req.body.studentID);

    if (
        !Number.isInteger(requestID) ||
        requestID <= 0 ||
        !Number.isInteger(studentID) ||
        studentID <= 0
    ) {
        return res.status(400).json({
            message: "Valid request ID and student ID are required",
        });
    }

    const query = `
        UPDATE ConnectionRequests
        SET Status = 'Rejected'
        WHERE RequestID = ?
          AND ReceiverID = ?
          AND Status = 'Pending'
    `;

    db.query(query, [requestID, studentID], (err, result) => {
        if (err) {
            console.error("Reject request error:", err);
            return res.status(500).json({
                message: "Could not reject connection request",
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pending request not found",
            });
        }

        res.json({
            message: "Connection request rejected",
        });
    });
});

module.exports = router;
