
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/notifications/:studentID
router.get("/:studentID", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Valid student ID is required"
        });
    }

    const query = `
        SELECT
            NotificationID,
            StudentID,
            Message,
            NotificationDate,
            Status
        FROM notifications
        WHERE StudentID = ?
        ORDER BY NotificationID DESC
    `;

    db.query(query, [studentID], (err, results) => {
        if (err) {
            console.error("Get notifications error:", err);
            return res.status(500).json({
                message: "Could not load notifications"
            });
        }

        res.json(results);
    });
});

// PUT /api/notifications/:studentID/read
router.put("/:studentID/read", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "Valid student ID is required"
        });
    }

    const query = `
        UPDATE notifications
        SET Status = 'Read'
        WHERE StudentID = ?
          AND Status = 'Unread'
    `;

    db.query(query, [studentID], (err, result) => {
        if (err) {
            console.error("Mark notifications read error:", err);
            return res.status(500).json({
                message: "Could not mark notifications as read"
            });
        }

        res.json({
            message: "Notifications marked as read",
            updatedCount: result.affectedRows
        });
    });
});

module.exports = router;
