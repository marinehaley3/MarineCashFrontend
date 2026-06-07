import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import BottomNav from "../Components/BottomNav";
import { SupportBadgeContext } from "../Context/SupportBadgeContext";

const STATUS_META = {
  open:        { label: "Open",        color: "bg-blue-100 text-blue-600" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-600" },
  closed:      { label: "Closed",      color: "bg-gray-100 text-gray-500" },
};

const Support = () => {
  const navigate = useNavigate();
  const { refreshUser } = useContext(SupportBadgeContext);

  const [tickets, setTickets]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]               = useState({ text: "", success: true });

  // Form
  const [selectedCat, setSelectedCat] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile]               = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const flash = (t, s = true) => {
    setMsg({ text: t, success: s });
    setTimeout(() => setMsg({ text: "", success: true }), 3500);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get("/support/my-tickets"),
      API.get("/support/categories"),
    ])
      .then(([t, c]) => { setTickets(t.data); setCategories(c.data); })
      .catch(() => flash("❌ Failed to load", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { flash("❌ File must be under 5MB", false); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFile({ data: ev.target.result.split(",")[1], mimeType: f.type, fileName: f.name });
      setFilePreview({ url: ev.target.result, name: f.name, type: f.type });
    };
    reader.readAsDataURL(f);
  };

  const isOther = selectedCat === "__other__";
  const finalTitle = isOther ? customTitle.trim() : (categories.find(c => c._id === selectedCat)?.label || "");

  const handleSubmit = async () => {
    if (!finalTitle) return flash("❌ Please select or enter a title.", false);
    if (!description.trim()) return flash("❌ Description is required.", false);
    setSubmitting(true);
    try {
      const payload = {
        title: finalTitle,
        description: description.trim(),
        categoryId: isOther ? null : selectedCat || null,
        ...(file ? { file } : {}),
      };
      const res = await API.post("/support/tickets", payload);
      setShowForm(false);
      setSelectedCat(""); setCustomTitle(""); setDescription(""); setFile(null); setFilePreview(null);
      flash("✅ Ticket submitted!");
      load();
      refreshUser();
      navigate(`/support/${res.data._id}`);
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Failed."), false);
    }
    setSubmitting(false);
  };

  const unreadForTicket = (ticket) =>
    ticket.messages?.filter(m => m.sender === "admin" && !m.seenByUser).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-extrabold text-xl">Support</h1>
            <p className="text-orange-100 text-xs mt-0.5">We're here to help you</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-orange-500 font-bold text-sm px-4 py-2 rounded-xl shadow flex items-center gap-2 hover:bg-orange-50 transition"
          >
            <i className="fas fa-plus" /> New Ticket
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {msg.text && (
          <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-orange-400">
            <i className="fas fa-spinner fa-spin text-3xl" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <i className="fas fa-headset text-5xl mb-3" />
            <p className="font-bold text-gray-500">No tickets yet</p>
            <p className="text-xs mt-1 mb-4">Tap "New Ticket" to reach our support team</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const unread = unreadForTicket(ticket);
            const meta   = STATUS_META[ticket.status] || STATUS_META.open;
            const last   = ticket.messages?.[ticket.messages.length - 1];
            return (
              <div
                key={ticket._id}
                onClick={() => navigate(`/support/${ticket._id}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <i className="fas fa-headset text-orange-500 text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-gray-800 text-sm truncate">{ticket.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {last?.text || (last?.file ? "📎 Attachment" : "No messages")}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 animate-bounce shadow">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Ticket Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-800 text-base">New Support Ticket</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200">
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {msg.text && (
              <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}

            {/* Category dropdown */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Topic / Title</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">— Select a topic —</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.label}</option>
                ))}
                <option value="__other__">Other (enter manually)</option>
              </select>
            </div>

            {/* Custom title if Other */}
            {isOther && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Describe your issue briefly..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain your issue in detail..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>

            {/* File upload */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Attach File <span className="text-gray-400 font-normal">(optional, max 5MB)</span></label>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl px-4 py-3 cursor-pointer transition">
                <i className="fas fa-paperclip text-orange-400" />
                <span className="text-sm text-gray-500">{filePreview ? filePreview.name : "Choose image or file"}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
              {filePreview && filePreview.type.startsWith("image/") && (
                <div className="mt-2 relative inline-block">
                  <img src={filePreview.url} alt="preview" className="h-24 rounded-xl object-cover border border-gray-200" />
                  <button onClick={() => { setFile(null); setFilePreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
            >
              {submitting ? <><i className="fas fa-spinner fa-spin" /> Submitting...</> : <><i className="fas fa-paper-plane" /> Submit Ticket</>}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Support;
