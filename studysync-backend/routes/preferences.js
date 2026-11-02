const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// CREATE / UPDATE PREFERENCES
// POST /api/preferences
// =====================================================
router.post("/", (req, res) => {
    const {
        studentID,
        preferredStudyStyle,
        preferredGroupSize,
        preferredLocation
    } = req.body;

    if (!studentID) {
        return res.status(400).json({
            message: "StudentID is required"
        });
    }

    // Optional validation for group size
    if (
        preferredGroupSize !== undefined &&
        preferredGroupSize !== "" &&
        (
            Number(preferredGroupSize) < 1 ||
            Number(preferredGroupSize) > 20
        )
    ) {
        return res.status(400).json({
            message:
                "Preferred group size must be between 1 and 20"
        });
    }

    const checkQuery = `
        SELECT PreferenceID
        FROM Preferences
        WHERE StudentID = ?
    `;

    db.query(
        checkQuery,
        [studentID],
        (err, results) => {
            if (err) {
                console.error(
                    "Check preferences error:",
                    err
                );

                return res.status(500).json({
                    message: "Database error"
                });
            }

            // =================================================
            // UPDATE EXISTING PREFERENCES
            // =================================================
            if (results.length > 0) {
                const updateQuery = `
                    UPDATE Preferences
                    SET
                        PreferredStudyStyle = ?,
                        PreferredGroupSize = ?,
                        PreferredLocation = ?
                    WHERE StudentID = ?
                `;

                db.query(
                    updateQuery,
                    [
                        preferredStudyStyle || null,
                        preferredGroupSize || null,
                        preferredLocation || null,
                        studentID
                    ],
                    (err) => {
                        if (err) {
                            console.error(
                                "Update preferences error:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Could not update preferences"
                            });
                        }

                        res.json({
                            message:
                                "Preferences updated successfully"
                        });
                    }
                );

                return;
            }

            // =================================================
            // INSERT NEW PREFERENCES
            // =================================================
            const insertQuery = `
                INSERT INTO Preferences
                (
                    StudentID,
                    PreferredStudyStyle,
                    PreferredGroupSize,
                    PreferredLocation
                )
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertQuery,
                [
                    studentID,
                    preferredStudyStyle || null,
                    preferredGroupSize || null,
                    preferredLocation || null
                ],
                (err, result) => {
                    if (err) {
                        console.error(
                            "Create preferences error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Could not save preferences"
                        });
                    }

                    res.status(201).json({
                        message:
                            "Preferences saved successfully",
                        preferenceID:
                            result.insertId
                    });
                }
            );
        }
    );
});

// =====================================================
// GET PREFERENCES
// GET /api/preferences/:studentID
// =====================================================
router.get("/:studentID", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!studentID) {
        return res.status(400).json({
            message: "StudentID is required"
        });
    }

    const query = `
        SELECT
            PreferenceID,
            StudentID,
            PreferredStudyStyle,
            PreferredGroupSize,
            PreferredLocation
        FROM Preferences
        WHERE StudentID = ?
    `;

    db.query(
        query,
        [studentID],
        (err, results) => {
            if (err) {
                console.error(
                    "Get preferences error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not load preferences"
                });
            }

            // No preferences saved yet
            if (results.length === 0) {
                return res.json({
                    PreferredStudyStyle: "",
                    PreferredGroupSize: "",
                    PreferredLocation: ""
                });
            }

            res.json(results[0]);
        }
    );
});

module.exports = router;