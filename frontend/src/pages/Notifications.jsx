import { useCallback, useEffect, useState } from "react";
import api from "../api";

function Notifications() {
    const studentID = localStorage.getItem("studentID");

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const loadNotifications = useCallback(async () => {
        if (!studentID) {
            setErrorMessage("Student ID not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const response = await api.get(
                `/notifications/${studentID}`
            );

            const data = response.data;

            setNotifications(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.notifications)
                        ? data.notifications
                        : []
            );

            setErrorMessage("");
        } catch (error) {
            console.error("Load notifications error:", error);

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load notifications"
            );
        } finally {
            setLoading(false);
        }
    }, [studentID]);

    useEffect(() => {
        loadNotifications();

        const interval = setInterval(() => {
            loadNotifications();
        }, 5000);

        return () => clearInterval(interval);
    }, [loadNotifications]);

    const markAllRead = async () => {
        try {
            await api.put(`/notifications/${studentID}/read`);
            await loadNotifications();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Could not mark notifications as read"
            );
        }
    };

    return (
        <div>
            <h1 className="page-title">Notifications</h1>

            <p className="page-subtitle">
                Your latest StudySync activity.
            </p>

            <div className="card">
                {loading ? (
                    <p>Loading notifications...</p>
                ) : errorMessage ? (
                    <>
                        <div className="error-message">
                            {errorMessage}
                        </div>

                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                setLoading(true);
                                loadNotifications();
                            }}
                        >
                            Try Again
                        </button>
                    </>
                ) : notifications.length === 0 ? (
                    <p>No notifications yet.</p>
                ) : (
                    <>
                        {notifications.some(
                            (item) =>
                                String(item.Status).toLowerCase() === "unread"
                        ) && (
                            <button
                                type="button"
                                className="btn"
                                onClick={markAllRead}
                                style={{ marginBottom: "16px" }}
                            >
                                Mark all as read
                            </button>
                        )}

                        <div className="list">
                            {notifications.map((notification) => {
                                const unread =
                                    String(notification.Status || "")
                                        .toLowerCase() === "unread";

                                return (
                                    <div
                                        className="list-item"
                                        key={notification.NotificationID}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "12px",
                                        }}
                                    >
                                        {unread && (
                                            <span
                                                title="Unread notification"
                                                style={{
                                                    display: "inline-block",
                                                    width: "10px",
                                                    height: "10px",
                                                    minWidth: "10px",
                                                    marginTop: "7px",
                                                    borderRadius: "50%",
                                                    background: "#b56cff",
                                                }}
                                            />
                                        )}

                                        <div>
                                            <p style={{ marginTop: 0 }}>
                                                {notification.Message}
                                            </p>

                                            <span className="tag">
                                                {notification.Status}
                                            </span>

                                            {notification.CreatedAt && (
                                                <p>
                                                    <small>
                                                        {new Date(
                                                            notification.CreatedAt
                                                        ).toLocaleString()}
                                                    </small>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Notifications;