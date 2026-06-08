import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const Field = ({ label, name, value, onChange, type = "number", hint }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
    {hint && <p className="text-[11px] text-gray-400 mb-1">{hint}</p>}
    <input
      type={type}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder="Not set"
      className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none transition"
    />
  </div>
);

const Toggle = ({ name, checked, onChange, label, accent = "orange" }) => (
  <label className="flex items-center justify-between cursor-pointer mt-3 bg-gray-50 rounded-xl px-4 py-3">
    <span className="text-sm font-semibold text-gray-600">{label}</span>
    <div
      onClick={() => onChange({ target: { name, type: "checkbox", checked: !checked } })}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? (accent === "red" ? "bg-red-500" : "bg-green-500") : "bg-gray-300"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </div>
  </label>
);

const AdminSettings = () => {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);
  const [msg, setMsg]         = useState({ text: "", success: true });

  useEffect(() => {
    API.get("/admin/settings")
      .then((res) => {
        const s = res.data;
        setForm({
          platformFeePct:          s.platformFeePct          ?? "",
          campaignFeePct:          s.campaignFeePct          ?? "",
          offerwallFeePct:         s.offerwallFeePct         ?? "",
          withdrawalFeePct:        s.withdrawalFeePct        ?? "",
          minWithdrawal:           s.minWithdrawal           ?? "",
          withdrawalDays:          s.withdrawalDays          ?? "",
          signupBonus:             s.signupBonus             ?? "",
          dailyCheckInAmount:      s.dailyCheckInAmount      ?? "",
          dailyCheckInEnabled:     s.dailyCheckInEnabled     ?? false,
          referralCommissionPct:   s.referralCommissionPct   ?? "",
          referralSystemCutPct:    s.referralSystemCutPct    ?? "",
          referralTasksToActivate: s.referralTasksToActivate ?? "",
          autoApproveDays:         s.autoApproveDays         ?? "",
          minPayGlobal:            s.minPayGlobal            ?? "",
          catMin_survey:      s.categoryMinimums?.survey      ?? "",
          catMin_video:       s.categoryMinimums?.video       ?? "",
          catMin_follow:      s.categoryMinimums?.follow      ?? "",
          catMin_signup:      s.categoryMinimums?.signup      ?? "",
          catMin_offer:       s.categoryMinimums?.offer       ?? "",
          catMin_app_install: s.categoryMinimums?.app_install ?? "",
          catMin_game:        s.categoryMinimums?.game        ?? "",
          catMin_other:       s.categoryMinimums?.other       ?? "",
          maintenanceMode:         s.maintenanceMode         ?? false,
          maintenanceMessage:      s.maintenanceMessage      ?? "",
          showTopEarners:          s.showTopEarners          ?? true,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (section) => {
    setSaving(section.key);
    try {
      const payload = {};

      section.fields.forEach((f) => {
        if (form[f] !== "") {
          payload[f] = typeof form[f] === "boolean" ? form[f] : Number(form[f]) || form[f];
        }
      });

      if (section.key === "campaigns") {
        const CATS = ["survey", "video", "follow", "signup", "offer", "app_install", "game", "other"];
        const categoryMinimums = {};
        CATS.forEach((cat) => {
          const val = form[`catMin_${cat}`];
          if (val !== "" && val != null) categoryMinimums[cat] = Number(val);
        });
        payload.categoryMinimums = categoryMinimums;
      }

      await API.put("/admin/settings", payload);
      setMsg({ text: "✅ Saved!", success: true });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "❌ Save failed.", success: false });
    }
    setSaving(null);
    setTimeout(() => setMsg({ text: "", success: true }), 3000);
  };

  const CATEGORY_LABELS = [
    { key: "survey",      label: "Surveys" },
    { key: "video",       label: "Watch Video" },
    { key: "follow",      label: "Social Media" },
    { key: "signup",      label: "Sign Ups" },
    { key: "offer",       label: "Offers" },
    { key: "app_install", label: "Install Apps" },
    { key: "game",        label: "Games" },
    { key: "other",       label: "Other" },
  ];

  const sections = [
    {
      title: "💰 Fees",
      key: "fees",
      fields: ["platformFeePct", "offerwallFeePct", "withdrawalFeePct"],
      inputs: [
        { label: "Platform Fee %",   name: "platformFeePct",   hint: "General platform fee %" },
        { label: "Offerwall Fee %",  name: "offerwallFeePct",  hint: "Cut from offerwall rewards" },
        { label: "Withdrawal Fee %", name: "withdrawalFeePct", hint: "Fee deducted on withdrawals" },
      ],
    },
    {
      title: "📢 Campaigns",
      key: "campaigns",
      fields: ["campaignFeePct", "minPayGlobal"],
      inputs: [
        { label: "Campaign Fee %",           name: "campaignFeePct", hint: "% cut from total campaign budget when funded" },
        { label: "Global Min Pay/Task ($)",   name: "minPayGlobal",   hint: "Applies to all categories unless overridden below" },
      ],
      extras: (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Per-Category Minimums ($) — leave blank to use global minimum
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_LABELS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500">{label}</label>
                <input
                  type="number"
                  name={`catMin_${key}`}
                  value={form[`catMin_${key}`] ?? ""}
                  onChange={handleChange}
                  placeholder="Global default"
                  step="0.001"
                  min="0"
                  className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none transition"
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "🏦 Wallet",
      key: "wallet",
      fields: ["minWithdrawal", "withdrawalDays", "signupBonus"],
      inputs: [
        { label: "Minimum Withdrawal ($)",        name: "minWithdrawal",  hint: "e.g. 5" },
        { label: "Withdrawal Day (0=Sun, 5=Fri)", name: "withdrawalDays", hint: "Day of week withdrawals open" },
        { label: "Signup Bonus ($)",              name: "signupBonus",    hint: "Given after email verification" },
      ],
    },
    {
      title: "📅 Daily Check-in",
      key: "checkin",
      fields: ["dailyCheckInAmount", "dailyCheckInEnabled"],
      inputs: [
        { label: "Check-in Amount ($)", name: "dailyCheckInAmount", hint: "Amount user claims daily" },
      ],
      extras: (
        <Toggle
          name="dailyCheckInEnabled"
          checked={form.dailyCheckInEnabled || false}
          onChange={handleChange}
          label="Enable Daily Check-in"
        />
      ),
    },
    {
      title: "👥 Referral",
      key: "referral",
      fields: ["referralCommissionPct", "referralSystemCutPct", "referralTasksToActivate"],
      inputs: [
        { label: "Referral Commission %",        name: "referralCommissionPct",   hint: "% of referee earnings given to referrer" },
        { label: "System Cut from Commission %", name: "referralSystemCutPct",    hint: "% platform takes from that commission" },
        { label: "Tasks to Activate Referral",   name: "referralTasksToActivate", hint: "Tasks referee must complete to activate" },
      ],
    },
    {
      title: "📋 Tasks",
      key: "tasks",
      fields: ["autoApproveDays"],
      inputs: [
        { label: "Auto-approve After (days)", name: "autoApproveDays", hint: "Pending submissions auto-approved after this many days. 0 = disabled" },
      ],
    },
    {
      title: "🏆 Top Earners",
      key: "topearners",
      fields: ["showTopEarners"],
      inputs: [],
      extras: (
        <Toggle
          name="showTopEarners"
          checked={form.showTopEarners ?? true}
          onChange={handleChange}
          label="Show Top Earners leaderboard to users"
        />
      ),
    },
    {
      title: "🔧 Maintenance",
      key: "maintenance",
      fields: ["maintenanceMode", "maintenanceMessage"],
      inputs: [
        { label: "Maintenance Message", name: "maintenanceMessage", type: "text", hint: "Shown to users while maintenance is ON" },
      ],
      extras: (
        <Toggle
          name="maintenanceMode"
          checked={form.maintenanceMode || false}
          onChange={handleChange}
          label="Enable Maintenance Mode"
          accent="red"
        />
      ),
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-orange-500 font-bold animate-pulse">Loading settings...</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-extrabold text-gray-800">Platform Settings</h2>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-gray-700 mb-4">{section.title}</h3>
          <div className="space-y-3">
            {section.inputs.map((input) => (
              <Field
                key={input.name}
                label={input.label}
                name={input.name}
                value={form[input.name]}
                onChange={handleChange}
                type={input.type || "number"}
                hint={input.hint}
              />
            ))}
            {section.extras}
          </div>
          <button
            onClick={() => handleSave(section)}
            disabled={saving === section.key}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition disabled:opacity-50"
          >
            {saving === section.key ? "Saving..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminSettings;
