
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const GroupChat = ({ chatID, groupName }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const messagesEndRef = useRef(null);
    const studentID = Number(localStorage.getItem("studentID"));

    const loadMessages = async () => {
        if (!chatID || !studentID || Number.isNaN(studentID)) {
            setErrorMessage("Chat or student ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setErrorMessage("");

            const response = await axios.get(
                `http://localhost:5000/api/chats/${chatID}/messages`,
                { params: { studentID } }
            );

            setMessages(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (error) {
            console.error("Load messages error:", error.response?.data || error.message);
            setErrorMessage(
                error.response?.data?.message || "Could not load messages."
            );
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (event) => {
        event.preventDefault();

        const trimmedMessage = messageText.trim();

        if (!trimmedMessage || sending) return;

        if (!chatID || !studentID || Number.isNaN(studentID)) {
            setErrorMessage("Chat or student ID is missing.");
            return;
        }

        try {
            setSending(true);
            setErrorMessage("");

            await axios.post(
                "http://localhost:5000/api/chats/message",
                {
                    chatID: Number(chatID),
                    senderID: studentID,
                    messageText: trimmedMessage,
                }
            );

            setMessageText("");
            await loadMessages();
        } catch (error) {
            console.error("Send message error:", error.response?.data || error.message);
            setErrorMessage(
                error.response?.data?.message || "Could not send message."
            );
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatID, studentID]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="gs-chat">
            <style>{`
                .gs-chat {
                    --bg: #090711;
                    --panel: #100c20;
                    --purple: #8b5cf6;
                    --bright-purple: #7c3aed;
                    --text: #f5f0ff;
                    --muted: #b7a6df;

                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 78vh;
                    min-height: 420px;
                    max-height: 780px;
                    overflow: hidden;
                    color: var(--text);
                    background: var(--bg);
                    border: 1px solid #392064;
                    border-radius: 20px;
                    box-shadow: 0 0 30px rgba(124, 58, 237, 0.12);
                    font-family: Inter, "Segoe UI", Arial, sans-serif;
                }

                .gs-chat * {
                    box-sizing: border-box;
                }

                .gs-chat-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 20px 24px;
                    flex-shrink: 0;
                    background: linear-gradient(110deg, #21113f, #130d25);
                    border-bottom: 1px solid #392064;
                }

                .gs-chat-icon {
                    display: grid;
                    place-items: center;
                    width: 42px;
                    height: 42px;
                    flex-shrink: 0;
                    border-radius: 14px;
                    color: #d8b4fe;
                    background: #392064;
                    font-size: 22px;
                }

                .gs-chat-header h2 {
                    margin: 0;
                    color: #f5edff;
                    font-size: 21px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                }

                .gs-chat-subtitle {
                    margin-top: 4px;
                    color: #a78bfa;
                    font-size: 12px;
                }

                .gs-chat-messages {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 24px;
                    background:
                        radial-gradient(ellipse at 50% 0%, rgba(91, 33, 182, 0.09), transparent 60%),
                        #0c0918;
                    scrollbar-width: thin;
                    scrollbar-color: #6d28d9 #100c20;
                }

                .gs-chat-messages::-webkit-scrollbar {
                    width: 8px;
                }

                .gs-chat-messages::-webkit-scrollbar-track {
                    background: #100c20;
                }

                .gs-chat-messages::-webkit-scrollbar-thumb {
                    background: #6d28d9;
                    border-radius: 20px;
                }

                .gs-message {
                    display: flex;
                    flex-direction: column;
                    width: fit-content;
                    max-width: min(72%, 460px);
                    padding: 14px 16px;
                    overflow-wrap: anywhere;
                    border: 1px solid transparent;
                    border-radius: 18px;
                    animation: gs-appear 0.2s ease-out;
                }

                @keyframes gs-appear {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Other people's messages: LEFT */
                .gs-message.other {
                    align-self: flex-start;
                    margin-right: auto;
                    color: #f3e8ff;
                    background: linear-gradient(145deg, #26183e, #1b122d);
                    border-color: #49316b;
                    border-bottom-left-radius: 5px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                }

                /* Your messages: RIGHT */
                .gs-message.mine {
                    align-self: flex-end;
                    margin-left: auto;
                    color: #ffffff;
                    background: linear-gradient(135deg, #9333ea, #6d28d9 65%, #5b21b6);
                    border-color: #a855f7;
                    border-bottom-right-radius: 5px;
                    box-shadow: 0 5px 22px rgba(124, 58, 237, 0.22);
                }

                .gs-sender {
                    margin-bottom: 8px;
                    color: #c4a7ff;
                    font-size: 12px;
                    font-weight: 700;
                }

                .gs-message.mine .gs-sender {
                    color: #e9d5ff;
                }

                .gs-message-text {
                    color: inherit;
                    font-size: 15px;
                    line-height: 1.55;
                    white-space: pre-wrap;
                }

                .gs-message-time {
                    margin-top: 9px;
                    color: #c4b5fd;
                    font-size: 11px;
                    text-align: right;
                    opacity: 0.85;
                }

                .gs-message.mine .gs-message-time {
                    color: #ede9fe;
                }

                .gs-chat-status {
                    margin: auto;
                    padding: 20px;
                    color: #a78bfa;
                    text-align: center;
                    font-size: 14px;
                }

                .gs-chat-error {
                    flex-shrink: 0;
                    margin: 0;
                    padding: 10px 20px;
                    color: #fecaca;
                    background: #35121f;
                    border-top: 1px solid #7f1d3d;
                    font-size: 13px;
                }

                .gs-chat-form {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                    padding: 18px 22px;
                    background: linear-gradient(110deg, #130d25, #100b1e);
                    border-top: 1px solid #392064;
                }

                .gs-chat-input {
                    flex: 1;
                    min-width: 0;
                    height: 54px;
                    padding: 0 18px;
                    color: #f5f0ff;
                    background: #1b132c;
                    border: 1px solid #52347c;
                    border-radius: 28px;
                    outline: none;
                    font-family: inherit;
                    font-size: 14px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .gs-chat-input::placeholder {
                    color: #9884bb;
                }

                .gs-chat-input:focus {
                    border-color: #a855f7;
                    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.12);
                }

                .gs-send-btn {
                    height: 54px;
                    min-width: 112px;
                    padding: 0 24px;
                    color: #ffffff;
                    background: linear-gradient(135deg, #9333ea, #6d28d9);
                    border: 1px solid #a855f7;
                    border-radius: 28px;
                    font-family: inherit;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 18px rgba(124, 58, 237, 0.24);
                    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
                }

                .gs-send-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);
                }

                .gs-send-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                @media (max-width: 600px) {
                    .gs-chat {
                        height: 75vh;
                        min-height: 380px;
                        border-radius: 14px;
                    }

                    .gs-chat-header {
                        padding: 15px;
                    }

                    .gs-chat-messages {
                        padding: 15px 12px;
                        gap: 15px;
                    }

                    .gs-message {
                        max-width: 86%;
                    }

                    .gs-chat-form {
                        gap: 8px;
                        padding: 12px;
                    }

                    .gs-chat-input {
                        height: 48px;
                        padding: 0 13px;
                    }

                    .gs-send-btn {
                        height: 48px;
                        min-width: 76px;
                        padding: 0 16px;
                    }
                }
            `}</style>

            <header className="gs-chat-header">
                <div className="gs-chat-icon" aria-hidden="true">
                    ♧
                </div>

                <div>
                    <h2>{groupName || "Group Chat"}</h2>
                    <div className="gs-chat-subtitle">
                        StudySync Group Conversation
                    </div>
                </div>
            </header>

            <div className="gs-chat-messages" aria-live="polite">
                {loading ? (
                    <p className="gs-chat-status">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="gs-chat-status">
                        No messages yet. Start the conversation ✨
                    </p>
                ) : (
                    messages.map((message) => {
                        const isOwnMessage =
                            Number(message.SenderID) === studentID;

                        return (
                            <div
                                key={message.MessageID}
                                className={`gs-message ${
                                    isOwnMessage ? "mine" : "other"
                                }`}
                            >
                                <div className="gs-sender">
                                    {isOwnMessage
                                        ? "You"
                                        : message.SenderName || "Unknown"}
                                </div>

                                <div className="gs-message-text">
                                    {message.MessageText}
                                </div>

                                <div className="gs-message-time">
                                    {message.SentAt
                                        ? new Date(
                                              message.SentAt
                                          ).toLocaleString()
                                        : ""}
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={messagesEndRef} />
            </div>

            {errorMessage && (
                <p className="gs-chat-error" role="alert">
                    {errorMessage}
                </p>
            )}

            <form className="gs-chat-form" onSubmit={sendMessage}>
                <input
                    className="gs-chat-input"
                    type="text"
                    value={messageText}
                    onChange={(event) =>
                        setMessageText(event.target.value)
                    }
                    placeholder="Type a message..."
                    aria-label="Type a message"
                    autoComplete="off"
                    disabled={sending}
                />

                <button
                    className="gs-send-btn"
                    type="submit"
                    disabled={sending || !messageText.trim()}
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
};

export default GroupChat;