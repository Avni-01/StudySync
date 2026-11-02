import { useEffect, useState } from "react";
import axios from "axios";

function Preferences() {
    const studentID = localStorage.getItem("studentID");

    const [formData, setFormData] = useState({
        preferredStudyStyle: "",
        preferredGroupSize: "",
        preferredLocation: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =========================
    // LOAD PREFERENCES
    // =========================

    const loadPreferences = async () => {
        if (!studentID) {
            setErrorMessage("Student ID not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:5000/api/preferences/${studentID}`
            );

            const data = response.data;

            setFormData({
                preferredStudyStyle:
                    data.PreferredStudyStyle || "",
                preferredGroupSize:
                    data.PreferredGroupSize || "",
                preferredLocation:
                    data.PreferredLocation || ""
            });
        } catch (error) {
            console.error(
                "Load preferences error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load preferences"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPreferences();
    }, []);

    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setMessage("");
        setErrorMessage("");
    };

    // =========================
    // SAVE PREFERENCES
    // =========================

    const savePreferences = async (e) => {
        e.preventDefault();

        setMessage("");
        setErrorMessage("");

        if (!studentID) {
            setErrorMessage(
                "Student ID not found. Please log in again."
            );
            return;
        }

        if (!formData.preferredStudyStyle) {
            setErrorMessage(
                "Please select your preferred study style."
            );
            return;
        }

        if (!formData.preferredGroupSize) {
            setErrorMessage(
                "Please enter your preferred group size."
            );
            return;
        }

        if (!formData.preferredLocation) {
            setErrorMessage(
                "Please select your preferred location."
            );
            return;
        }

        try {
            setSaving(true);

            const response = await axios.post(
                "http://localhost:5000/api/preferences",
                {
                    studentID: studentID,
                    preferredStudyStyle:
                        formData.preferredStudyStyle,
                    preferredGroupSize:
                        formData.preferredGroupSize,
                    preferredLocation:
                        formData.preferredLocation
                }
            );

            setMessage(
                response.data.message ||
                "Preferences saved successfully!"
            );
        } catch (error) {
            console.error(
                "Save preferences error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not save preferences"
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
                    <h2>Loading preferences...</h2>
                    <p className="page-subtitle">
                        Please wait while we load your study preferences.
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
                Study Preferences
            </h1>

            <p className="page-subtitle">
                Tell StudySync how you prefer to study.
            </p>

            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            <div className="card">

                <form onSubmit={savePreferences}>

                    {/* STUDY STYLE */}

                    <div className="form-group">

                        <label>
                            <strong>
                                Preferred Study Style
                            </strong>
                        </label>

                        <select
                            name="preferredStudyStyle"
                            value={
                                formData.preferredStudyStyle
                            }
                            onChange={handleChange}
                        >
                            <option value="">
                                Select study style
                            </option>

                            <option value="Quiet">
                                Quiet
                            </option>

                            <option value="Discussion">
                                Discussion
                            </option>

                            <option value="Mixed">
                                Mixed
                            </option>
                        </select>

                    </div>

                    {/* GROUP SIZE */}

                    <div className="form-group">

                        <label>
                            <strong>
                                Preferred Group Size
                            </strong>
                        </label>

                        <input
                            type="number"
                            name="preferredGroupSize"
                            min="1"
                            max="20"
                            value={
                                formData.preferredGroupSize
                            }
                            onChange={handleChange}
                            placeholder="Example: 3"
                        />

                    </div>

                    {/* LOCATION */}

                    <div className="form-group">

                        <label>
                            <strong>
                                Preferred Location
                            </strong>
                        </label>

                        <select
                            name="preferredLocation"
                            value={
                                formData.preferredLocation
                            }
                            onChange={handleChange}
                        >
                            <option value="">
                                Select location
                            </option>

                            <option value="Library">
                                Library
                            </option>

                            <option value="Hostel">
                                Hostel
                            </option>

                            <option value="Online">
                                Online
                            </option>

                            <option value="Classroom">
                                Classroom
                            </option>
                        </select>

                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Preferences"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Preferences;