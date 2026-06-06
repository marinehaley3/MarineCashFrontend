import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const AdminPolls = () => {
  const [polls, setPolls]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: "", success: true });
  const [form, setForm]       = useState({ question: "", options: ["", ""], expiresAt: "" });

  const flash = (t, s = true) => { setMsg({ text: t, success: s }); setTimeout(() => setMsg({ text: "", success: true }), 3000); };

  const fetchPolls = () => {
    API.get("/admin/polls")
      .then((res) => setPolls(res.data.polls || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPolls(); }, []);

  const handleOptionChange = (i, val) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[i] = val;
      return { ...prev, options: opts };
    });
  };

  const handleAddOption    = () => setForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  const handleRemoveOption = (i) => setForm((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const opts = form.options.filter((o) => o.trim());
    if (!form.question.trim() || opts.length < 2) return flash("❌ Need a question and at least 2 options.", false);
    setSaving(true);
    try {
      await API.post("/admin/polls", { question: form.question.trim(), options: opts, expiresAt: form.expiresAt || undefined });
      setForm({ question: "", options: ["", ""], expiresAt: "" });
      flash("✅ Poll created!");
      fetchPolls();
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
    setSaving(false);
  };

  const handleClose = async (id) => {
    try { await API.patch(`/admin/polls/${id}/close`); flash("Poll closed ✅"); fetchPolls(); }
    catch (e) { flash("❌ Failed.", false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this poll?")) return;
    try { await API.delete(`/admin/polls/${id}`); flash("✅ Deleted"); fetchPolls(); }
    catch (e) { flash("❌ Failed.", false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-extrabold text-gray-800">Polls</h2>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {/* Create */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold text-gray-700 mb-4">Create Poll</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              placeholder="What do you want to ask?"
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Options</label>
            <div className="space-y-2 mt-1">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOption(i)} className="text-red-400 hover:text-red-600 px-2">
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleAddOption} className="text-xs text-orange-500 font-semibold mt-2 hover:underline">
              + Add option
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Poll"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-orange-500 animate-pulse font-bold text-sm py-4">Loading...</p>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400 text-sm">No polls yet.</p>
          </div>
        ) : (
          [...polls].reverse().map((poll) => {
            const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
            return (
              <div key={poll._id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{poll.question}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${poll.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                        {poll.isActive ? "Active" : "Closed"}
                      </span>
                      <span className="text-[10px] text-gray-400">{totalVotes} votes</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {poll.isActive && (
                      <button onClick={() => handleClose(poll._id)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition">
                        Close
                      </button>
                    )}
                    <button onClick={() => handleDelete(poll._id)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0;
                    return (
                      <div key={opt._id}>
                        <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                          <span className="font-medium">{opt.text}</span>
                          <span className="font-bold">{pct}% ({opt.votes?.length || 0})</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-2 bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminPolls;
