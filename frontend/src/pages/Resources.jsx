import { useEffect, useState } from "react";
import axios from "axios";

function Resources({ group }) {

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const [title, setTitle] = useState("");
    const [filePath, setFilePath] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const studentID = localStorage.getItem("studentID");

    // =========================
    // LOAD RESOURCES
    // =========================

    const loadResources = async () => {

        if (!group?.GroupID) {
            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            const response = await axios.get(
                `http://localhost:5000/api/resources/group/${group.GroupID}`
            );

            console.log(
                "Resources:",
                response.data
            );

            setResources(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Load resources error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load resources"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadResources();
    }, [group?.GroupID]);

    // =========================
    // ADD RESOURCE
    // =========================

    const addResource = async (e) => {

        e.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!title.trim() || !filePath.trim()) {
            setErrorMessage(
                "Please enter a title and file/link."
            );
            return;
        }

        if (!studentID) {
            setErrorMessage(
                "Student ID not found. Please log in again."
            );
            return;
        }

        try {

            setAdding(true);

            const response = await axios.post(
                "http://localhost:5000/api/resources",
                {
                    groupID: group.GroupID,
                    title: title,
                    filePath: filePath,
                    uploadedBy: studentID
                }
            );

            setSuccessMessage(
                response.data.message ||
                "Resource added successfully!"
            );

            setTitle("");
            setFilePath("");

            await loadResources();

        } catch (error) {

            console.error(
                "Add resource error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not add resource"
            );

        } finally {

            setAdding(false);

        }
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div className="page-container">

                <div className="card">

                    <h2>
                        Loading resources...
                    </h2>

                    <p className="page-subtitle">
                        Please wait while we load the shared study materials.
                    </p>

                </div>

            </div>
        );
    }

    // =========================
    // MAIN PAGE
    // =========================

    return (
        <div className="page-container">

            <h1 className="page-title">
                {group?.GroupName} - Resources
            </h1>

            <p className="page-subtitle">
                Share useful notes, files and study links with your group.
            </p>

            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}

            {/* ADD RESOURCE */}

            <div className="card">

                <h2>
                    Share Study Material
                </h2>

                <form onSubmit={addResource}>

                    <div className="form-group">

                        <label>
                            <strong>
                                Resource Title
                            </strong>
                        </label>

                        <input
                            type="text"
                            placeholder="Example: DBMS Unit 1 Notes"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            <strong>
                                File / Link
                            </strong>
                        </label>

                        <input
                            type="text"
                            placeholder="Enter file path or link"
                            value={filePath}
                            onChange={(e) =>
                                setFilePath(e.target.value)
                            }
                        />

                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={adding}
                    >
                        {adding
                            ? "Adding..."
                            : "Add Resource"}
                    </button>

                </form>

            </div>

            {/* RESOURCE LIST */}

            <div className="card">

                <h2>
                    Shared Study Materials
                </h2>

                {resources.length === 0 ? (

                    <p className="page-subtitle">
                        No study materials shared yet.
                    </p>

                ) : (

                    <div className="list">

                        {resources.map((resource) => (

                            <div
                                key={resource.ResourceID}
                                className="list-item"
                            >

                                <div>

                                    <h3>
                                        {resource.Title}
                                    </h3>

                                    <p>
                                        Uploaded by:{" "}
                                        <strong>
                                            {resource.UploaderName ||
                                                "Unknown"}
                                        </strong>
                                    </p>

                                    <span className="tag">
                                        Resource #{resource.ResourceID}
                                    </span>

                                </div>

                                <a
                                    href={resource.FilePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                >
                                    Open Resource
                                </a>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default Resources;