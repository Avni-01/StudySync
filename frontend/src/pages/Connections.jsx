import { useEffect, useState } from "react";
import api from "../api";
import Chat from "./Chat";

function Connections() {
    const studentID = localStorage.getItem("studentID");

    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);

    // LOAD CONNECTIONS
    const loadConnections = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                `/connections/${studentID}`
            );

            setConnections(response.data);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Could not load connections"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentID) {
            loadConnections();
        } else {
            setLoading(false);
        }
    }, [studentID]);

    // ACCEPT REQUEST
    const acceptRequest = async (requestID) => {
        try {
            const response = await api.put(
                `/connections/accept/${requestID}`,
                { studentID: Number(studentID) }
            );

            alert(response.data.message);

            await loadConnections();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Could not accept request"
            );
        }
    };

    // REJECT REQUEST
    const rejectRequest = async (requestID) => {
        try {
            const response = await api.put(
                `/connections/reject/${requestID}`,
                { studentID: Number(studentID) }
            );

            alert(response.data.message);

            await loadConnections();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Could not reject request"
            );
        }
    };

    // OPEN CHAT
    const openChat = async (connection) => {
        try {
            const otherStudentID =
                Number(connection.SenderID) === Number(studentID)
                    ? connection.ReceiverID
                    : connection.SenderID;

            const response = await api.post("/chats/personal", {
                student1ID: Number(studentID),
                student2ID: Number(otherStudentID),
            });

            setSelectedChat({
                chatID: response.data.chatID,
                name: connection.Name,
            });
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Could not open chat"
            );
        }
    };

    // CHAT PAGE
    if (selectedChat) {
        return (
            <div>
                <button
                    className="btn-secondary"
                    style={{ marginBottom: 16 }}
                    onClick={() => setSelectedChat(null)}
                >
                    ← Back to Connections
                </button>

                <Chat
                    chatID={selectedChat.chatID}
                    otherStudentName={selectedChat.name}
                />
            </div>
        );
    }

    if (loading) {
        return <h2>Loading connections...</h2>;
    }

    return (
        <div>
            <h1>My Connections</h1>

            {connections.length === 0 ? (
                <p>No connection requests yet.</p>
            ) : (
                connections.map((connection) => (
                    <div
                        key={connection.RequestID}
                        className="card"
                    >
                        <h2>{connection.Name}</h2>

                        <p>Status: {connection.Status}</p>

                        {connection.Status === "Pending" &&
                            Number(connection.ReceiverID) ===
                                Number(studentID) && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        marginTop: 14,
                                    }}
                                >
                                    <button
                                        className="btn"
                                        onClick={() =>
                                            acceptRequest(
                                                connection.RequestID
                                            )
                                        }
                                    >
                                        Accept
                                    </button>

                                    <button
                                        className="btn btn-danger"
                                        onClick={() =>
                                            rejectRequest(
                                                connection.RequestID
                                            )
                                        }
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}

                        {connection.Status === "Accepted" && (
                            <button
                                className="btn"
                                style={{ marginTop: 14 }}
                                onClick={() => openChat(connection)}
                            >
                                Chat
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default Connections;