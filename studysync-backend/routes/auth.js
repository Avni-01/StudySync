const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// =====================================
// HELPER: IDENTIFY COLLEGE
// =====================================

function getCollegeID(registrationNumber) {
  const regNumber = registrationNumber.trim().toUpperCase();

  if (regNumber.startsWith("VITV")) {
    return "VITV";
  }

  if (regNumber.startsWith("IITB")) {
    return "IITB";
  }

  if (regNumber.startsWith("SRM")) {
    return "SRM";
  }

  return null;
}

// =====================================
// REGISTER
// POST /api/auth/register
// =====================================

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    registrationNumber,
    branch,
    semester,
  } = req.body;

  // Validate required fields.
  if (
    !name?.trim() ||
    !email?.trim() ||
    !password ||
    !registrationNumber?.trim()
  ) {
    return res.status(400).json({
      message:
        "Name, email, password, and college registration number are required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must contain at least 6 characters.",
    });
  }

  if (
    semester !== undefined &&
    semester !== null &&
    semester !== "" &&
    (!Number.isInteger(Number(semester)) || Number(semester) < 1)
  ) {
    return res.status(400).json({
      message: "Semester must be a positive whole number.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const normalizedRegistrationNumber =
    registrationNumber.trim().toUpperCase();

  // Automatically identify college from registration number.
  const collegeID = getCollegeID(normalizedRegistrationNumber);

  if (!collegeID) {
    return res.status(400).json({
      message:
        "Unsupported registration number. " +
        "Currently supported prefixes are VITV, IITB, and SRM.",
    });
  }

  try {
    // Check whether the detected college exists.
    db.query(
      "SELECT CollegeID FROM College WHERE CollegeID = ?",
      [collegeID],
      (collegeError, colleges) => {
        if (collegeError) {
          console.error("College lookup error:", collegeError);

          return res.status(500).json({
            message: "Database error while checking the college.",
          });
        }

        if (colleges.length === 0) {
          return res.status(400).json({
            message:
              `College ID ${collegeID} does not exist in the College table. ` +
              "Please add the college before registering students.",
          });
        }

        // Check whether email is already registered.
        db.query(
          "SELECT StudentID FROM Student WHERE Email = ?",
          [normalizedEmail],
          async (emailError, students) => {
            if (emailError) {
              console.error("Email lookup error:", emailError);

              return res.status(500).json({
                message: "Database error while checking the email.",
              });
            }

            if (students.length > 0) {
              return res.status(409).json({
                message:
                  "Email already registered. Please log in instead.",
              });
            }

            try {
              // Hash password before storing it.
              const hashedPassword = await bcrypt.hash(password, 10);

              const insertSQL = `
                INSERT INTO Student
                (
                  CollegeID,
                  Name,
                  Email,
                  Password,
                  Branch,
                  Semester,
                  RegistrationNumber
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `;

              const values = [
                collegeID,
                name.trim(),
                normalizedEmail,
                hashedPassword,
                branch?.trim() || null,
                semester === undefined ||
                semester === null ||
                semester === ""
                  ? null
                  : Number(semester),
                normalizedRegistrationNumber,
              ];

              db.query(insertSQL, values, (insertError, result) => {
                if (insertError) {
                  console.error(
                    "Register student error:",
                    insertError
                  );

                  if (insertError.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                      message:
                        "This email or registration number is already registered.",
                    });
                  }

                  if (
                    insertError.code === "ER_NO_REFERENCED_ROW_2" ||
                    insertError.code === "ER_NO_REFERENCED_ROW"
                  ) {
                    return res.status(400).json({
                      message:
                        "The selected college does not exist in the database.",
                    });
                  }

                  return res.status(500).json({
                    message: "Could not register student.",
                  });
                }

                return res.status(201).json({
                  message:
                    `Student registered successfully under ${collegeID}. Please log in.`,
                  studentID: result.insertId,
                  collegeID: collegeID,
                });
              });
            } catch (hashError) {
              console.error(
                "Password hashing error:",
                hashError
              );

              return res.status(500).json({
                message: "Could not process registration.",
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error during registration.",
    });
  }
});

// =====================================
// LOGIN
// POST /api/auth/login
// =====================================

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      message: "Please provide email and password.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const sql = `
    SELECT StudentID, Name, Email, Password, CollegeID
    FROM Student
    WHERE Email = ?
  `;

  db.query(sql, [normalizedEmail], async (err, results) => {
    if (err) {
      console.error("Login database error:", err);

      return res.status(500).json({
        message: "Database error during login.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Email is not registered. Please sign up.",
      });
    }

    const student = results[0];

    try {
      const passwordMatch = await bcrypt.compare(
        password,
        student.Password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Incorrect password. Please try again.",
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing from the .env file.");

        return res.status(500).json({
          message: "Server authentication is not configured.",
        });
      }

      const token = jwt.sign(
        {
          studentID: student.StudentID,
          email: student.Email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        studentID: student.StudentID,
        name: student.Name,
        collegeID: student.CollegeID,
      });
    } catch (loginError) {
      console.error("Login error:", loginError);

      return res.status(500).json({
        message: "Server error during login.",
      });
    }
  });
});

module.exports = router;