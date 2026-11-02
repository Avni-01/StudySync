const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

// ============================
// ROUTES
// ============================

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const preferencesRoutes = require("./routes/preferences");
const subjectsRoutes = require("./routes/subjects");
const availabilityRoutes = require("./routes/availability");
const matchingRoutes = require("./routes/matching");
const connectionsRoutes = require("./routes/connections");
const chatsRoutes = require("./routes/chats");
const groupsRoutes = require("./routes/groups");
const sessionsRoutes = require("./routes/sessions");
const resourcesRoutes = require("./routes/resources");
const feedbackRoutes = require("./routes/feedback");
const notificationsRoutes = require("./routes/notifications");

const app = express();

// ============================
// MIDDLEWARE
// ============================

app.use(cors());
app.use(express.json());

// ============================
// HOME
// ============================

app.get("/", (req, res) => {
  res.send("StudySync Backend is Running!");
});

// ============================
// API ROUTES
// ============================

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/preferences", preferencesRoutes);

app.use("/api/subjects", subjectsRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/matching", matchingRoutes);

app.use("/api/connections", connectionsRoutes);

app.use("/api/chats", chatsRoutes);

app.use("/api/groups", groupsRoutes);

app.use("/api/sessions", sessionsRoutes);

app.use("/api/resources", resourcesRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/notifications", notificationsRoutes);

// ============================
// FEEDBACK TEST ROUTE
// ============================

app.get("/api/feedback-test", (req, res) => {
  res.json({
    message: "Feedback route is connected correctly",
  });
});

// ============================
// SERVER
// ============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StudySync server running on http://localhost:${PORT}`);
});