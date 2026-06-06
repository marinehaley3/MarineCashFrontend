import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const AdminAnnouncements = () => {
  const [items, setItems]     = useState([]);
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: "", success: true });

  const flash = (t, s = true) => { setMsg({ text: t, success: s }); setTimeout(() => setMsg({ text: "", success: true }), 3000); };

  const fetchAnnouncements = () => {
    API.get("/admin/announcements")
      .then((res) => setItems(res.data.announcements || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await API.post("/admin/announcements", { text: text.trim() });
      setText("");
      flash("✅ Announcement added!");
      fetchAnnouncements();
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
    setSaving(false);
  };

  const handleToggle = async (id, isActive) => {
    try {
      await API.patch(`/admin/announcements/${id}`, { isActive: !isActive });
      flash(`${!isActive ? "Shown" : "Hidden"} ✅`);
      fetchAnnouncements();
    } catch (e) { flash("❌ Failed.", false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await API.delete(`/admin/announcements/${id}`);
      flash("✅ Deleted");
      fetchAnnouncements();
    } catch (e) { flash("❌ Failed.", false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-extrabold text-gray-800">Announcements</h2>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {/* Add */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold text-gray-700 mb-3">Add Announcement</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write announcement text..."
            className="flex-1 border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
          >
            {saving ? "..." : "Post"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="text-center text-orange-500 animate-pulse py-8 text-sm font-bold">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No announcements yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...items].reverse().map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${item.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                    {item.text}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(item._id, item.isActive)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${item.isActive ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                  >
                    {item.isActive ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
