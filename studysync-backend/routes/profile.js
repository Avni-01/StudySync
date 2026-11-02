
const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================
// GET PROFILE
// GET /api/profile/:studentID
// =====================================

router.get("/:studentID", (req, res) => {
    const { studentID } = req.params;

    if (!studentID || !Number.isInteger(Number(studentID)) ||
        Number(studentID) <= 0) {
        return res.status(400).json({
            message: "A valid Student ID is required",
        });
    }

    const sql = `
        SELECT
            s.StudentID,
            s.CollegeID,
            s.Name,
            s.Email,
            s.Branch,
            s.Semester,
            sp.CGPA,
            sp.Hostel,
            sp.StudyGoal
        FROM Student s
        LEFT JOIN StudentProfile sp
            ON s.StudentID = sp.StudentID
        WHERE s.StudentID = ?
    `;

    db.query(sql, [Number(studentID)], (err, results) => {
        if (err) {
            console.error("GET profile error:", err);

            return res.status(500).json({
                message: "Database error while loading profile",
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        return res.json(results[0]);
    });
});

// =====================================
// UPDATE PROFILE
// POST /api/profile
// =====================================

router.post("/", (req, res) => {
    const { studentID, cgpa, hostel, studyGoal } = req.body;

    if (!studentID || !Number.isInteger(Number(studentID)) ||
        Number(studentID) <= 0) {
        return res.status(400).json({
            message: "A valid Student ID is required",
        });
    }

    let cgpaNumber = null;

    if (cgpa !== null && cgpa !== undefined && cgpa !== "") {
        cgpaNumber = Number(cgpa);

        if (
            !Number.isFinite(cgpaNumber) ||
            cgpaNumber < 0 ||
            cgpaNumber > 10
        ) {
            return res.status(400).json({
                message: "CGPA must be a number between 0 and 10",
            });
        }
    }

    // Check that the student exists
    db.query(
        "SELECT StudentID FROM Student WHERE StudentID = ?",
        [Number(studentID)],
        (studentErr, students) => {
            if (studentErr) {
                console.error("Check student error:", studentErr);

                return res.status(500).json({
                    message: "Database error while checking student",
                });
            }

            if (students.length === 0) {
                return res.status(404).json({
                    message: "Student not found",
                });
            }

            // Insert the profile, or update it if it already exists
            const sql = `
                INSERT INTO StudentProfile
                    (StudentID, CGPA, Hostel, StudyGoal)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    CGPA = VALUES(CGPA),
                    Hostel = VALUES(Hostel),
                    StudyGoal = VALUES(StudyGoal)
            `;

            db.query(
                sql,
                [
                    Number(studentID),
                    cgpaNumber,
                    typeof hostel === "string" ? hostel.trim() || null : null,
                    typeof studyGoal === "string"
                        ? studyGoal.trim() || null
                        : null,
                ],
                (err) => {
                    if (err) {
                        console.error("UPDATE profile error:", err);

                        return res.status(500).json({
                            message: "Database error while updating profile",
                        });
                    }

                    return res.json({
                        message: "Profile updated successfully!",
                    });
                }
            );
        }
    );
});

module.exports = router;
