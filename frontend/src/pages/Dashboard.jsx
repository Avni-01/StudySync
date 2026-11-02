import { useMemo } from "react";

const tiles = [
  { icon: "👤", title: "My Profile", desc: "Your details & college", action: "onProfile", color: "#a855f7" },
  { icon: "🎯", title: "Study Preferences", desc: "How you like to study", action: "onPreferences", color: "#d946ef" },
  { icon: "📚", title: "My Subjects", desc: "What you're studying", action: "onSubjects", color: "#6366f1" },
  { icon: "🗓️", title: "My Availability", desc: "When you're free", action: "onAvailability", color: "#22d3ee" },
  { icon: "🔭", title: "Find Study Partners", desc: "Get matched with peers", action: "onFindMatches", color: "#ec4899" },
  { icon: "🪐", title: "My Connections", desc: "Your study crew", action: "onConnections", color: "#8b5cf6" },
  { icon: "💬", title: "Chats", desc: "Message your partners", action: "onChats", color: "#60a5fa" },
  { icon: "🔔", title: "Notifications", desc: "Requests & updates", action: "onNotifications", color: "#f472b6" },
  { icon: "🌌", title: "Study Groups", desc: "Join or create groups", action: "onGroups", color: "#a78bfa" },
];

function Dashboard(props) {
  const studentName = localStorage.getItem("studentName") || "Student";

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        dur: 2 + Math.random() * 4,
      })),
    []
  );

  return (
    <div className="dash">
      {/* Galaxy background */}
      <div className="galaxy-bg">
        <div className="nebula n1" />
        <div className="nebula n2" />
        <div className="nebula n3" />

        {stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}

        <span className="shooting" style={{ top: "8%", left: "10%", animationDelay: "1s" }} />
        <span className="shooting" style={{ top: "25%", left: "55%", animationDelay: "4s" }} />
        <span className="shooting" style={{ top: "5%", left: "70%", animationDelay: "7s" }} />

        <div className="planet" />
        <div className="planet small" />
      </div>

      {/* Hero */}
      <header className="dash-hero">
        <div className="orbit o1" />
        <div className="orbit o2" />

        <button className="dash-logout" onClick={props.onLogout}>
          Logout
        </button>

        <span className="dash-eyebrow">✦ DASHBOARD ✦</span>
        <h1 className="dash-title">StudySync</h1>
        <h2 className="dash-welcome">Welcome, {studentName}!</h2>
        <p className="dash-sub">Find students to study with.</p>
      </header>

      {/* Cards */}
      <div className="dash-grid">
        {tiles.map((t, i) => (
          <button
            key={t.action}
            className="dash-card"
            style={{ "--i": i, "--c": t.color }}
            onClick={props[t.action]}
          >
            <span className="dash-icon">{t.icon}</span>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <span className="dash-arrow">↗</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;