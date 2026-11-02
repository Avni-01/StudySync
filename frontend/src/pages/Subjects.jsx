import { useEffect, useState } from "react";
import axios from "axios";

function Subjects() {

    const studentID =
        localStorage.getItem("studentID");

    const [subjects, setSubjects] =
        useState([]);

    const [selectedSubjects, setSelectedSubjects] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    // =========================
    // LOAD SUBJECTS
    // =========================

    const loadSubjects = async () => {

        if (!studentID) {
            setErrorMessage(
                "Student ID not found. Please log in again."
            );

            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            // Get all subjects

            const allSubjectsResponse =
                await axios.get(
                    "http://localhost:5000/api/subjects"
                );

            setSubjects(
                Array.isArray(
                    allSubjectsResponse.data
                )
                    ? allSubjectsResponse.data
                    : []
            );

            // Get subjects already selected

            const studentSubjectsResponse =
                await axios.get(
                    `http://localhost:5000/api/subjects/student/${studentID}`
                );

            const studentSubjects =
                Array.isArray(
                    studentSubjectsResponse.data
                )
                    ? studentSubjectsResponse.data
                    : [];

            setSelectedSubjects(
                studentSubjects.map(
                    (subject) =>
                        subject.SubjectID
                )
            );

        } catch (error) {

            console.error(
                "Load subjects error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load subjects"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    // =========================
    // HANDLE SUBJECT
    // =========================

    const handleSubjectChange =
        (subjectID) => {

            setErrorMessage("");
            setSuccessMessage("");

            if (
                selectedSubjects.includes(
                    subjectID
                )
            ) {

                setSelectedSubjects(
                    selectedSubjects.filter(
                        (id) =>
                            id !== subjectID
                    )
                );

            } else {

                setSelectedSubjects([
                    ...selectedSubjects,
                    subjectID
                ]);

            }
        };

    // =========================
    // SAVE SUBJECTS
    // =========================

    const saveSubjects = async () => {

        setErrorMessage("");
        setSuccessMessage("");

        if (
            selectedSubjects.length === 0
        ) {

            setErrorMessage(
                "Please select at least one subject."
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

            setSaving(true);

            const response =
                await axios.post(
                    "http://localhost:5000/api/subjects/student",
                    {
                        studentID:
                            studentID,

                        subjectIDs:
                            selectedSubjects
                    }
                );

            setSuccessMessage(
                response.data.message ||
                "Subjects saved successfully!"
            );

        } catch (error) {

            console.error(
                "Save subjects error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not save subjects"
            );

        } finally {

            setSaving(false);

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
                        Loading subjects...
                    </h2>

                    <p className="page-subtitle">
                        Please wait while we load your subjects.
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
                My Subjects
            </h1>

            <p className="page-subtitle">
                Select the subjects you are studying.
                StudySync uses these subjects to find compatible study partners.
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

            <div className="card">

                <h2>
                    Available Subjects
                </h2>

                {subjects.length === 0 ? (

                    <p className="page-subtitle">
                        No subjects are available.
                    </p>

                ) : (

                    <div className="list">

                        {subjects.map(
                            (subject) => (

                                <div
                                    key={
                                        subject.SubjectID
                                    }
                                    className="list-item"
                                >

                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            width: "100%",
                                            cursor: "pointer"
                                        }}
                                    >

                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.includes(
                                                subject.SubjectID
                                            )}
                                            onChange={() =>
                                                handleSubjectChange(
                                                    subject.SubjectID
                                                )
                                            }
                                        />

                                        <span>
                                            {
                                                subject.SubjectName
                                            }
                                        </span>

                                    </label>

                                </div>

                            )
                        )}

                    </div>

                )}

                <br />

                <button
                    className="btn"
                    onClick={saveSubjects}
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Subjects"}
                </button>

            </div>

        </div>
    );
}

export default Subjects;