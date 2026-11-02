import { useState } from "react";
import axios from "axios";

function Register({ onRegistered, onLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    registrationNumber: "",
    branch: "",
    semester: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Identify the college using the registration number prefix
  const getCollegeID = (registrationNumber) => {
    const regNumber = registrationNumber.trim().toUpperCase();

    if (regNumber.startsWith("VITV")) {
      return "VITV";
    }

    if (regNumber.startsWith("IITB")) {
      return "IITB";
    }

    if (regNumber.startsWith("SRM")) {
      return "SRM";
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.registrationNumber.trim()
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (
      formData.semester &&
      (!Number.isInteger(Number(formData.semester)) ||
        Number(formData.semester) < 1)
    ) {
      setErrorMessage("Semester must be a positive whole number.");
      return;
    }

    // Automatically determine the college
    const registrationNumber = formData.registrationNumber
      .trim()
      .toUpperCase();

    const collegeID = getCollegeID(registrationNumber);

    if (!collegeID) {
      setErrorMessage(
        "Unsupported college registration number. " +
          "Use a VITV, IITB, or SRM registration number."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          collegeID: collegeID,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          registrationNumber: registrationNumber,
          branch: formData.branch.trim() || null,
          semester: formData.semester
            ? Number(formData.semester)
            : null,
        }
      );

      setSuccessMessage(
        response.data.message ||
          "Account created successfully. Please log in."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        registrationNumber: "",
        branch: "",
        semester: "",
      });

      setTimeout(() => {
        if (onRegistered) {
          onRegistered();
        } else if (onLogin) {
          onLogin();
        }
      }, 1200);
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Preview the college while the user types
  const detectedCollegeID = getCollegeID(
    formData.registrationNumber
  );

  const collegeNames = {
    VITV: "VIT Vellore",
    IITB: "IIT Bombay",
    SRM: "SRM Institute of Science and Technology",
  };

  return (
    <div
      className="page-container"
      style={{
        maxWidth: "550px",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="card" style={{ width: "100%" }}>
        <h1 className="page-title" style={{ fontSize: "32px" }}>
          Create Your StudySync Account
        </h1>

        <p className="page-subtitle">
          Join StudySync and find people to study with.
        </p>

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="register-name">Full Name *</label>
            <input
              id="register-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email *</label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password *</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="Create a password (minimum 6 characters)"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-number">
              College Registration Number *
            </label>
            <input
              id="register-number"
              name="registrationNumber"
              type="text"
              placeholder="Example: VITV101 or IITB103"
              value={formData.registrationNumber}
              onChange={handleChange}
              autoComplete="off"
              disabled={loading}
              required
            />

            {detectedCollegeID && (
              <small>
                College detected:{" "}
                <strong>{collegeNames[detectedCollegeID]}</strong>
                {" "}({detectedCollegeID})
              </small>
            )}

            {!detectedCollegeID &&
              formData.registrationNumber.trim() && (
                <small>
                  Enter a supported registration number beginning
                  with VITV, IITB, or SRM.
                </small>
              )}
          </div>

          <div className="form-group">
            <label htmlFor="register-branch">Branch</label>
            <input
              id="register-branch"
              name="branch"
              type="text"
              placeholder="Example: CSE"
              value={formData.branch}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-semester">Semester</label>
            <input
              id="register-semester"
              name="semester"
              type="number"
              placeholder="Enter your semester"
              value={formData.semester}
              onChange={handleChange}
              min="1"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px" }}>
          Already have an account?{" "}
          <button
            type="button"
            className="btn-secondary"
            onClick={onLogin}
            disabled={loading}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;