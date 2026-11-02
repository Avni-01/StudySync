
const express = require("express");
const db = require("../db");

const router = express.Router();

// ==========================================
// GET FEEDBACK FOR A STUDY SESSION
// ==========================================
router.get("/session/:sessionID", (req, res) => {
    const sessionID = Number(req.params.sessionID);

    if (!Number.isInteger(sessionID) || sessionID <= 0) {
        return res.status(400).json({
            message: "Valid session ID is required",
        });
    }

    const query = `
        SELECT
            f.FeedbackID,
            f.SessionID,
            f.StudentID,
            f.Rating,
            f.Comments,
            f.SubmittedDate,
            s.Name
        FROM Feedback f
        LEFT JOIN Student s
            ON s.StudentID = f.StudentID
        WHERE f.SessionID = ?
        ORDER BY f.SubmittedDate DESC
    `;

    db.query(query, [sessionID], (err, results) => {
        if (err) {
            console.error("Get feedback error:", err);

            return res.status(500).json({
                message: "Could not load feedback",
            });
        }

        return res.json(results);
    });
});

// ==========================================
// SUBMIT FEEDBACK
// ==========================================
router.post("/", (req, res) => {
    const {
        sessionID,
        studentID,
        rating,
        comments,
    } = req.body;

    const parsedSessionID = Number(sessionID);
    const parsedStudentID = Number(studentID);
    const parsedRating = Number(rating);

    if (
        !Number.isInteger(parsedSessionID) ||
        parsedSessionID <= 0 ||
        !Number.isInteger(parsedStudentID) ||
        parsedStudentID <= 0
    ) {
        return res.status(400).json({
            message: "Valid session ID and student ID are required",
        });
    }

    if (
        !Number.isInteger(parsedRating) ||
        parsedRating < 1 ||
        parsedRating > 5
    ) {
        return res.status(400).json({
            message: "Rating must be between 1 and 5",
        });
    }

    const cleanComments =
        typeof comments === "string"
            ? comments.trim().slice(0, 500)
            : "";

    const query = `
        INSERT INTO Feedback
            (SessionID, StudentID, Rating, Comments)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            parsedSessionID,
            parsedStudentID,
            parsedRating,
            cleanComments || null,
        ],
        (err, result) => {
            if (err) {
                console.error("Submit feedback error:", err);

                return res.status(500).json({
                    message: "Could not submit feedback",
                });
            }

            return res.status(201).json({
                message: "Feedback submitted successfully",
                feedbackID: result.insertId,
            });
        }
    );
});

module.exports = router;