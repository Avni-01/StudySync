import { useEffect, useState } from "react";
import axios from "axios";
import Feedback from "./Feedback";

function Sessions({ group }) {

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [sessionDate, setSessionDate] = useState("");
    const [sessionTime, setSessionTime] = useState("");
    const [venue, setVenue] = useState("");

    const [creating, setCreating] = useState(false);

    const [selectedSession, setSelectedSession] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    const [selectedFeedbackSession, setSelectedFeedbackSession] =
        useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const studentID = localStorage.getItem("studentID");

    // =========================
    // LOAD SESSIONS
    // =========================

    const loadSessions = async () => {

        if (!group?.GroupID) {
            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            const response = await axios.get(
                `http://localhost:5000/api/sessions/group/${group.GroupID}`
            );

            console.log(
                "Sessions:",
                response.data
            );

            setSessions(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Load sessions error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load study sessions"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadSessions();
    }, [group?.GroupID]);

    // =========================
    // CREATE SESSION
    // =========================

    const createSession = async (e) => {

        e.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!sessionDate || !sessionTime) {
            setErrorMessage(
                "Please select a date and time."
            );
            return;
        }

        try {

            setCreating(true);

            const response = await axios.post(
                "http://localhost:5000/api/sessions",
                {
                    groupID: group.GroupID,
                    sessionDate: sessionDate,
                    sessionTime: sessionTime,
                    venue: venue
                }
            );

            setSuccessMessage(
                response.data.message ||
                "Study session created successfully!"
            );

            setSessionDate("");
            setSessionTime("");
            setVenue("");

            await loadSessions();

        } catch (error) {

            console.error(
                "Create session error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not create study session"
            );

        } finally {

            setCreating(false);

        }
    };

    // =========================
    // VIEW ATTENDANCE
    // =========================

    const viewAttendance = async (session) => {

        setSelectedSession(session);
        setAttendanceLoading(true);
        setErrorMessage("");

        try {

            const response = await axios.get(
                `http://localhost:5000/api/sessions/${session.SessionID}/attendance`
            );

            console.log(
                "Attendance:",
                response.data
            );

            setAttendance(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "View attendance error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load attendance"
            );

        } finally {

            setAttendanceLoading(false);

        }
    };

    // =========================
    // MARK ATTENDANCE
    // =========================

    const markAttendance = async (status) => {

        if (!selectedSession) {

            setErrorMessage(
                "Please select a session first."
            );

            return;
        }

        if (!studentID) {

            setErrorMessage(
                "Student ID not found. Please log in again."
            );

            return;
        }

        setErrorMessage("");
        setSuccessMessage("");

        try {

            const response = await axios.post(
                "http://localhost:5000/api/sessions/attendance",
                {
                    sessionID:
                        selectedSession.SessionID,

                    studentID:
                        studentID,

                    status:
                        status
                }
            );

            setSuccessMessage(
                response.data.message ||
                "Attendance marked successfully!"
            );

            await viewAttendance(selectedSession);

        } catch (error) {

            console.error(
                "Mark attendance error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not mark attendance"
            );

        }
    };

    // =========================
    // FEEDBACK SCREEN
    // =========================

    if (selectedFeedbackSession) {

        return (
            <div className="page-container">

                <button
                    className="btn btn-secondary"
                    onClick={() =>
                        setSelectedFeedbackSession(null)
                    }
                >
                    ← Back to Sessions
                </button>

                <Feedback
                    session={selectedFeedbackSession}
                />

            </div>
        );
    }

    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (
            <div className="page-container">

                <div className="card">

                    <h2>
                        Loading study sessions...
                    </h2>

                    <p className="page-subtitle">
                        Please wait while we load the sessions.
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
                {group?.GroupName} - Study Sessions
            </h1>

            <p className="page-subtitle">
                Schedule study sessions and keep track of attendance.
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

            {/* CREATE SESSION */}

            <div className="card">

                <h2>
                    Create Study Session
                </h2>

                <form onSubmit={createSession}>

                    <div className="form-group">

                        <label>
                            <strong>Date</strong>
                        </label>

                        <input
                            type="date"
                            value={sessionDate}
                            onChange={(e) =>
                                setSessionDate(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            <strong>Time</strong>
                        </label>

                        <input
                            type="time"
                            value={sessionTime}
                            onChange={(e) =>
                                setSessionTime(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            <strong>Venue</strong>
                        </label>

                        <input
                            type="text"
                            placeholder="Library / Classroom / Online"
                            value={venue}
                            onChange={(e) =>
                                setVenue(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                    <button
                        type="submit"
                        className="btn"
                        disabled={creating}
                    >
                        {creating
                            ? "Creating..."
                            : "Create Session"}
                    </button>

                </form>

            </div>

            {/* SESSION LIST */}

            <div className="card">

                <h2>
                    Study Sessions
                </h2>

                {sessions.length === 0 ? (

                    <p className="page-subtitle">
                        No study sessions created yet.
                    </p>

                ) : (

                    <div className="list">

                        {sessions.map((session) => (

                            <div
                                key={session.SessionID}
                                className="list-item"
                            >

                                <div>

                                    <h3>
                                        Study Session
                                    </h3>

                                    <p>
                                        <strong>
                                            Date:
                                        </strong>{" "}
                                        {session.SessionDate}
                                    </p>

                                    <p>
                                        <strong>
                                            Time:
                                        </strong>{" "}
                                        {session.SessionTime}
                                    </p>

                                    <p>
                                        <strong>
                                            Venue:
                                        </strong>{" "}
                                        {session.Venue ||
                                            "Not specified"}
                                    </p>

                                </div>

                                <div>

                                    <button
                                        className="btn"
                                        onClick={() =>
                                            viewAttendance(
                                                session
                                            )
                                        }
                                    >
                                        View Attendance
                                    </button>

                                    {" "}

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setSelectedFeedbackSession(
                                                session
                                            )
                                        }
                                    >
                                        Give Feedback
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

            {/* ATTENDANCE */}

            {selectedSession && (

                <div className="card">

                    <h2>
                        Attendance for Study Session
                    </h2>

                    <div className="list">

                        <div className="list-item">
                            <strong>Date</strong>
                            <span>
                                {selectedSession.SessionDate}
                            </span>
                        </div>

                        <div className="list-item">
                            <strong>Time</strong>
                            <span>
                                {selectedSession.SessionTime}
                            </span>
                        </div>

                        <div className="list-item">
                            <strong>Venue</strong>
                            <span>
                                {selectedSession.Venue ||
                                    "Not specified"}
                            </span>
                        </div>

                    </div>

                    <h3>
                        Mark Your Attendance
                    </h3>

                    <button
                        className="btn"
                        onClick={() =>
                            markAttendance("Present")
                        }
                    >
                        I am Present
                    </button>

                    {" "}

                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            markAttendance("Absent")
                        }
                    >
                        I am Absent
                    </button>

                    <hr />

                    <h3>
                        Attendance Records
                    </h3>

                    {attendanceLoading ? (

                        <p>
                            Loading attendance...
                        </p>

                    ) : attendance.length === 0 ? (

                        <p className="page-subtitle">
                            No attendance has been marked yet.
                        </p>

                    ) : (

                        <div className="list">

                            {attendance.map((record) => (

                                <div
                                    key={
                                        record.AttendanceID
                                    }
                                    className="list-item"
                                >

                                    <div>

                                        <strong>
                                            {record.Name}
                                        </strong>

                                        <p>
                                            Student ID:{" "}
                                            {record.StudentID}
                                        </p>

                                    </div>

                                    <span className="tag">
                                        {record.Status}
                                    </span>

                                </div>

                            ))}

                        </div>

                    )}

                    <br />

                    <button
                        className="btn btn-secondary"
                        onClick={() => {

                            setSelectedSession(null);
                            setAttendance([]);

                        }}
                    >
                        Close Attendance
                    </button>

                </div>

            )}

        </div>
    );
}

export default Sessions;