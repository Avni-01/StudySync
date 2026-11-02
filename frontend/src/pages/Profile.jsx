
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

function Profile() {
    const studentID = localStorage.getItem("studentID");

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        collegeID: "",
        branch: "",
        semester: "",
        cgpa: "",
        hostel: "",
        studyGoal: "",
    });

    const [formData, setFormData] = useState({
        cgpa: "",
        hostel: "",
        studyGoal: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Load the student's profile
    const loadProfile = useCallback(async () => {
        if (!studentID) {
            setErrorMessage("Student ID not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const response = await axios.get(
                `http://localhost:5000/api/profile/${studentID}`
            );

            const data = response.data;

            setProfile({
                name: data.Name || "",
                email: data.Email || "",
                collegeID: data.CollegeID ?? "",
                branch: data.Branch || "",
                semester: data.Semester ?? "",
                cgpa: data.CGPA ?? "",
                hostel: data.Hostel || "",
                studyGoal: data.StudyGoal || "",
            });

            setFormData({
                cgpa: data.CGPA ?? "",
                hostel: data.Hostel || "",
                studyGoal: data.StudyGoal || "",
            });
        } catch (error) {
            console.error("Load profile error:", error);

            setErrorMessage(
                error.response?.data?.message ||
                    "Could not load profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [studentID]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Handle changes in editable fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    // Update the student's study profile
    const updateProfile = async (e) => {
        e.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!studentID) {
            setErrorMessage("Student ID not found. Please log in again.");
            return;
        }

        if (
            formData.cgpa === "" ||
            !Number.isFinite(Number(formData.cgpa)) ||
            Number(formData.cgpa) < 0 ||
            Number(formData.cgpa) > 10
        ) {
            setErrorMessage("Please enter a valid CGPA between 0 and 10.");
            return;
        }

        try {
            setSaving(true);

            const response = await axios.post(
                "http://localhost:5000/api/profile",
                {
                    studentID: Number(studentID),
                    cgpa: Number(formData.cgpa),
                    hostel: formData.hostel.trim(),
                    studyGoal: formData.studyGoal.trim(),
                }
            );

            setSuccessMessage(
                response.data.message || "Profile updated successfully!"
            );

            await loadProfile();
        } catch (error) {
            console.error("Update profile error:", error);

            setErrorMessage(
                error.response?.data?.message ||
                    "Could not update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Loading screen
    if (loading) {
        return (
            <div className="page-container">
                <div className="card">
                    <h2>Loading profile...</h2>
                    <p className="page-subtitle">
                        Please wait while we load your profile.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">My Profile</h1>

            <p className="page-subtitle">
                View and update your StudySync profile.
            </p>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}

            {successMessage && (
                <div className="success-message">{successMessage}</div>
            )}

            {/* Student Information */}
            <div className="card">
                <h2>Student Information</h2>

                <div className="list">
                    <div className="list-item profile-info-item">
                        <strong>Name:</strong>
                        <span>{profile.name || "Not available"}</span>
                    </div>

                    <div className="list-item profile-info-item">
                        <strong>Email:</strong>
                        <span>{profile.email || "Not available"}</span>
                    </div>

                    <div className="list-item profile-info-item">
                        <strong>College ID:</strong>
                        <span>
                            {profile.collegeID !== ""
                                ? profile.collegeID
                                : "Not available"}
                        </span>
                    </div>

                    <div className="list-item profile-info-item">
                        <strong>Branch:</strong>
                        <span>{profile.branch || "Not available"}</span>
                    </div>

                    <div className="list-item profile-info-item">
                        <strong>Semester:</strong>
                        <span>
                            {profile.semester !== ""
                                ? profile.semester
                                : "Not available"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Editable Study Profile */}
            <div className="card">
                <h2>Study Profile</h2>

                <p className="page-subtitle">
                    These details help StudySync find better study partners
                    for you.
                </p>

                <form onSubmit={updateProfile}>
                    <div className="form-group">
                        <label htmlFor="profile-cgpa">
                            <strong>CGPA</strong>
                        </label>

                        <input
                            id="profile-cgpa"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            name="cgpa"
                            value={formData.cgpa}
                            onChange={handleChange}
                            placeholder="Enter CGPA"
                            disabled={saving}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="profile-hostel">
                            <strong>Hostel</strong>
                        </label>

                        <input
                            id="profile-hostel"
                            type="text"
                            name="hostel"
                            value={formData.hostel}
                            onChange={handleChange}
                            placeholder="Enter hostel"
                            disabled={saving}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="profile-study-goal">
                            <strong>Study Goal</strong>
                        </label>

                        <input
                            id="profile-study-goal"
                            type="text"
                            name="studyGoal"
                            value={formData.studyGoal}
                            onChange={handleChange}
                            placeholder="Example: Exam Preparation"
                            disabled={saving}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={saving}
                    >
                        {saving ? "Updating..." : "Update Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Profile;
