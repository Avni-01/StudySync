
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import Chat from "./Chat";

function Chats() {
    const studentID = Number(localStorage.getItem("studentID"));

    const [connections, setConnections] = useState([]);
    const [unreadChats, setUnreadChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);

    const loadChats = useCallback(async (showLoading = false) => {
        if (!studentID) {
            setConnections([]);
            setUnreadChats([]);
            setLoading(false);
            return;
        }

        if (showLoading) setLoading(true);

        try {
            const [connectionsResponse, unreadResponse] =
                await Promise.all([
                    api.get(`/connections/${studentID}`),
                    api.get(`/chats/unread/${studentID}`),
                ]);

            const data = Array.isArray(connectionsResponse.data)
                ? connectionsResponse.data
                : [];

            setConnections(
                data.filter((item) => item.Status === "Accepted")
            );

            setUnreadChats(
                Array.isArray(unreadResponse.data)
                    ? unreadResponse.data
                    : []
            );
        } catch (error) {
            console.error(
                "Load chats/unread counts error:",
                error.response?.status,
                error.response?.data || error.message
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [studentID]);

    useEffect(() => {
        loadChats(true);

        const interval = setInterval(() => {
            // Do not refresh the list while a conversation is open.
            if (!selectedChat) loadChats(false);
        }, 5000);

        return () => clearInterval(interval);
    }, [loadChats, selectedChat]);

    const openChat = async (connection) => {
        const otherStudentID =
            Number(connection.SenderID) === studentID
                ? Number(connection.ReceiverID)
                : Number(connection.SenderID);

        try {
            const response = await api.post("/chats/personal", {
                student1ID: studentID,
                student2ID: otherStudentID,
            });

            setSelectedChat({
                chatID: response.data.chatID,
                name: connection.Name,
            });

            // Refresh when returning to the chat list.
        } catch (error) {
            console.error("Could not open chat:", error);

            alert(
                error.response?.data?.message ||
                "Could not open chat."
            );
        }
    };

    if (loading) return <h2>Loading chats...</h2>;

    if (selectedChat) {
        return (
            <div>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                        setSelectedChat(null);
                        await loadChats(true);
                    }}
                >
                    ← Back to Chats
                </button>

                <Chat
                    chatID={selectedChat.chatID}
                    otherStudentName={selectedChat.name}
                    onRead={() => loadChats(false)}
                />
            </div>
        );
    }

    return (
        <div>
            <h1>My Chats</h1>

            {connections.length === 0 ? (
                <p>No accepted connections available for chat.</p>
            ) : (
                connections.map((connection) => {
                    const otherStudentID =
                        Number(connection.SenderID) === studentID
                            ? Number(connection.ReceiverID)
                            : Number(connection.SenderID);

                    const unreadChat = unreadChats.find(
                        (chat) =>
                            Number(chat.OtherStudentID) ===
                            otherStudentID
                    );

                    const unreadCount = Number(
                        unreadChat?.UnreadCount || 0
                    );

                    return (
                        <div
                            key={connection.RequestID}
                            className="card chat-list-card"
                        >
                            <div className="chat-list-person">
                                {unreadCount > 0 && (
                                    <span
                                        className="unread-dot"
                                        title="Unread messages"
                                    />
                                )}

                                <div>
                                    <h2>{connection.Name}</h2>

                                    {unreadCount > 0 && (
                                        <p className="unread-label">
                                            {unreadCount} new message
                                            {unreadCount === 1 ? "" : "s"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn"
                                onClick={() => openChat(connection)}
                            >
                                Open Chat
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default Chats;