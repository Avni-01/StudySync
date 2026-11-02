
import { useEffect, useState } from "react";
import axios from "axios";

function Feedback({ session, onBack }) {
    const studentID = localStorage.getItem("studentID");

    const [rating, setRating] = useState("");
    const [comments, setComments] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const sessionID = session?.SessionID;

    const loadFeedback = async () => {
        if (!sessionID) {
            setFeedback([]);
            setLoadingFeedback(false);
            return;
        }

        try {
            setLoadingFeedback(true);
            setErrorMessage("");

            const response = await axios.get(
                `http://localhost:5000/api/feedback/session/${sessionID}`
            );

            const data = response.data;

            setFeedback(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.feedback)
                    ? data.feedback
                    : []
            );
        } catch (error) {
            console.error(
                "Error loading feedback:",
                error.response?.status,
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not load feedback."
            );
        } finally {
            setLoadingFeedback(false);
        }
    };

    useEffect(() => {
        loadFeedback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionID]);

    const submitFeedback = async (event) => {
        event.preventDefault();

        if (!studentID || !Number.isInteger(Number(studentID))) {
            setErrorMessage(
                "You must be logged in with a valid student ID."
            );
            return;
        }

        if (!sessionID) {
            setErrorMessage("Session information is missing.");
            return;
        }

        if (!rating) {
            setErrorMessage("Please select a rating.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const response = await axios.post(
                "http://localhost:5000/api/feedback",
                {
                    sessionID: Number(sessionID),
                    studentID: Number(studentID),
                    rating: Number(rating),
                    comments: comments.trim(),
                }
            );

            setSuccessMessage(
                response.data?.message ||
                "Feedback submitted successfully."
            );

            setRating("");
            setComments("");

            await loadFeedback();
        } catch (error) {
            console.error(
                "Error submitting feedback:",
                error.response?.status,
                error.response?.data || error.message
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Could not submit feedback."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return "Not specified";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              });
    };

    if (!session) {
        return (
            <div className="fb-page">
                <style>{styles}</style>

                <div className="fb-card">
                    <h1 className="fb-title">Session Feedback</h1>
                    <p className="fb-muted">
                        No session has been selected.
                    </p>

                    {onBack && (
                        <button
                            type="button"
                            className="fb-button fb-secondary"
                            onClick={onBack}
                        >
                            ← Back
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fb-page">
            <style>{styles}</style>

            <div className="fb-heading">
                <div>
                    <h1 className="fb-title">Session Feedback</h1>
                    <p className="fb-muted">
                        Share your experience with your study session.
                    </p>
                </div>

                {onBack && (
                    <button
                        type="button"
                        className="fb-button fb-secondary"
                        onClick={onBack}
                    >
                        ← Back
                    </button>
                )}
            </div>

            {/* Session details */}
            <section className="fb-card">
                <h2 className="fb-card-title">Session Details</h2>

                <div className="fb-session-details">
                    <div className="fb-detail-row">
                        <strong>Date:</strong>
                        <span>
                            {formatDate(session.SessionDate)}
                        </span>
                    </div>

                    <div className="fb-detail-row">
                        <strong>Time:</strong>
                        <span>
                            {session.SessionTime || "Not specified"}
                        </span>
                    </div>

                    <div className="fb-detail-row">
                        <strong>Venue:</strong>
                        <span>
                            {session.Venue || "Not specified"}
                        </span>
                    </div>
                </div>
            </section>

            {/* Submit feedback */}
            <section className="fb-card">
                <h2 className="fb-card-title">Submit Feedback</h2>

                {errorMessage && (
                    <div className="fb-alert fb-error" role="alert">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="fb-alert fb-success" role="status">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={submitFeedback}>
                    <div className="fb-form-group">
                        <label htmlFor="fb-rating">Rating</label>

                        <select
                            id="fb-rating"
                            value={rating}
                            onChange={(event) =>
                                setRating(event.target.value)
                            }
                            required
                        >
                            <option value="">Select rating</option>
                            <option value="1">1 - Very Poor</option>
                            <option value="2">2 - Poor</option>
                            <option value="3">3 - Average</option>
                            <option value="4">4 - Good</option>
                            <option value="5">5 - Excellent</option>
                        </select>
                    </div>

                    <div className="fb-form-group">
                        <label htmlFor="fb-comments">Comments</label>

                        <textarea
                            id="fb-comments"
                            value={comments}
                            onChange={(event) =>
                                setComments(event.target.value)
                            }
                            placeholder="Write your feedback..."
                            rows={4}
                        />
                    </div>

                    <button
                        className="fb-button fb-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Submitting..."
                            : "Submit Feedback"}
                    </button>
                </form>
            </section>

            {/* Previous feedback */}
            <section className="fb-card">
                <h2 className="fb-card-title">Previous Feedback</h2>

                {loadingFeedback ? (
                    <p className="fb-muted">Loading feedback...</p>
                ) : feedback.length === 0 ? (
                    <p className="fb-muted">
                        No feedback submitted yet.
                    </p>
                ) : (
                    <div className="fb-feedback-list">
                        {feedback.map((item, index) => (
                            <article
                                className="fb-feedback-item"
                                key={
                                    item.FeedbackID ??
                                    `${item.StudentID}-${index}`
                                }
                            >
                                <div className="fb-feedback-top">
                                    <strong>
                                        {item.Name || "Student"}
                                    </strong>

                                    <span className="fb-rating">
                                        ★ {item.Rating}/5
                                    </span>
                                </div>

                                {item.Comments && (
                                    <p className="fb-comment">
                                        {item.Comments}
                                    </p>
                                )}

                                {item.SubmittedDate && (
                                    <small className="fb-muted">
                                        {new Date(
                                            item.SubmittedDate
                                        ).toLocaleString("en-IN")}
                                    </small>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

const styles = `
    .fb-page {
        width: 100%;
        padding: 24px;
        color: #f5f0ff;
        background: #111019;
        border-radius: 18px;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
    }

    .fb-page * {
        box-sizing: border-box;
    }

    .fb-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 22px;
    }

    .fb-title {
        margin: 0 0 8px;
        color: #f5f0ff;
        font-size: 28px;
        font-weight: 750;
    }

    .fb-muted {
        color: #aa9bc8;
        line-height: 1.6;
    }

    .fb-card {
        margin-bottom: 22px;
        padding: 24px;
        background: #17151f;
        border: 1px solid #343040;
        border-radius: 18px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .fb-card-title {
        margin: 0 0 18px;
        color: #f5f0ff;
        font-size: 22px;
        font-weight: 700;
    }

    .fb-session-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .fb-detail-row {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 8px;
        padding: 14px 16px;
        color: #e9e2ff;
        background: #13111b;
        border: 1px solid #343040;
        border-radius: 12px;
        line-height: 1.6;
    }

    .fb-detail-row strong {
        flex: 0 0 auto;
        color: #c4b5fd;
    }

    .fb-detail-row span {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .fb-form-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 22px;
    }

    .fb-form-group label {
        color: #eee7ff;
        font-size: 14px;
        font-weight: 650;
    }

    .fb-form-group select,
    .fb-form-group textarea {
        width: 100%;
        padding: 14px 16px;
        color: #f5f0ff;
        background: #13111b;
        border: 1px solid #393345;
        border-radius: 12px;
        outline: none;
        font: inherit;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .fb-form-group select {
        min-height: 54px;
    }

    .fb-form-group select option {
        color: #f5f0ff;
        background: #17151f;
    }

    .fb-form-group textarea {
        min-height: 130px;
        resize: vertical;
        line-height: 1.6;
    }

    .fb-form-group select:focus,
    .fb-form-group textarea:focus {
        border-color: #a855f7;
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.13);
    }

    .fb-form-group textarea::placeholder {
        color: #817393;
    }

    .fb-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 12px 22px;
        border: 1px solid transparent;
        border-radius: 12px;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .fb-primary {
        color: white;
        background: linear-gradient(135deg, #c084fc, #9333ea 70%, #7e22ce);
        box-shadow: 0 5px 18px rgba(147, 51, 234, 0.2);
    }

    .fb-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 7px 22px rgba(168, 85, 247, 0.3);
    }

    .fb-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .fb-secondary {
        color: #e9d5ff;
        background: #21172f;
        border-color: #52347c;
    }

    .fb-alert {
        margin-bottom: 18px;
        padding: 13px 16px;
        border-radius: 10px;
        line-height: 1.5;
    }

    .fb-error {
        color: #fecaca;
        background: #35121f;
        border: 1px solid #7f1d3d;
    }

    .fb-success {
        color: #d1fae5;
        background: #102d25;
        border: 1px solid #23664e;
    }

    .fb-feedback-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .fb-feedback-item {
        padding: 18px;
        background: #13111b;
        border: 1px solid #393345;
        border-radius: 14px;
    }

    .fb-feedback-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
    }

    .fb-feedback-top strong {
        color: #e9d5ff;
    }

    .fb-rating {
        color: #d8b4fe;
        font-weight: 700;
    }

    .fb-comment {
        margin: 12px 0;
        color: #e9e2ff;
        line-height: 1.65;
        overflow-wrap: anywhere;
    }

    .fb-feedback-item small {
        font-size: 12px;
    }

    @media (max-width: 600px) {
        .fb-page {
            padding: 14px;
        }

        .fb-card {
            padding: 17px;
        }

        .fb-title {
            font-size: 24px;
        }

        .fb-card-title {
            font-size: 20px;
        }
    }
`;

export default Feedback;