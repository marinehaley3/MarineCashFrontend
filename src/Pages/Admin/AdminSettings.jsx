import React, { useEffect, useState } from "react";
import { adminGetSettings, adminUpdateSettings } from "../../api/index";

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

const AdminSettings = () => {
  const [form, setForm]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: "", success: true });

  useEffect(() => {
    adminGetSettings()
      .then((s) => setForm({
        platformFeePct:          s.platformFeePct          ?? "",
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
        maintenanceMode:         s.maintenanceMode         ?? false,
        maintenanceMessage:      s.maintenanceMessage      ?? "",
      }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (section) => {
    setSaving(section);
    try {
      const payload = {};
      section.fields.forEach((f) => {
        if (form[f] !== "") payload[f] = typeof form[f] === "boolean" ? form[f] : Number(form[f]) || form[f];
      });
      await adminUpdateSettings(payload);
      setMsg({ text: "✅ Saved!", success: true });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "❌ Save failed.", success: false });
    }
    setSaving(null);
    setTimeout(() => setMsg({ text: "", success: true }), 3000);
  };

  const sections = [
    {
      title: "💰 Fees",
      key: "fees",
      fields: ["platformFeePct", "offerwallFeePct", "withdrawalFeePct"],
      inputs: [
        { label: "Platform Fee %",   name: "platformFeePct",   hint: "Charged on campaign deposits" },
        { label: "Offerwall Fee %",  name: "offerwallFeePct",  hint: "Cut from offerwall rewards" },
        { label: "Withdrawal Fee %", name: "withdrawalFeePct", hint: "Fee deducted on withdrawals" },
      ],
    },
    {
      title: "🏦 Wallet",
      key: "wallet",
      fields: ["minWithdrawal", "withdrawalDays", "signupBonus"],
      inputs: [
        { label: "Minimum Withdrawal ($)", name: "minWithdrawal",  hint: "e.g. 5" },
        { label: "Withdrawal Day (0=Sun, 5=Fri)", name: "withdrawalDays", hint: "Day of week withdrawals open" },
        { label: "Signup Bonus ($)",       name: "signupBonus",    hint: "Given after email verification" },
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
        <label className="flex items-center gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            name="dailyCheckInEnabled"
            checked={form.dailyCheckInEnabled || false}
            onChange={handleChange}
            className="w-5 h-5 accent-orange-500"
          />
          <span className="text-sm font-semibold text-gray-600">Enable Daily Check-in</span>
        </label>
      ),
    },
    {
      title: "👥 Referral",
      key: "referral",
      fields: ["referralCommissionPct", "referralSystemCutPct", "referralTasksToActivate"],
      inputs: [
        { label: "Referral Commission %",       name: "referralCommissionPct",   hint: "% of referee earnings given to referrer" },
        { label: "System Cut from Commission %",name: "referralSystemCutPct",    hint: "% platform takes from commission" },
        { label: "Tasks to Activate Referral",  name: "referralTasksToActivate", hint: "Tasks referee must complete" },
      ],
    },
    {
      title: "📋 Tasks",
      key: "tasks",
      fields: ["autoApproveDays", "minPayGlobal"],
      inputs: [
        { label: "Auto-approve After (days)", name: "autoApproveDays", hint: "0 = disabled" },
        { label: "Min Pay Per Task ($)",      name: "minPayGlobal",    hint: "Global minimum task reward" },
      ],
    },
    {
      title: "🔧 Maintenance",
      key: "maintenance",
      fields: ["maintenanceMode", "maintenanceMessage"],
      inputs: [
        { label: "Maintenance Message", name: "maintenanceMessage", type: "text", hint: "Shown to users when maintenance is ON" },
      ],
      extras: (
        <label className="flex items-center gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            name="maintenanceMode"
            checked={form.maintenanceMode || false}
            onChange={handleChange}
            className="w-5 h-5 accent-red-500"
          />
          <span className="text-sm font-semibold text-gray-600">Enable Maintenance Mode</span>
        </label>
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
            disabled={saving === section}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition disabled:opacity-50"
          >
            {saving === section ? "Saving..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AdminSettings;
