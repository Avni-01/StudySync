const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// CREATE STUDY SESSION
// POST /api/sessions
// =====================================================
router.post("/", (req, res) => {
    const {
        groupID,
        sessionDate,
        sessionTime,
        venue
    } = req.body;

    if (
        !groupID ||
        !sessionDate ||
        !sessionTime
    ) {
        return res.status(400).json({
            message:
                "GroupID, session date and session time are required"
        });
    }

    const query = `
        INSERT INTO Sessions
        (GroupID, SessionDate, SessionTime, Venue)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            groupID,
            sessionDate,
            sessionTime,
            venue || null
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "Create session error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not create study session"
                });
            }

            res.status(201).json({
                message:
                    "Study session created successfully",
                sessionID:
                    result.insertId
            });
        }
    );
});

// =====================================================
// GET SESSIONS OF A GROUP
// GET /api/sessions/group/:groupID
// =====================================================
router.get("/group/:groupID", (req, res) => {
    const groupID = Number(req.params.groupID);

    if (!groupID) {
        return res.status(400).json({
            message: "GroupID is required"
        });
    }

    const query = `
        SELECT
            SessionID,
            GroupID,
            SessionDate,
            SessionTime,
            Venue
        FROM Sessions
        WHERE GroupID = ?
        ORDER BY SessionDate, SessionTime
    `;

    db.query(
        query,
        [groupID],
        (err, results) => {
            if (err) {
                console.error(
                    "Get sessions error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not load study sessions"
                });
            }

            res.json(results);
        }
    );
});

// =====================================================
// MARK ATTENDANCE
// POST /api/sessions/attendance
// =====================================================
router.post("/attendance", (req, res) => {
    const {
        sessionID,
        studentID,
        status
    } = req.body;

    if (
        !sessionID ||
        !studentID ||
        !status
    ) {
        return res.status(400).json({
            message:
                "SessionID, StudentID and status are required"
        });
    }

    // =================================================
    // CHECK IF ATTENDANCE ALREADY EXISTS
    // =================================================
    const checkQuery = `
        SELECT AttendanceID, Status
        FROM Attendance
        WHERE SessionID = ?
        AND StudentID = ?
    `;

    db.query(
        checkQuery,
        [sessionID, studentID],
        (err, existingAttendance) => {
            if (err) {
                console.error(
                    "Check attendance error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not check attendance"
                });
            }

            if (existingAttendance.length > 0) {
                return res.status(400).json({
                    message:
                        "Attendance already marked for this student"
                });
            }

            // =================================================
            // INSERT ATTENDANCE
            // =================================================
            const query = `
                INSERT INTO Attendance
                (SessionID, StudentID, Status)
                VALUES (?, ?, ?)
            `;

            db.query(
                query,
                [
                    sessionID,
                    studentID,
                    status
                ],
                (err, result) => {
                    if (err) {
                        console.error(
                            "Attendance error:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Could not mark attendance"
                        });
                    }

                    res.status(201).json({
                        message:
                            "Attendance marked successfully",
                        attendanceID:
                            result.insertId
                    });
                }
            );
        }
    );
});

// =====================================================
// GET ATTENDANCE
// GET /api/sessions/:sessionID/attendance
// =====================================================
router.get(
    "/:sessionID/attendance",
    (req, res) => {
        const sessionID =
            Number(req.params.sessionID);

        if (!sessionID) {
            return res.status(400).json({
                message:
                    "SessionID is required"
            });
        }

        const query = `
            SELECT
                a.AttendanceID,
                a.SessionID,
                a.StudentID,
                s.Name,
                a.Status
            FROM Attendance a
            JOIN Student s
                ON a.StudentID = s.StudentID
            WHERE a.SessionID = ?
            ORDER BY s.Name
        `;

        db.query(
            query,
            [sessionID],
            (err, results) => {
                if (err) {
                    console.error(
                        "Get attendance error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Could not load attendance"
                    });
                }

                res.json(results);
            }
        );
    }
);

module.exports = router;