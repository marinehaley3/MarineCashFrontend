// src/Components/Chat/MessageBubble.jsx
import { useRef, useState } from "react";
import ReactionBubbles from "./ReactionBubbles";
import BadgeIcon from "../BadgeIcon";

const QUICK_EMOJIS = ["❤️","😂","😮","😢","😡","👍","🔥","🥰","😘","🥲","😎","🙏"];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getFirstName(fullName) {
  if (!fullName) return "Unknown";
  return fullName.trim().split(" ")[0];
}

export default function MessageBubble({ msg, isMe, isAdmin, userId, onReact, onDelete, onReply }) {
  const pressTimer = useRef(null);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swiped = useRef(false);

  const senderFullName = msg.sender?.fullName || "Unknown";
  const senderFirstName = getFirstName(senderFullName);
  const isAdminMsg = msg.isAdminMessage;
  const senderBadge = msg.sender?.badge;
  const senderPhoto = msg.sender?.photo;

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderFirstName)}&background=${
    isMe ? "f97316" : isAdminMsg ? "7c3aed" : "6366f1"
  }&color=fff`;

  const avatarSrc = senderPhoto || fallbackAvatar;

  // ── Swipe handlers ───────────────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiped.current = false;
    pressTimer.current = setTimeout(() => setShowQuickReact(true), 500);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 5 || dy > 5) clearTimeout(pressTimer.current);
    if (dy > 20) return;
    if (dx < 0) setSwipeX(Math.max(dx, -70));
    else setSwipeX(0);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
    if (swipeX <= -50 && !swiped.current) {
      swiped.current = true;
      onReply(msg);
    }
    setSwipeX(0);
  };

  const replyIconOpacity = Math.min(Math.abs(swipeX) / 50, 1);

  return (
    <div
      className={`flex items-end gap-2 group ${isMe ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => setShowQuickReact(false)}
    >
      {/* Other user's avatar */}
      {!isMe && (
        <img
          src={avatarSrc}
          alt={senderFirstName}
          className="w-8 h-8 rounded-full mb-5 shrink-0 object-cover"
          onError={(e) => { e.target.src = fallbackAvatar; }}
        />
      )}

      {/* Swipe wrapper */}
      <div
        className="flex items-center gap-2 relative"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.25s ease" : "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Reply icon */}
        <div
          className={`absolute ${isMe ? "-left-8" : "-right-8"} flex items-center justify-center w-7 h-7 rounded-full bg-gray-200`}
          style={{ opacity: replyIconOpacity }}
        >
          <i className="fas fa-reply text-gray-500 text-xs"></i>
        </div>

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75vw]`}>

          {/* Sender name + badge row (non-admin only, non-me only) */}
          {!isMe && !isAdminMsg && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs font-bold text-gray-600">{senderFirstName}</span>
              {senderBadge && <BadgeIcon badge={senderBadge} size={14} />}
            </div>
          )}

          {/* Admin label */}
          {!isMe && isAdminMsg && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[9px] font-extrabold bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Admin
              </span>
            </div>
          )}

          {/* My own admin pill */}
          {isMe && isAdminMsg && (
            <span className="text-[9px] font-extrabold bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide mb-0.5 self-end">
              Admin
            </span>
          )}

          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`text-[11px] px-2 py-1 rounded-lg mb-1 border-l-2 max-w-full truncate
              ${isMe ? "bg-green-400/30 border-white text-white/80" : "bg-gray-100 border-orange-400 text-gray-500"}`}>
              <span className="font-bold block">
                {getFirstName(msg.replyTo.sender?.fullName)}
              </span>
              <span className="truncate block">
                {msg.replyTo.type === "image" ? "📷 Image" : msg.replyTo.content}
              </span>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`relative px-3 py-2 rounded-2xl shadow text-sm
              ${isMe
                ? isAdminMsg
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-green-500 text-white rounded-br-none"
                : isAdminMsg
                  ? "bg-purple-100 text-purple-900 rounded-bl-none"
                  : "bg-white text-gray-900 rounded-bl-none"
              }`}
          >
            {msg.type === "image" && msg.imageUrl ? (
              <img
                src={msg.imageUrl}
                alt="shared"
                className="max-w-[200px] max-h-[200px] rounded-xl object-cover"
              />
            ) : (
              <p className="break-words leading-relaxed">{msg.content}</p>
            )}

            <span className={`text-[10px] block mt-1 ${isMe ? "text-white/70 text-right" : "text-gray-400"}`}>
              {formatTime(msg.createdAt)}
            </span>

            {isAdmin && (
              <button
                onClick={() => onDelete(msg._id)}
                className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-[9px] shadow"
              >
                <i className="fas fa-times"></i>
              </button>
            )}

            {showQuickReact && (
              <div
                className={`absolute z-20 bottom-full mb-1 ${isMe ? "right-0" : "left-0"}
                  bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-1.5 flex gap-1 flex-wrap max-w-[220px]`}
              >
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact(msg._id, e); setShowQuickReact(false); }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ReactionBubbles
            reactions={msg.reactions}
            messageId={msg._id}
            onReact={onReact}
            userId={userId}
          />
        </div>
      </div>

      {/* My own avatar */}
      {isMe && (
        <img
          src={avatarSrc}
          alt="you"
          className="w-8 h-8 rounded-full mb-5 shrink-0 object-cover"
          onError={(e) => { e.target.src = fallbackAvatar; }}
        />
      )}
    </div>
  );
      }
