import { useState } from "react";
import axios from "axios";

function Login({ onLogin, onRegister }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrorMessage("");
    setShowSignupPrompt(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setShowSignupPrompt(false);

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email.trim(),
          password: formData.password,
        }
      );

      const { token, studentID, name } = response.data;

      if (!token || !studentID) {
        setErrorMessage("Invalid login response from the server.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("studentID", String(studentID));
      localStorage.setItem("studentName", name || "");

      if (onLogin) {
        onLogin();
      }
    } catch (error) {
      console.error("Login error:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 404) {
        setErrorMessage(
          "This email is not registered. Please sign up first."
        );
        setShowSignupPrompt(true);
      } else if (status === 401) {
        setErrorMessage(
          "Incorrect password. Please check your password."
        );
      } else {
        setErrorMessage(
          message || "Unable to log in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{
        maxWidth: "500px",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="card" style={{ width: "100%" }}>
        <h1 className="page-title" style={{ fontSize: "32px" }}>
          Welcome to StudySync
        </h1>

        <p className="page-subtitle">
          Log in to find study partners and manage your study groups.
        </p>

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {showSignupPrompt && (
          <button
            type="button"
            className="btn"
            style={{ width: "100%", marginBottom: "16px" }}
            onClick={onRegister}
          >
            Create an Account
          </button>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px" }}>
          Don't have an account?{" "}
          <button
            type="button"
            className="btn-secondary"
            onClick={onRegister}
            disabled={loading}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;