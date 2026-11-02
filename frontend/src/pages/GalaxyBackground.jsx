import { useMemo } from "react";

function GalaxyBackground() {
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
    <div
      className="galaxy-bg"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    >
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
  );
}

export default GalaxyBackground;