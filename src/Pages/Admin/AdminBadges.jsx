import React, { useEffect, useState } from "react";
import { adminGetSettings, adminUpdateBadgeTiers } from "../../api/index";

const empty = { name: "", minReferrals: "", badgeImage: "", color: "#f97316" };

const AdminBadges = () => {
  const [tiers, setTiers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState({ text: "", success: true });

  const flash = (text, success = true) => {
    setMsg({ text, success });
    setTimeout(() => setMsg({ text: "", success: true }), 3000);
  };

  useEffect(() => {
    adminGetSettings()
      .then((s) => setTiers(s.badgeTiers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (i, field, value) => {
    setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const handleAdd = () => setTiers((prev) => [...prev, { ...empty }]);

  const handleRemove = (i) => setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = tiers.map((t) => ({
        name: t.name,
        minReferrals: Number(t.minReferrals),
        badgeImage: t.badgeImage,
        color: t.color,
      }));
      await adminUpdateBadgeTiers(cleaned);
      flash("✅ Badge tiers saved!");
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Save failed."), false);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-orange-500 font-bold animate-pulse">Loading...</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-gray-800">Badge Tiers</h2>
        <button onClick={handleAdd} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-2">
          <i className="fas fa-plus"></i> Add Tier
        </button>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {tiers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <i className="fas fa-medal text-gray-200 text-5xl mb-3"></i>
          <p className="text-gray-400 text-sm">No badge tiers yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200" style={{ backgroundColor: tier.color }}></div>
                  <p className="font-bold text-gray-700 text-sm">{tier.name || `Tier ${i + 1}`}</p>
                </div>
                <button onClick={() => handleRemove(i)} className="text-red-400 hover:text-red-600 transition text-sm">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold">Name</label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => handleChange(i, "name", e.target.value)}
                    placeholder="e.g. Gold"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold">Min Referrals</label>
                  <input
                    type="number"
                    value={tier.minReferrals}
                    onChange={(e) => handleChange(i, "minReferrals", e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold">Badge Image URL</label>
                  <input
                    type="text"
                    value={tier.badgeImage}
                    onChange={(e) => handleChange(i, "badgeImage", e.target.value)}
                    placeholder="/Assets/gold.jpg or https://..."
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold">Color</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={tier.color}
                      onChange={(e) => handleChange(i, "color", e.target.value)}
                      className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tier.color}
                      onChange={(e) => handleChange(i, "color", e.target.value)}
                      className="flex-1 border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Tiers"}
        </button>
      )}
    </div>
  );
};

export default AdminBadges;
