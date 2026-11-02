
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";
import "./../App.css";

function Chat({ chatID, otherStudentName, onRead }) {
    const studentID = Number(localStorage.getItem("studentID"));

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const loadingRef = useRef(false);
    const bottomRef = useRef(null);
    const onReadRef = useRef(onRead);
    const notifiedChatRef = useRef(null);

    // Keep the latest callback without restarting the polling effect.
    useEffect(() => {
        onReadRef.current = onRead;
    }, [onRead]);

    const loadMessages = useCallback(async () => {
        if (!chatID || !studentID || loadingRef.current) return;

        loadingRef.current = true;

        try {
            const response = await api.get(
                `/chats/${chatID}/messages`,
                { params: { studentID } }
            );

            setMessages(
                Array.isArray(response.data) ? response.data : []
            );
            setErrorMessage("");

            await api.put(`/chats/${chatID}/read`, { studentID });

            // Refresh the unread count once when opening this chat,
            // rather than triggering a parent update every 3 seconds.
            if (notifiedChatRef.current !== String(chatID)) {
                notifiedChatRef.current = String(chatID);
                onReadRef.current?.();
            }
        } catch (error) {
            console.error(
                "Load messages/read status error:",
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load messages. Please try again."
            );
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [chatID, studentID]);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setMessages([]);
        setErrorMessage("");
        notifiedChatRef.current = null;

        loadMessages();

        const interval = setInterval(() => {
            if (!cancelled) loadMessages();
        }, 3000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        const text = message.trim();

        if (!text || sending || !chatID || !studentID) return;

        try {
            setSending(true);
            setErrorMessage("");

            await api.post("/chats/message", {
                chatID: Number(chatID),
                senderID: studentID,
                messageText: text,
            });

            setMessage("");
            await loadMessages();
        } catch (error) {
            console.error("Send message error:", error);

            setErrorMessage(
                error.response?.data?.message ||
                "Could not send message."
            );
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="chat-loading">
                <div className="chat-spinner" />
                <p>Opening your conversation...</p>
            </div>
        );
    }

    return (
        <div className="chat-window">
            <header className="chat-header">
                <div>
                    <span className="chat-eyebrow">STUDYSYNC MESSAGES</span>
                    <h1>Chat with {otherStudentName || "Student"}</h1>
                </div>
                <span className="chat-status">● Connected</span>
            </header>

            {errorMessage && (
                <div className="chat-error">
                    <span>{errorMessage}</span>
                    <button type="button" onClick={loadMessages}>
                        Retry
                    </button>
                </div>
            )}

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">✦</div>
                        <h3>Start a conversation</h3>
                        <p>Send your first message below.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const mine =
                            Number(msg.SenderID) === studentID;

                        return (
                            <div
                                key={msg.MessageID}
                                className={`chat-message-row ${
                                    mine ? "mine" : "theirs"
                                }`}
                            >
                                <div
                                    className={`chat-bubble ${
                                        mine ? "mine" : "theirs"
                                    }`}
                                >
                                    {!mine && (
                                        <strong className="chat-sender">
                                            {msg.SenderName}
                                        </strong>
                                    )}

                                    <p>{msg.MessageText}</p>

                                    <small>
                                        {msg.SentAt
                                            ? new Date(
                                                  msg.SentAt
                                              ).toLocaleString()
                                            : ""}
                                    </small>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={bottomRef} />
            </div>

            <form
                className="chat-composer"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
            >
                <input
                    type="text"
                    value={message}
                    placeholder="Write a message..."
                    disabled={sending}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-label="Message"
                />

                <button
                    className="chat-send-button"
                    type="submit"
                    disabled={sending || !message.trim()}
                >
                    {sending ? "Sending..." : "Send"}
                    {!sending && <span> ↗</span>}
                </button>
            </form>
        </div>
    );
}

export default Chat;