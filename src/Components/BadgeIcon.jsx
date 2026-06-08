// src/Components/BadgeIcon.jsx
export default function BadgeIcon({ badge, size = 16 }) {
  if (!badge?.imageUrl || badge.hidden) return null;
  return (
    <span
      title={badge.name}
      style={{ display: "inline-flex", alignItems: "center", marginLeft: "3px", verticalAlign: "middle" }}
    >
      <img
        src={badge.imageUrl}
        alt={badge.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "1.5px solid #fff",
          boxShadow: "0 0 0 1.5px #f97316",
          objectFit: "cover",
          display: "inline-block",
        }}
      />
    </span>
  );
}
