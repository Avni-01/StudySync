import { useState } from "react";

import GalaxyBackground from "./pages/GalaxyBackground";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Preferences from "./pages/Preferences";
import Subjects from "./pages/Subjects";
import Availability from "./pages/Availability";
import Matches from "./pages/Matches";
import Connections from "./pages/Connections";
import Chats from "./pages/Chats";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";

function App() {
  const [screen, setScreen] = useState(
    localStorage.getItem("token") &&
    localStorage.getItem("studentID")
      ? "dashboard"
      : "login"
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("studentID");
    localStorage.removeItem("studentName");
    setScreen("login");
  };

  const pages = {
    profile: <Profile />,
    preferences: <Preferences />,
    subjects: <Subjects />,
    availability: <Availability />,
    matches: <Matches />,
    connections: <Connections />,
    chats: <Chats />,
    groups: <Groups />,
    notifications: <Notifications />,
  };

  let content;

  if (screen === "login") {
    content = (
      <Login
        onLogin={() => setScreen("dashboard")}
        onRegister={() => setScreen("register")}
      />
    );
  } else if (screen === "register") {
    content = (
      <Register
        onRegistered={() => setScreen("login")}
        onLogin={() => setScreen("login")}
      />
    );
  } else if (screen === "dashboard") {
    content = (
      <Dashboard
        onProfile={() => setScreen("profile")}
        onPreferences={() => setScreen("preferences")}
        onSubjects={() => setScreen("subjects")}
        onAvailability={() => setScreen("availability")}
        onFindMatches={() => setScreen("matches")}
        onConnections={() => setScreen("connections")}
        onChats={() => setScreen("chats")}
        onGroups={() => setScreen("groups")}
        onNotifications={() => setScreen("notifications")}
        onLogout={logout}
      />
    );
  } else {
    content = (
      <div className="page-container">
        <button
          type="button"
          className="back-btn"
          onClick={() => setScreen("dashboard")}
        >
          ← Back to Dashboard
        </button>

        {pages[screen] || (
          <p className="error-message">Page not found.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Animated galaxy only on the dashboard, static neon everywhere else */}
      {screen === "dashboard" ? (
        <GalaxyBackground />
      ) : (
        <div className="static-bg" />
      )}

      <div
        className="app-layer"
        style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}
      >
        {content}
      </div>
    </>
  );
}

export default App;