// src/Components/Chat/ReactionBubbles.jsx
export default function ReactionBubbles({ reactions, messageId, onReact, userId }) {
  if (!reactions?.length) return null;
  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || { count: 0, users: [] };
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.user?._id || r.user);
    return acc;
  }, {});
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, data]) => {
        const mine = data.users.some(
          (u) => (u?._id || u)?.toString() === userId?.toString()
        );
        return (
          <button
            key={emoji}
            onClick={() => onReact(messageId, emoji)}
            className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition
              ${mine ? "bg-orange-100 border-orange-400" : "bg-white border-gray-200 hover:bg-gray-50"}`}
          >
            <span>{emoji}</span>
            <span className="font-bold text-gray-600">{data.count}</span>
          </button>
        );
      })}
    </div>
  );
}
