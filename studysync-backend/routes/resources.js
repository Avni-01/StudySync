const express = require("express");
const db = require("../db");

const router = express.Router();

// =====================================================
// ADD RESOURCE
// POST /api/resources
// =====================================================
router.post("/", (req, res) => {
    const {
        groupID,
        title,
        filePath,
        uploadedBy
    } = req.body;

    if (
        !groupID ||
        !title ||
        !filePath ||
        !uploadedBy
    ) {
        return res.status(400).json({
            message:
                "GroupID, title, file path and uploader are required"
        });
    }

    const query = `
        INSERT INTO Resources
        (GroupID, Title, FilePath, UploadedBy)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [
            groupID,
            title.trim(),
            filePath.trim(),
            uploadedBy
        ],
        (err, result) => {
            if (err) {
                console.error(
                    "Add resource error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not add resource"
                });
            }

            res.status(201).json({
                message:
                    "Resource added successfully",
                resourceID:
                    result.insertId
            });
        }
    );
});

// =====================================================
// GET RESOURCES OF GROUP
// GET /api/resources/group/:groupID
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
            r.ResourceID,
            r.GroupID,
            r.Title,
            r.FilePath,
            r.UploadDate,
            r.UploadedBy,
            s.Name AS UploaderName
        FROM Resources r
        JOIN Student s
            ON r.UploadedBy = s.StudentID
        WHERE r.GroupID = ?
        ORDER BY r.UploadDate DESC
    `;

    db.query(
        query,
        [groupID],
        (err, results) => {
            if (err) {
                console.error(
                    "Get resources error:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Could not load resources"
                });
            }

            res.json(results);
        }
    );
});

module.exports = router;