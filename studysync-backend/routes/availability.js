const express = require("express");
const db = require("../db");

const router = express.Router();


// ==========================
// ADD AVAILABILITY
// ==========================

router.post("/", (req, res) => {

    const {
        studentID,
        dayOfWeek,
        startTime,
        endTime
    } = req.body;

    if (
        !studentID ||
        !dayOfWeek ||
        !startTime ||
        !endTime
    ) {
        return res.status(400).json({
            message:
                "All availability fields are required"
        });
    }

    // Make sure start time is before end time
    if (startTime >= endTime) {
        return res.status(400).json({
            message:
                "Start time must be before end time"
        });
    }

    const sql = `
        INSERT INTO Availability
        (
            StudentID,
            DayOfWeek,
            StartTime,
            EndTime
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            studentID,
            dayOfWeek,
            startTime,
            endTime
        ],
        (err, result) => {

            if (err) {
                console.error(
                    "Add availability error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not add availability"
                });
            }

            res.status(201).json({
                message:
                    "Availability added successfully",

                availabilityID:
                    result.insertId
            });
        }
    );
});


// ==========================
// GET STUDENT AVAILABILITY
// ==========================

router.get("/:studentID", (req, res) => {

    const studentID =
        req.params.studentID;

    const sql = `
        SELECT
            AvailabilityID,
            StudentID,
            DayOfWeek,
            StartTime,
            EndTime
        FROM Availability
        WHERE StudentID = ?
        ORDER BY DayOfWeek, StartTime
    `;

    db.query(
        sql,
        [studentID],
        (err, results) => {

            if (err) {
                console.error(
                    "Get availability error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Database error"
                });
            }

            res.json(results);
        }
    );
});

module.exports = router;