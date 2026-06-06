import React, { useEffect, useState } from "react";
import { adminGetUsers, adminSetPermissions, adminChangeRole } from "../../api/index";

const ALL_SECTIONS = [
  { key: "settings",      label: "Settings" },
  { key: "badges",        label: "Badges" },
  { key: "users",         label: "Users" },
  { key: "rewards",       label: "Reward Codes" },
  { key: "announcements", label: "Announcements" },
  { key: "polls",         label: "Polls" },
  { key: "withdrawals",   label: "Withdrawals" },
];

const AdminPermissions = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);
  const [msg, setMsg]         = useState({ text: "", success: true });
  const [selected, setSelected] = useState(null);
  const [hidden, setHidden]   = useState([]);

  const flash = (t, s = true) => { setMsg({ text: t, success: s }); setTimeout(() => setMsg({ text: "", success: true }), 3000); };

  useEffect(() => {
    adminGetUsers({ role: "admin", limit: 50 })
      .then((res) => setAdmins(res.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (admin) => {
    setSelected(admin);
    setHidden(admin.hiddenSections || []);
  };

  const toggleSection = (key) => {
    setHidden((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(selected._id);
    try {
      await adminSetPermissions({ userId: selected._id, hiddenSections: hidden });
      flash(`✅ Permissions updated for ${selected.fullName}`);
      setSelected(null);
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
    setSaving(null);
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminChangeRole({ userId, role });
      flash(`Role updated ✅`);
      setAdmins((prev) => prev.map((a) => a._id === userId ? { ...a, role } : a));
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-extrabold text-gray-800">
        <i className="fas fa-shield-halved text-orange-500 mr-2"></i>Admin Permissions
      </h2>
      <p className="text-sm text-gray-500">Control what each admin can see in their dashboard sidebar.</p>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <p className="text-center text-orange-500 animate-pulse font-bold py-8">Loading...</p>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <i className="fas fa-user-shield text-gray-200 text-5xl mb-3"></i>
          <p className="text-gray-400 text-sm">No admins found. Promote a user to admin first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{admin.fullName}</p>
                  <p className="text-xs text-gray-400">{admin.email}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {(admin.hiddenSections || []).length === 0 ? (
                      <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Full Access</span>
                    ) : (
                      (admin.hiddenSections || []).map((s) => (
                        <span key={s} className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">{s} hidden</span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <select
                    value={admin.role}
                    onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                    className="border-2 border-gray-200 focus:border-orange-400 rounded-xl px-2 py-1.5 text-xs outline-none bg-white"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  <button
                    onClick={() => handleSelect(admin)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-1">Edit Permissions</h3>
            <p className="text-xs text-gray-400 mb-4">{selected.fullName} — toggle sections to hide from their sidebar</p>
            <div className="space-y-2 mb-5">
              {ALL_SECTIONS.map((s) => {
                const isHidden = hidden.includes(s.key);
                return (
                  <label key={s.key} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition ${isHidden ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                    <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${isHidden ? "text-red-500" : "text-green-600"}`}>
                        {isHidden ? "Hidden" : "Visible"}
                      </span>
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleSection(s.key)}
                        className="w-4 h-4 accent-orange-500"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving === selected._id}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              >
                {saving === selected._id ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPermissions;
