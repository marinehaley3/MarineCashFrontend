// src/Pages/ChatPage.jsx
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { ChatContext } from "../Context/ChatContext";
import { AuthContext } from "../Context/AuthContext";
import API from "../api/axios";

const QUICK_EMOJIS = ["❤️","😂","😮","😢","😡","👍","🔥","🥰","😘","🥲","😎","🙏"];

const EMOJI_ROWS = [
  ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎"],
  ["😍","🥰","😘","😗","😙","😚","🙂","🤗","🤩","🥳","😏","😒"],
  ["😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢"],
  ["😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰"],
  ["😥","😓","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","🙄"],
  ["😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤧"],
  ["🥴","😵","🤠","🥸","😈","👿","💀","☠️","👋","🤚","✋","🖐"],
  ["👍","👎","👏","🙌","🤝","🤜","🤛","✊","👊","🫶","❤️","🔥"],
  ["🎉","🎊","🎈","🎁","🏆","💯","✅","❌","⭐","🌟","💥","💫"],
];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBanTime(expiresAt) {
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ReactionBubbles({ reactions, messageId, onReact, userId }) {
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
        const mine = data.users.some((u) => (u?._id || u)?.toString() === userId?.toString());
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

// ── Swipeable Message Bubble ──────────────────────────────────────
function MessageBubble({ msg, isMe, isAdmin, userId, onReact, onDelete, onReply }) {
  const pressTimer = useRef(null);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swiped = useRef(false);

  const senderName = msg.sender?.fullName || "Unknown";
  const isAdminMsg = msg.isAdminMessage;
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=${isMe ? "f97316" : isAdminMsg ? "7c3aed" : "6366f1"}&color=fff`;

  // ── Swipe handlers ──────────────────────────────────────────────
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiped.current = false;
    // long-press for quick react
    pressTimer.current = setTimeout(() => setShowQuickReact(true), 500);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Cancel long-press if moving
    if (Math.abs(dx) > 5 || dy > 5) clearTimeout(pressTimer.current);

    // Only handle horizontal swipe, ignore if mostly vertical (scrolling)
    if (dy > 20) return;

    // Left swipe only, cap at -70px
    if (dx < 0) {
      setSwipeX(Math.max(dx, -70));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer.current);
    if (swipeX <= -50 && !swiped.current) {
      swiped.current = true;
      onReply(msg);
    }
    // Snap back
    setSwipeX(0);
  };

  const replyIconOpacity = Math.min(Math.abs(swipeX) / 50, 1);

  return (
    <div
      className={`flex items-end gap-2 group ${isMe ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => setShowQuickReact(false)}
    >
      {!isMe && (
        <img src={avatar} alt={senderName} className="w-8 h-8 rounded-full mb-5 shrink-0" />
      )}

      {/* Swipe wrapper */}
      <div
        className="flex items-center gap-2 relative"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.25s ease" : "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Reply icon that appears on swipe */}
        <div
          className={`absolute ${isMe ? "-left-8" : "-right-8"} flex items-center justify-center w-7 h-7 rounded-full bg-gray-200`}
          style={{ opacity: replyIconOpacity }}
        >
          <i className="fas fa-reply text-gray-500 text-xs"></i>
        </div>

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75vw]`}>
          {!isMe && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-gray-600">{senderName}</span>
              {isAdminMsg && (
                <span className="text-[9px] font-extrabold bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
          )}
          {isMe && isAdminMsg && (
            <span className="text-[9px] font-extrabold bg-purple-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide mb-0.5 self-end">
              Admin
            </span>
          )}

          {/* Reply preview inside bubble */}
          {msg.replyTo && (
            <div className={`text-[11px] px-2 py-1 rounded-lg mb-1 border-l-2 max-w-full truncate
              ${isMe ? "bg-green-400/30 border-white text-white/80" : "bg-gray-100 border-orange-400 text-gray-500"}`}>
              <span className="font-bold block">
                {msg.replyTo.sender?.fullName || "Unknown"}
              </span>
              <span className="truncate block">
                {msg.replyTo.type === "image" ? "📷 Image" : msg.replyTo.content}
              </span>
            </div>
          )}

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
                src={`${import.meta.env.VITE_API_BASE || "https://marinecashbackend.onrender.com"}${msg.imageUrl}`}
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

      {isMe && (
        <img src={avatar} alt="you" className="w-8 h-8 rounded-full mb-5 shrink-0" />
      )}
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────
const ChatPage = () => {
  const {
    messages, typingUsers, isClosed, banInfo,
    sendMessage, sendImage, reactToMessage, deleteMessage, sendTyping,
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);
  const [text, setText]               = useState("");
  const [error, setError]             = useState("");
  const [showEmoji, setShowEmoji]     = useState(false);
  const [imgPreview, setImgPreview]   = useState(null);
  const [sending, setSending]         = useState(false);
  const [replyTo, setReplyTo]         = useState(null); // ← reply state

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [roomInfo, setRoomInfo]             = useState(null);
  const [clearDays, setClearDays]           = useState(null);
  const [banTarget, setBanTarget]           = useState(null);
  const [banHours, setBanHours]             = useState("");
  const [banDays, setBanDays]               = useState("");
  const [banReason, setBanReason]           = useState("");
  const [adminMsg, setAdminMsg]             = useState("");

  const bottomRef = useRef(null);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    if (showAdminPanel && isAdmin) {
      API.get("/chat/admin/room-info")
        .then((r) => setRoomInfo(r.data))
        .catch(() => {});
    }
  }, [showAdminPanel, isAdmin]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const flashAdmin = (msg) => {
    setAdminMsg(msg);
    setTimeout(() => setAdminMsg(""), 3500);
  };

  const handleSend = async () => {
    if (sending) return;
    setError("");

    if (imgPreview) {
      setSending(true);
      try {
        await sendImage(imgPreview.file);
        setImgPreview(null);
        setReplyTo(null);
      } catch (e) {
        setError(e.message);
      }
      setSending(false);
      return;
    }

    if (!text.trim()) return;
    setSending(true);
    try {
      // Pass replyTo._id to backend so it can store the reference
      await sendMessage(text.trim(), replyTo?._id || null);
      setText("");
      setReplyTo(null);
      setShowEmoji(false);
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    else if (e.key === "Escape") setReplyTo(null);
    else sendTyping();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgPreview({ file, url: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const appendEmoji = (emoji) => {
    setText((t) => t + emoji);
    inputRef.current?.focus();
  };

  const handleToggleRoom = async () => {
    try {
      const res = await API.post("/chat/admin/toggle-room", { close: !roomInfo?.isClosed });
      setRoomInfo((prev) => ({ ...prev, isClosed: res.data.isClosed }));
      flashAdmin(res.data.isClosed ? "🔒 Chatroom closed." : "🔓 Chatroom opened.");
    } catch { flashAdmin("❌ Failed to toggle room."); }
  };

  const handleClearMessages = async (days) => {
    try {
      const res = await API.post("/chat/admin/clear-messages", { days });
      flashAdmin(`🗑️ Deleted ${res.data.deleted} message(s).`);
      setClearDays(null);
    } catch { flashAdmin("❌ Failed to clear messages."); }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    if (!banHours && !banDays) return flashAdmin("❌ Enter hours or days.");
    try {
      const res = await API.post("/chat/admin/ban-user", {
        userId: banTarget._id,
        hours: banHours ? Number(banHours) : 0,
        days:  banDays  ? Number(banDays)  : 0,
        reason: banReason,
      });
      flashAdmin(`🚫 ${banTarget.fullName} banned until ${new Date(res.data.expiresAt).toLocaleString()}`);
      setBanTarget(null); setBanHours(""); setBanDays(""); setBanReason("");
      const info = await API.get("/chat/admin/room-info");
      setRoomInfo(info.data);
    } catch { flashAdmin("❌ Failed to ban user."); }
  };

  const handleUnban = async (userId) => {
    try {
      await API.post("/chat/admin/unban-user", { userId });
      flashAdmin("✅ User unbanned.");
      const info = await API.get("/chat/admin/room-info");
      setRoomInfo(info.data);
    } catch { flashAdmin("❌ Failed to unban."); }
  };

  const uniqueSenders = messages.reduce((acc, msg) => {
    const sid = msg.sender?._id;
    if (sid && sid !== user?._id && !acc.find((u) => u._id === sid)) {
      acc.push({ _id: sid, fullName: msg.sender?.fullName || "Unknown" });
    }
    return acc;
  }, []);

  const activeBan = banInfo && new Date(banInfo.expiresAt) > Date.now();

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <nav className="w-full bg-orange-400 flex items-center justify-between px-4 py-3 sticky top-0 z-50 shadow shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-white text-base">MarineCash Chat</h2>
          {isClosed && (
            <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
              CLOSED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="relative bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <i className="fas fa-shield-halved"></i> Admin
            </button>
          )}
          <span className="text-[11px] bg-green-500 text-white px-2 py-1 rounded-full font-bold">
            {isClosed ? "Closed" : "Live"}
          </span>
        </div>
      </nav>

      {/* ── Messages ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-3 pb-[90px]">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hello! 👋</p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender?._id?.toString() === user?._id?.toString();
          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={isMe}
              isAdmin={isAdmin}
              userId={user?._id}
              onReact={reactToMessage}
              onDelete={deleteMessage}
              onReply={setReplyTo}
            />
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 pl-10">
            <div className="bg-white rounded-2xl px-3 py-2 text-xs text-gray-400 shadow animate-pulse flex items-center gap-1">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </span>
              {typingUsers.join(", ")} typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ── Error toast ──────────────────────────────────────── */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
          {error}
        </div>
      )}

      {/* ── Ban notice ───────────────────────────────────────── */}
      {activeBan && (
        <div className="fixed bottom-[90px] left-0 right-0 mx-3 bg-red-50 border border-red-300 rounded-2xl p-3 text-center text-xs font-semibold text-red-600 shadow z-40">
          🚫 You are banned from this chat. Ban expires in {formatBanTime(banInfo.expiresAt)}.
        </div>
      )}

      {/* ── Emoji picker ─────────────────────────────────────── */}
      {showEmoji && (
        <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t shadow-xl z-40 p-2">
          <div className="max-h-44 overflow-y-auto space-y-1">
            {EMOJI_ROWS.map((row, i) => (
              <div key={i} className="flex gap-1 justify-start flex-wrap">
                {row.map((e) => (
                  <button key={e} onClick={() => appendEmoji(e)} className="text-2xl hover:scale-125 transition-transform p-0.5">
                    {e}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Image preview bar ────────────────────────────────── */}
      {imgPreview && (
        <div className="fixed bottom-[72px] left-0 right-0 bg-white border-t px-3 py-2 flex items-center gap-3 z-40 shadow">
          <img src={imgPreview.url} alt="preview" className="w-16 h-16 object-cover rounded-xl border" />
          {/* FIX: show filename label + "Image" text clearly */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-700">📷 Image</p>
            <p className="text-[11px] text-gray-400 truncate">{imgPreview.file?.name}</p>
          </div>
          <button onClick={() => setImgPreview(null)} className="text-red-500 text-sm shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* ── Reply preview bar ────────────────────────────────── */}
      {replyTo && !imgPreview && (
        <div className="fixed bottom-[60px] left-0 right-0 bg-orange-50 border-t border-orange-200 px-3 py-2 flex items-center gap-2 z-40">
          <div className="border-l-4 border-orange-400 pl-2 flex-1 min-w-0">
            <p className="text-[11px] font-bold text-orange-500">{replyTo.sender?.fullName || "Unknown"}</p>
            <p className="text-xs text-gray-500 truncate">
              {replyTo.type === "image" ? "📷 Image" : replyTo.content}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 shrink-0">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────── */}
      {/* FIX: use min-h, always show send button, no overflow hidden */}
      <div className="fixed bottom-0 w-full bg-white border-t flex items-center gap-2 px-2 py-2 z-50 shrink-0">
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji((s) => !s)}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl shrink-0 transition"
        >
          😊
        </button>

        {/* Image attach */}
        <label className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center justify-center shrink-0 transition">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <i className="fas fa-image text-gray-500"></i>
        </label>

        {/* Text input — flex-1 but min-w-0 so it never pushes send off screen */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            activeBan ? "You are banned..." :
            isClosed && !isAdmin ? "Chatroom is closed..." :
            replyTo ? `Reply to ${replyTo.sender?.fullName || "message"}...` :
            "Type a message..."
          }
          disabled={activeBan || (isClosed && !isAdmin)}
          className="flex-1 min-w-0 border-2 border-orange-300 focus:border-orange-500 rounded-2xl px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition"
        />

        {/* Send — always visible, never pushed off */}
        <button
          onClick={handleSend}
          disabled={sending || activeBan || (isClosed && !isAdmin)}
          className="w-10 h-10 bg-orange-500 hover:bg-orange-600 active:scale-95 transition rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          {sending
            ? <i className="fas fa-spinner fa-spin text-white text-sm"></i>
            : <i className="fas fa-paper-plane text-white text-sm"></i>
          }
        </button>
      </div>

      {/* ══ ADMIN PANEL DRAWER ══ */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowAdminPanel(false)} />
          <div className="w-[320px] max-w-full bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="bg-orange-400 px-4 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-white font-extrabold text-sm flex items-center gap-2">
                <i className="fas fa-shield-halved"></i> Chat Admin Panel
              </h2>
              <button onClick={() => setShowAdminPanel(false)} className="text-white text-lg">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {adminMsg && (
              <div className="mx-4 mt-3 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl">
                {adminMsg}
              </div>
            )}

            <div className="p-4 space-y-5 flex-1">
              {/* Room status */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <i className="fas fa-door-open text-orange-500"></i> Room Status
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{roomInfo?.isClosed ? "🔒 Closed" : "🟢 Open"}</p>
                    <p className="text-xs text-gray-400">{roomInfo?.isClosed ? "Users cannot send messages." : "Room is live."}</p>
                  </div>
                  <button
                    onClick={handleToggleRoom}
                    className={`text-xs font-extrabold px-4 py-2 rounded-xl transition ${roomInfo?.isClosed ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                  >
                    {roomInfo?.isClosed ? "Open Room" : "Close Room"}
                  </button>
                </div>
              </div>

              {/* Clear messages */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <i className="fas fa-trash-alt text-red-500"></i> Clear Messages
                </p>
                {clearDays === null ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "All Messages", days: 0,   color: "bg-red-500 hover:bg-red-600" },
                      { label: "Past 7 days",  days: 7,   color: "bg-orange-500 hover:bg-orange-600" },
                      { label: "Past 14 days", days: 14,  color: "bg-orange-400 hover:bg-orange-500" },
                      { label: "Past 30 days", days: 30,  color: "bg-yellow-500 hover:bg-yellow-600" },
                      { label: "Past 60 days", days: 60,  color: "bg-yellow-400 hover:bg-yellow-500" },
                      { label: "Past 90 days", days: 90,  color: "bg-gray-500 hover:bg-gray-600" },
                      { label: "Past 120 days",days: 120, color: "bg-gray-400 hover:bg-gray-500" },
                    ].map(({ label, days, color }) => (
                      <button key={days} onClick={() => setClearDays(days)} className={`${color} text-white text-xs font-bold py-2.5 rounded-xl transition`}>
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-700 text-center">
                      ⚠️ Delete{" "}
                      <span className="text-red-600">{clearDays === 0 ? "ALL messages" : `messages older than ${clearDays} days`}</span>?
                    </p>
                    <p className="text-xs text-gray-400 text-center">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleClearMessages(clearDays)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold py-2.5 rounded-xl transition">
                        Yes, Delete
                      </button>
                      <button onClick={() => setClearDays(null)} className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2.5 rounded-xl transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ban user */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <i className="fas fa-ban text-red-500"></i> Ban User
                </p>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Select user from chat</label>
                  <select
                    value={banTarget?._id || ""}
                    onChange={(e) => { const u = uniqueSenders.find((s) => s._id === e.target.value); setBanTarget(u || null); }}
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="">-- Choose user --</option>
                    {uniqueSenders.map((u) => (
                      <option key={u._id} value={u._id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                {banTarget && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Hours</label>
                        <input type="number" min="0" value={banHours} onChange={(e) => setBanHours(e.target.value)} placeholder="e.g. 12"
                          className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Days</label>
                        <input type="number" min="0" value={banDays} onChange={(e) => setBanDays(e.target.value)} placeholder="e.g. 3"
                          className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Reason (optional)</label>
                      <input type="text" value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="e.g. Spamming"
                        className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none" />
                    </div>
                    <button onClick={handleBan} className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                      <i className="fas fa-ban"></i> Ban {banTarget.fullName}
                    </button>
                  </div>
                )}
              </div>

              {/* Active bans */}
              {roomInfo?.bans?.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-extrabold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <i className="fas fa-user-slash text-orange-500"></i> Active Bans ({roomInfo.bans.length})
                  </p>
                  <div className="space-y-2">
                    {roomInfo.bans.map((ban) => (
                      <div key={ban._id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{ban.user?.fullName}</p>
                          <p className="text-[10px] text-gray-400">Expires: {new Date(ban.expiresAt).toLocaleString()}</p>
                          {ban.reason && <p className="text-[10px] text-gray-400 italic">"{ban.reason}"</p>}
                        </div>
                        <button onClick={() => handleUnban(ban.user?._id)} className="text-xs text-green-600 font-bold bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition">
                          Unban
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
