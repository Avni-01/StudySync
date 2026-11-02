
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

function Matches() {
    const studentID = localStorage.getItem("studentID");

    const [matches, setMatches] = useState([]);
    const [connectionStatuses, setConnectionStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sendingRequest, setSendingRequest] = useState(null);
    const [copiedID, setCopiedID] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch study partners and their connection statuses
    const fetchMatches = useCallback(async () => {
        if (!studentID) {
            setError("Please log in to find study partners.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [matchesResponse, connectionsResponse] =
                await Promise.all([
                    axios.get(
                        `${API_BASE}/matching/${encodeURIComponent(studentID)}`
                    ),
                    axios.get(
                        `${API_BASE}/connections/${encodeURIComponent(studentID)}`
                    )
                ]);

            const matchData = matchesResponse.data;
            const connectionData = connectionsResponse.data;

            setMatches(
                Array.isArray(matchData)
                    ? matchData
                    : Array.isArray(matchData?.matches)
                    ? matchData.matches
                    : []
            );

            setConnectionStatuses(
                Array.isArray(connectionData)
                    ? connectionData
                    : Array.isArray(connectionData?.connections)
                    ? connectionData.connections
                    : []
            );
        } catch (err) {
            console.error("Error loading study partners:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load study partners. Check that your backend is running."
            );
        } finally {
            setLoading(false);
        }
    }, [studentID]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Copy Student ID
    const copyStudentID = async (id) => {
        try {
            await navigator.clipboard.writeText(String(id));
            setCopiedID(String(id));

            window.setTimeout(() => {
                setCopiedID((current) =>
                    current === String(id) ? null : current
                );
            }, 2000);
        } catch (err) {
            console.error("Copy failed:", err);
            window.prompt("Copy this Student ID:", String(id));
        }
    };

    // Search by name, college, branch, or Student ID
    const filteredMatches = matches.filter((match) => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return true;

        const searchableFields = [
            match.name,
            match.Name,
            match.collegeName,
            match.CollegeName,
            match.college_name,
            match.branch,
            match.Branch,
            match.studentID,
            match.StudentID
        ];

        return searchableFields.some((field) =>
            String(field ?? "").toLowerCase().includes(query)
        );
    });

    // Find an existing connection between students
    const getConnectionStatus = (matchID) => {
        const connection = connectionStatuses.find((item) => {
            const sender = String(
                item.SenderID ?? item.senderID ?? item.senderId ?? ""
            );

            const receiver = String(
                item.ReceiverID ?? item.receiverID ?? item.receiverId ?? ""
            );

            return (
                (sender === String(studentID) &&
                    receiver === String(matchID)) ||
                (sender === String(matchID) &&
                    receiver === String(studentID))
            );
        });

        if (!connection) return null;

        return String(
            connection.Status ?? connection.status ?? ""
        ).toLowerCase();
    };

    // Send a connection request
    const handleConnect = async (matchID) => {
        if (!studentID || matchID == null) return;
        if (String(studentID) === String(matchID)) return;

        setSendingRequest(String(matchID));
        setError("");

        try {
            await axios.post(`${API_BASE}/connections/request`, {
                senderID: studentID,
                receiverID: matchID
            });

            await fetchMatches();
        } catch (err) {
            console.error("Connection request failed:", err);

            setError(
                err.response?.data?.message ||
                "Could not send the connection request. Please try again."
            );
        } finally {
            setSendingRequest(null);
        }
    };

    // Display the correct connection button
    const renderConnectionButton = (matchID) => {
        const status = getConnectionStatus(matchID);
        const isSending = sendingRequest === String(matchID);

        if (status === "accepted") {
            return (
                <button className="btn" type="button" disabled>
                    Connected
                </button>
            );
        }

        if (status === "pending") {
            return (
                <button className="btn" type="button" disabled>
                    Request Pending
                </button>
            );
        }

        if (status === "rejected") {
            return (
                <button className="btn" type="button" disabled>
                    Request Declined
                </button>
            );
        }

        return (
            <button
                className="btn"
                type="button"
                disabled={isSending || matchID == null}
                onClick={() => handleConnect(matchID)}
            >
                {isSending ? "Sending..." : "Connect"}
            </button>
        );
    };

    // Loading screen
    if (loading) {
        return (
            <div className="page-container">
                <h1 className="page-title">Find Study Partners</h1>
                <p className="page-subtitle">
                    Finding students who match your preferences...
                </p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="page-title">Find Study Partners</h1>

            <p className="page-subtitle">
                Discover students with similar subjects, goals,
                and study preferences.
            </p>

            {/* Search bar */}
            <div className="partner-search">
                <input
                    type="search"
                    className="partner-search-input"
                    placeholder="Search by student name..."
                    aria-label="Search study partners"
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                />

                {searchTerm && (
                    <button
                        type="button"
                        className="partner-search-clear"
                        onClick={() => setSearchTerm("")}
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            <button
                type="button"
                className="btn"
                onClick={fetchMatches}
                disabled={loading}
            >
                Refresh Matches
            </button>

            {/* No matches */}
            {!error && matches.length === 0 && (
                <div className="card">
                    <p>No study partners found yet.</p>
                    <p>Check back later for new matches.</p>
                </div>
            )}

            {/* Search has no results */}
            {!error &&
                matches.length > 0 &&
                filteredMatches.length === 0 && (
                    <div className="card">
                        <p>
                            No study partners match "{searchTerm}".
                        </p>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setSearchTerm("")}
                        >
                            Show All Partners
                        </button>
                    </div>
                )}

            {/* Study partner cards */}
            <div className="matches-list">
                {filteredMatches.map((match, index) => {
                    const id = match.studentID ?? match.StudentID;

                    const name =
                        match.name || match.Name || "Student";

                    const collegeName =
                        match.collegeName?.trim?.() ||
                        match.CollegeName?.trim?.() ||
                        match.college_name?.trim?.() ||
                        "College unavailable";

                    return (
                        <div className="card" key={id ?? index}>
                            {/* Name, college, and Student ID */}
                            <div className="partner-card-header">
                                <h2>{name}</h2>

                                <p className="partner-college-name">
                                    <strong>College:</strong>{" "}
                                    {collegeName}
                                </p>

                                <div className="partner-student-id">
                                    <span>
                                        <strong>Student ID:</strong>{" "}
                                        {id ?? "Unavailable"}
                                    </span>

                                    {id != null && (
                                        <button
                                            type="button"
                                            className="copy-student-id"
                                            onClick={() =>
                                                copyStudentID(id)
                                            }
                                        >
                                            {copiedID === String(id)
                                                ? "Copied!"
                                                : "Copy ID"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Student details */}
                            <div className="match-details">
                                <p>
                                    <strong>Branch:</strong>{" "}
                                    {match.branch ??
                                        match.Branch ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>Semester:</strong>{" "}
                                    {match.semester ??
                                        match.Semester ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>CGPA:</strong>{" "}
                                    {match.cgpa ??
                                        match.CGPA ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>Study Goal:</strong>{" "}
                                    {match.studyGoal ??
                                        match.StudyGoal ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>Study Style:</strong>{" "}
                                    {match.studyStyle ??
                                        match.PreferredStudyStyle ??
                                        match.preferredStudyStyle ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>Preferred Group Size:</strong>{" "}
                                    {match.preferredGroupSize ??
                                        match.PreferredGroupSize ??
                                        "Not specified"}
                                </p>

                                <p>
                                    <strong>Preferred Location:</strong>{" "}
                                    {match.preferredLocation ??
                                        match.PreferredLocation ??
                                        "Not specified"}
                                </p>
                            </div>

                            {/* Common subjects */}
                            <div className="match-section">
                                <h3>Common Subjects</h3>

                                {Array.isArray(match.commonSubjects) &&
                                match.commonSubjects.length > 0 ? (
                                    <div className="list">
                                        {match.commonSubjects.map(
                                            (subject, subjectIndex) => (
                                                <span
                                                    className="tag"
                                                    key={subjectIndex}
                                                >
                                                    {typeof subject === "object"
                                                        ? subject?.SubjectName ||
                                                          subject?.subjectName ||
                                                          subject?.name ||
                                                          "Subject"
                                                        : subject}
                                                </span>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p>No common subjects listed.</p>
                                )}
                            </div>

                            {/* Overlapping availability */}
                            <div className="match-section">
                                <h3>Overlapping Availability</h3>

                                {Array.isArray(
                                    match.overlappingAvailability
                                ) &&
                                match.overlappingAvailability.length > 0 ? (
                                    <ul className="list">
                                        {match.overlappingAvailability.map(
                                            (time, timeIndex) => (
                                                <li
                                                    className="list-item"
                                                    key={timeIndex}
                                                >
                                                    {typeof time === "object"
                                                        ? [
                                                              time.day ??
                                                                  time.DayOfWeek,
                                                              time.startTime ??
                                                                  time.StartTime,
                                                              time.endTime ??
                                                                  time.EndTime
                                                          ]
                                                              .filter(Boolean)
                                                              .join(" · ")
                                                        : time}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <p>
                                        No overlapping availability found.
                                    </p>
                                )}
                            </div>

                            {/* Compatibility score */}
                            <div className="match-score">
                                <strong>Compatibility Score:</strong>{" "}
                                {match.compatibilityScore ??
                                    match.CompatibilityScore ??
                                    0}%
                            </div>

                            {/* Connection request */}
                            <div className="match-actions">
                                {renderConnectionButton(id)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Matches;