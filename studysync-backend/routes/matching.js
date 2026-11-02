
const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// GET MATCHES FOR A STUDENT
// GET /api/matching/:studentID
// =====================================================
router.get("/:studentID", (req, res) => {
    const studentID = Number(req.params.studentID);

    if (!Number.isInteger(studentID) || studentID <= 0) {
        return res.status(400).json({
            message: "A valid StudentID is required"
        });
    }

    // =================================================
    // GET CURRENT STUDENT INFORMATION
    // =================================================
    const studentQuery = `
        SELECT
            s.StudentID,
            s.CollegeID,
            c.CollegeName AS CollegeName,
            s.Branch,
            s.Semester,
            p.CGPA,
            p.StudyGoal,
            pref.PreferredStudyStyle,
            pref.PreferredGroupSize,
            pref.PreferredLocation
        FROM Student s
        LEFT JOIN College c
            ON s.CollegeID = c.CollegeID
        LEFT JOIN StudentProfile p
            ON s.StudentID = p.StudentID
        LEFT JOIN Preferences pref
            ON s.StudentID = pref.StudentID
        WHERE s.StudentID = ?
    `;

    db.query(studentQuery, [studentID], (err, studentResults) => {
        if (err) {
            console.error("Get current student error:", err);
            return res.status(500).json({
                message: "Could not load student information"
            });
        }

        if (studentResults.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const currentStudent = studentResults[0];

        // =================================================
        // GET CURRENT STUDENT'S SUBJECTS
        // =================================================
        const currentSubjectsQuery = `
            SELECT SubjectID
            FROM StudentSubjects
            WHERE StudentID = ?
        `;

        db.query(
            currentSubjectsQuery,
            [studentID],
            (err, currentSubjectResults) => {
                if (err) {
                    console.error("Get current subjects error:", err);
                    return res.status(500).json({
                        message: "Could not load subjects"
                    });
                }

                const currentSubjectIDs = currentSubjectResults.map(
                    row => String(row.SubjectID)
                );

                // =============================================
                // GET CURRENT STUDENT'S AVAILABILITY
                // =============================================
                const currentAvailabilityQuery = `
                    SELECT DayOfWeek, StartTime, EndTime
                    FROM Availability
                    WHERE StudentID = ?
                `;

                db.query(
                    currentAvailabilityQuery,
                    [studentID],
                    (err, currentAvailabilityResults) => {
                        if (err) {
                            console.error(
                                "Get current availability error:",
                                err
                            );
                            return res.status(500).json({
                                message: "Could not load availability"
                            });
                        }

                        // =============================================
                        // GET ALL OTHER STUDENTS AND THEIR COLLEGES
                        // =============================================
                        const studentsQuery = `
                            SELECT
                                s.StudentID,
                                s.CollegeID,
                                c.CollegeName AS CollegeName,
                                s.Name,
                                s.Email,
                                s.Branch,
                                s.Semester,
                                p.CGPA,
                                p.Hostel,
                                p.StudyGoal,
                                pref.PreferredStudyStyle,
                                pref.PreferredGroupSize,
                                pref.PreferredLocation
                            FROM Student s
                            LEFT JOIN College c
                                ON s.CollegeID = c.CollegeID
                            LEFT JOIN StudentProfile p
                                ON s.StudentID = p.StudentID
                            LEFT JOIN Preferences pref
                                ON s.StudentID = pref.StudentID
                            WHERE s.StudentID != ?
                        `;

                        db.query(
                            studentsQuery,
                            [studentID],
                            (err, students) => {
                                if (err) {
                                    console.error(
                                        "Get other students error:",
                                        err
                                    );
                                    return res.status(500).json({
                                        message: "Could not load students"
                                    });
                                }

                                if (students.length === 0) {
                                    return res.json([]);
                                }

                                let completed = 0;
                                const matches = [];

                                // =============================================
                                // PROCESS EACH POTENTIAL MATCH
                                // =============================================
                                students.forEach(otherStudent => {
                                    const otherSubjectsQuery = `
                                        SELECT
                                            ss.SubjectID,
                                            sub.SubjectName
                                        FROM StudentSubjects ss
                                        JOIN Subjects sub
                                            ON ss.SubjectID = sub.SubjectID
                                        WHERE ss.StudentID = ?
                                    `;

                                    db.query(
                                        otherSubjectsQuery,
                                        [otherStudent.StudentID],
                                        (err, otherSubjectResults) => {
                                            if (err) {
                                                console.error(
                                                    "Get other subjects error:",
                                                    err
                                                );
                                                completed++;

                                                if (completed === students.length) {
                                                    sendResults();
                                                }
                                                return;
                                            }

                                            // =============================================
                                            // FIND COMMON SUBJECTS
                                            // =============================================
                                            const otherSubjectIDs =
                                                otherSubjectResults.map(
                                                    subject =>
                                                        String(subject.SubjectID)
                                                );

                                            const commonSubjects =
                                                otherSubjectResults
                                                    .filter(subject =>
                                                        currentSubjectIDs.includes(
                                                            String(subject.SubjectID)
                                                        )
                                                    )
                                                    .map(
                                                        subject =>
                                                            subject.SubjectName
                                                    );

                                            // =============================================
                                            // GET OTHER STUDENT'S AVAILABILITY
                                            // =============================================
                                            const otherAvailabilityQuery = `
                                                SELECT
                                                    DayOfWeek,
                                                    StartTime,
                                                    EndTime
                                                FROM Availability
                                                WHERE StudentID = ?
                                            `;

                                            db.query(
                                                otherAvailabilityQuery,
                                                [otherStudent.StudentID],
                                                (err, otherAvailabilityResults) => {
                                                    if (err) {
                                                        console.error(
                                                            "Get other availability error:",
                                                            err
                                                        );
                                                        completed++;

                                                        if (
                                                            completed ===
                                                            students.length
                                                        ) {
                                                            sendResults();
                                                        }
                                                        return;
                                                    }

                                                    // =============================================
                                                    // FIND OVERLAPPING AVAILABILITY
                                                    // =============================================
                                                    const overlappingAvailability = [];

                                                    currentAvailabilityResults.forEach(
                                                        currentTime => {
                                                            otherAvailabilityResults.forEach(
                                                                otherTime => {
                                                                    const currentDay =
                                                                        String(
                                                                            currentTime.DayOfWeek || ""
                                                                        ).toLowerCase();

                                                                    const otherDay =
                                                                        String(
                                                                            otherTime.DayOfWeek || ""
                                                                        ).toLowerCase();

                                                                    if (
                                                                        currentDay &&
                                                                        currentDay === otherDay
                                                                    ) {
                                                                        const startTime =
                                                                            currentTime.StartTime >
                                                                            otherTime.StartTime
                                                                                ? currentTime.StartTime
                                                                                : otherTime.StartTime;

                                                                        const endTime =
                                                                            currentTime.EndTime <
                                                                            otherTime.EndTime
                                                                                ? currentTime.EndTime
                                                                                : otherTime.EndTime;

                                                                        if (
                                                                            startTime < endTime
                                                                        ) {
                                                                            overlappingAvailability.push({
                                                                                day: currentTime.DayOfWeek,
                                                                                startTime,
                                                                                endTime
                                                                            });
                                                                        }
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    );

                                                    // =============================================
                                                    // SUBJECT SCORE
                                                    // =============================================
                                                    let subjectScore = 0;

                                                    if (
                                                        currentSubjectIDs.length > 0
                                                    ) {
                                                        subjectScore =
                                                            (commonSubjects.length /
                                                                currentSubjectIDs.length) *
                                                            100;
                                                    }

                                                    // =============================================
                                                    // AVAILABILITY SCORE
                                                    // =============================================
                                                    const availabilityScore =
                                                        overlappingAvailability.length > 0
                                                            ? 100
                                                            : 0;

                                                    // =============================================
                                                    // STUDY STYLE SCORE
                                                    // =============================================
                                                    const currentStyle =
                                                        currentStudent.PreferredStudyStyle;
                                                    const otherStyle =
                                                        otherStudent.PreferredStudyStyle;

                                                    const styleScore =
                                                        currentStyle &&
                                                        otherStyle &&
                                                        currentStyle.toLowerCase() ===
                                                            otherStyle.toLowerCase()
                                                            ? 100
                                                            : 0;

                                                    // =============================================
                                                    // STUDY GOAL SCORE
                                                    // =============================================
                                                    const currentGoal =
                                                        currentStudent.StudyGoal;
                                                    const otherGoal =
                                                        otherStudent.StudyGoal;

                                                    const goalScore =
                                                        currentGoal &&
                                                        otherGoal &&
                                                        currentGoal.toLowerCase() ===
                                                            otherGoal.toLowerCase()
                                                            ? 100
                                                            : 0;

                                                    // =============================================
                                                    // LOCATION SCORE
                                                    // =============================================
                                                    const currentLocation =
                                                        currentStudent.PreferredLocation;
                                                    const otherLocation =
                                                        otherStudent.PreferredLocation;

                                                    const locationScore =
                                                        currentLocation &&
                                                        otherLocation &&
                                                        currentLocation.toLowerCase() ===
                                                            otherLocation.toLowerCase()
                                                            ? 100
                                                            : 0;

                                                    // =============================================
                                                    // FINAL COMPATIBILITY SCORE
                                                    // =============================================
                                                    const compatibilityScore =
                                                        subjectScore * 0.4 +
                                                        availabilityScore * 0.3 +
                                                        styleScore * 0.15 +
                                                        goalScore * 0.1 +
                                                        locationScore * 0.05;

                                                    // =============================================
                                                    // ADD MATCH INCLUDING COLLEGE DETAILS
                                                    // =============================================
                                                    matches.push({
                                                        studentID:
                                                            otherStudent.StudentID,

                                                        collegeID:
                                                            otherStudent.CollegeID,

                                                        collegeName:
                                                            otherStudent.CollegeName,

                                                        name:
                                                            otherStudent.Name,

                                                        email:
                                                            otherStudent.Email,

                                                        branch:
                                                            otherStudent.Branch,

                                                        semester:
                                                            otherStudent.Semester,

                                                        cgpa:
                                                            otherStudent.CGPA,

                                                        hostel:
                                                            otherStudent.Hostel,

                                                        studyGoal:
                                                            otherStudent.StudyGoal,

                                                        studyStyle:
                                                            otherStudent.PreferredStudyStyle,

                                                        preferredGroupSize:
                                                            otherStudent.PreferredGroupSize,

                                                        preferredLocation:
                                                            otherStudent.PreferredLocation,

                                                        commonSubjects,

                                                        overlappingAvailability,

                                                        compatibilityScore:
                                                            Number(
                                                                compatibilityScore.toFixed(2)
                                                            )
                                                    });

                                                    completed++;

                                                    if (
                                                        completed ===
                                                        students.length
                                                    ) {
                                                        sendResults();
                                                    }
                                                }
                                            );
                                        }
                                    );
                                });

                                // =============================================
                                // SORT AND RETURN MATCHES
                                // =============================================
                                function sendResults() {
                                    matches.sort(
                                        (a, b) =>
                                            b.compatibilityScore -
                                            a.compatibilityScore
                                    );

                                    return res.json(matches);
                                }
                            }
                        );
                    }
                );
            }
        );
    });
});

module.exports = router;