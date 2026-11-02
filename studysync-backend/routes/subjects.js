const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// GET ALL SUBJECTS
// GET /api/subjects
// =====================================================
router.get("/", (req, res) => {
    const sql = `
        SELECT
            SubjectID,
            SubjectName
        FROM Subjects
        ORDER BY SubjectName
    `;

    db.query(
        sql,
        (err, results) => {
            if (err) {
                console.error(
                    "Get subjects error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not load subjects"
                });
            }

            res.json(results);
        }
    );
});

// =====================================================
// GET SUBJECTS OF A STUDENT
// GET /api/subjects/student/:studentID
// =====================================================
router.get(
    "/student/:studentID",
    (req, res) => {
        const studentID =
            Number(req.params.studentID);

        if (!studentID) {
            return res.status(400).json({
                message:
                    "StudentID is required"
            });
        }

        const sql = `
            SELECT
                ss.StudentID,
                ss.SubjectID,
                s.SubjectName
            FROM StudentSubjects ss
            JOIN Subjects s
                ON ss.SubjectID = s.SubjectID
            WHERE ss.StudentID = ?
            ORDER BY s.SubjectName
        `;

        db.query(
            sql,
            [studentID],
            (err, results) => {
                if (err) {
                    console.error(
                        "Get student subjects error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Could not load student subjects"
                    });
                }

                res.json(results);
            }
        );
    }
);

// =====================================================
// ASSIGN SUBJECTS TO A STUDENT
// POST /api/subjects/student
// =====================================================
router.post(
    "/student",
    (req, res) => {
        const {
            studentID,
            subjectIDs
        } = req.body;

        if (
            !studentID ||
            !Array.isArray(subjectIDs) ||
            subjectIDs.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Student ID and subject IDs are required"
            });
        }

        // Remove duplicate subject IDs
        const uniqueSubjectIDs = [
            ...new Set(
                subjectIDs.map(
                    id => Number(id)
                )
            )
        ];

        // =================================================
        // DELETE OLD SUBJECTS
        // =================================================
        const deleteSQL = `
            DELETE FROM StudentSubjects
            WHERE StudentID = ?
        `;

        db.query(
            deleteSQL,
            [studentID],
            (err) => {
                if (err) {
                    console.error(
                        "Delete old subjects error:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Could not update subjects"
                    });
                }

                // =================================================
                // CREATE INSERT VALUES
                // =================================================
                const values =
                    uniqueSubjectIDs.map(
                        subjectID => [
                            studentID,
                            subjectID
                        ]
                    );

                const insertSQL = `
                    INSERT INTO StudentSubjects
                    (StudentID, SubjectID)
                    VALUES ?
                `;

                db.query(
                    insertSQL,
                    [values],
                    (err) => {
                        if (err) {
                            console.error(
                                "Insert subjects error:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Could not assign subjects"
                            });
                        }

                        res.json({
                            message:
                                "Subjects assigned successfully"
                        });
                    }
                );
            }
        );
    }
);

module.exports = router;