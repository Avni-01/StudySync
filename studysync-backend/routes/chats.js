
const express = require("express");
const db = require("../db");

const router = express.Router();

// ==========================================
// CREATE OR FIND PERSONAL CHAT
// POST /api/chats/personal
// ==========================================

router.post("/personal", (req, res) => {
    const student1ID = Number(req.body.student1ID);
    const student2ID = Number(req.body.student2ID);

    if (
        !Number.isInteger(student1ID) ||
        student1ID <= 0 ||
        !Number.isInteger(student2ID) ||
        student2ID <= 0
    ) {
        return res.status(400).json({
            message: "Both valid student IDs are required",
        });
    }

    if (student1ID === student2ID) {
        return res.status(400).json({
            message: "Cannot create a chat with yourself",
        });
    }

    const connectionQuery = `
        SELECT RequestID
        FROM ConnectionRequests
        WHERE Status = 'Accepted'
        AND (
            (SenderID = ? AND ReceiverID = ?)
            OR
            (SenderID = ? AND ReceiverID = ?)
        )
        LIMIT 1
    `;

    db.query(
        connectionQuery,
        [student1ID, student2ID, student2ID, student1ID],
        (err, connections) => {
            if (err) {
                console.error("Check accepted connection error:", err);
                return res.status(500).json({
                    message: "Could not verify connection",
                });
            }

            if (connections.length === 0) {
                return res.status(403).json({
                    message:
                        "You can chat only with accepted connections",
                });
            }

            const checkChatQuery = `
                SELECT c.ChatID
                FROM Chats c
                JOIN ChatMembers cm1
                    ON c.ChatID = cm1.ChatID
                JOIN ChatMembers cm2
                    ON c.ChatID = cm2.ChatID
                WHERE c.ChatType = 'Personal'
                  AND cm1.StudentID = ?
                  AND cm2.StudentID = ?
                  AND (
                      SELECT COUNT(*)
                      FROM ChatMembers cm
                      WHERE cm.ChatID = c.ChatID
                  ) = 2
                LIMIT 1
            `;

            db.query(
                checkChatQuery,
                [student1ID, student2ID],
                (err, chats) => {
                    if (err) {
                        console.error("Check chat error:", err);
                        return res.status(500).json({
                            message: "Could not check existing chat",
                        });
                    }

                    if (chats.length > 0) {
                        return res.json({
                            message: "Chat already exists",
                            chatID: chats[0].ChatID,
                        });
                    }

                    const createChatQuery = `
                        INSERT INTO Chats
                            (ChatType, GroupID, CreatedBy)
                        VALUES ('Personal', NULL, ?)
                    `;

                    db.query(
                        createChatQuery,
                        [student1ID],
                        (err, result) => {
                            if (err) {
                                console.error("Create chat error:", err);
                                return res.status(500).json({
                                    message: "Could not create chat",
                                });
                            }

                            const chatID = result.insertId;

                            const addMembersQuery = `
                                INSERT INTO ChatMembers
                                    (ChatID, StudentID)
                                VALUES (?, ?), (?, ?)
                            `;

                            db.query(
                                addMembersQuery,
                                [
                                    chatID,
                                    student1ID,
                                    chatID,
                                    student2ID,
                                ],
                                (err) => {
                                    if (err) {
                                        console.error(
                                            "Add chat members error:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Could not add chat members",
                                        });
                                    }

                                    return res.status(201).json({
                                        message: "Personal chat created",
                                        chatID,
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


// ==========================================
// GET UNREAD MESSAGE COUNTS
// GET /api/chats/unread/:studentID
//
// Returns:
// [
//   { "OtherStudentID": 5, "UnreadCount": 2 }
// ]
// ==========================================

router.get("/unread/:studentID", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Valid student ID is required",
        });
    }

    const query = `
        SELECT
            other.StudentID AS OtherStudentID,
            COUNT(m.MessageID) AS UnreadCount
        FROM ChatMembers mine

        JOIN Chats c
            ON c.ChatID = mine.ChatID
            AND c.ChatType = 'Personal'

        JOIN ChatMembers other
            ON other.ChatID = mine.ChatID
            AND other.StudentID <> mine.StudentID

        JOIN Messages m
            ON m.ChatID = mine.ChatID
            AND m.SenderID = other.StudentID

        LEFT JOIN ChatReadStatus crs
            ON crs.ChatID = mine.ChatID
            AND crs.StudentID = mine.StudentID

        WHERE mine.StudentID = ?
          AND (
              crs.LastReadAt IS NULL
              OR m.SentAt > crs.LastReadAt
          )

        GROUP BY other.StudentID
    `;

    db.query(query, [studentID], (err, results) => {
        if (err) {
            console.error("Get unread counts error:", err);

            return res.status(500).json({
                message: "Could not load unread messages",
            });
        }

        res.json(
            results.map((row) => ({
                OtherStudentID: Number(row.OtherStudentID),
                UnreadCount: Number(row.UnreadCount),
            }))
        );
    });
});


// ==========================================
// MARK CHAT AS READ
// PUT /api/chats/:chatID/read
//
// Request body:
// { "studentID": 1 }
// ==========================================

router.put("/:chatID/read", (req, res) => {
    const chatID = Number(req.params.chatID);
    const studentID = Number(req.body.studentID);

    if (
        !Number.isInteger(chatID) ||
        chatID <= 0 ||
        !Number.isInteger(studentID) ||
        studentID <= 0
    ) {
        return res.status(400).json({
            message: "Valid chat ID and student ID are required",
        });
    }

    const memberQuery = `
        SELECT ChatID
        FROM ChatMembers
        WHERE ChatID = ? AND StudentID = ?
    `;

    db.query(memberQuery, [chatID, studentID], (err, members) => {
        if (err) {
            console.error("Check chat membership error:", err);

            return res.status(500).json({
                message: "Could not verify chat membership",
            });
        }

        if (members.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this chat",
            });
        }

        const readQuery = `
            INSERT INTO ChatReadStatus
                (ChatID, StudentID, LastReadAt)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                LastReadAt = NOW()
        `;

        db.query(readQuery, [chatID, studentID], (err) => {
            if (err) {
                console.error("Mark chat as read error:", err);

                return res.status(500).json({
                    message: "Could not mark chat as read",
                });
            }

            return res.json({
                message: "Chat marked as read",
            });
        });
    });
});


// ==========================================
// SEND MESSAGE
// POST /api/chats/message
//
// Request body:
// {
//   "chatID": 1,
//   "senderID": 1,
//   "messageText": "Hello"
// }
// ==========================================

router.post("/message", (req, res) => {
    const chatID = Number(req.body.chatID);
    const senderID = Number(req.body.senderID);
    const messageText = String(
        req.body.messageText || ""
    ).trim();

    if (
        !Number.isInteger(chatID) ||
        chatID <= 0 ||
        !Number.isInteger(senderID) ||
        senderID <= 0 ||
        !messageText
    ) {
        return res.status(400).json({
            message:
                "ChatID, SenderID and MessageText are required",
        });
    }

    if (messageText.length > 5000) {
        return res.status(400).json({
            message: "Message is too long",
        });
    }

    const memberQuery = `
        SELECT ChatID
        FROM ChatMembers
        WHERE ChatID = ? AND StudentID = ?
    `;

    db.query(memberQuery, [chatID, senderID], (err, members) => {
        if (err) {
            console.error("Chat member check error:", err);

            return res.status(500).json({
                message: "Could not verify chat membership",
            });
        }

        if (members.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this chat",
            });
        }

        const insertMessageQuery = `
            INSERT INTO Messages
                (ChatID, SenderID, MessageText)
            VALUES (?, ?, ?)
        `;

        db.query(
            insertMessageQuery,
            [chatID, senderID, messageText],
            (err, result) => {
                if (err) {
                    console.error("Send message error:", err);

                    return res.status(500).json({
                        message: "Could not send message",
                    });
                }

                const notificationQuery = `
                    INSERT INTO Notifications
                        (StudentID, Message, Status)
                    SELECT
                        cm.StudentID,
                        CONCAT(s.Name, ' sent you a message'),
                        'Unread'
                    FROM ChatMembers cm
                    JOIN Student s
                        ON s.StudentID = ?
                    WHERE cm.ChatID = ?
                      AND cm.StudentID <> ?
                `;

                db.query(
                    notificationQuery,
                    [senderID, chatID, senderID],
                    (notificationErr) => {
                        if (notificationErr) {
                            console.error(
                                "Message notification error:",
                                notificationErr
                            );
                        }

                        return res.status(201).json({
                            message: "Message sent successfully",
                            messageID: result.insertId,
                        });
                    }
                );
            }
        );
    });
});


// ==========================================
// GET MESSAGES
// GET /api/chats/:chatID/messages?studentID=1
// ==========================================

router.get("/:chatID/messages", (req, res) => {
    const chatID = Number(req.params.chatID);
    const studentID = Number(req.query.studentID);

    if (!Number.isInteger(chatID) || chatID <= 0) {
        return res.status(400).json({
            message: "Valid chat ID is required",
        });
    }

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Student ID is required to load messages",
        });
    }

    const memberQuery = `
        SELECT ChatID
        FROM ChatMembers
        WHERE ChatID = ? AND StudentID = ?
    `;

    db.query(memberQuery, [chatID, studentID], (err, members) => {
        if (err) {
            console.error("Verify message access error:", err);

            return res.status(500).json({
                message: "Could not verify chat access",
            });
        }

        if (members.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this chat",
            });
        }

        const messagesQuery = `
            SELECT
                m.MessageID,
                m.ChatID,
                m.SenderID,
                s.Name AS SenderName,
                m.MessageText,
                m.SentAt
            FROM Messages m
            JOIN Student s
                ON s.StudentID = m.SenderID
            WHERE m.ChatID = ?
            ORDER BY m.SentAt ASC, m.MessageID ASC
        `;

        db.query(messagesQuery, [chatID], (err, results) => {
            if (err) {
                console.error("Get messages error:", err);

                return res.status(500).json({
                    message: "Could not load messages",
                });
            }

            return res.json(results);
        });
    });
});

module.exports = router;