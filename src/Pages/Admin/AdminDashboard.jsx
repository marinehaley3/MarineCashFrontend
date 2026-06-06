import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
    <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center shrink-0`}>
      <i className={`fas ${icon} text-white text-lg`}></i>
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-xl font-extrabold text-gray-800">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/admin/analytics"),
      API.get("/admin/settings"),
    ])
      .then(([aRes, sRes]) => { setAnalytics(aRes.data); setSettings(sRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-orange-500 font-bold animate-pulse">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-extrabold text-gray-800">Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="fa-users"       label="Total Users"      value={analytics?.totalUsers      ?? "—"} color="bg-purple-500" />
        <StatCard icon="fa-ban"         label="Blocked Users"    value={analytics?.blockedUsers    ?? "—"} color="bg-red-500" />
        <StatCard icon="fa-list-check"  label="Total Campaigns"  value={analytics?.totalCampaigns  ?? "—"} color="bg-blue-500" />
        <StatCard icon="fa-dollar-sign" label="Platform Revenue" value={`$${Number(analytics?.totalRevenue ?? 0).toFixed(2)}`} color="bg-green-500" />
      </div>

      {/* Current Settings snapshot */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <i className="fas fa-sliders text-orange-500"></i> Current Settings
        </h3>
        {settings ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Platform Fee",        value: settings.platformFeePct       != null ? `${settings.platformFeePct}%`      : "Not set" },
              { label: "Withdrawal Fee",      value: settings.withdrawalFeePct     != null ? `${settings.withdrawalFeePct}%`    : "Not set" },
              { label: "Offerwall Fee",       value: settings.offerwallFeePct      != null ? `${settings.offerwallFeePct}%`     : "Not set" },
              { label: "Min Withdrawal",      value: settings.minWithdrawal        != null ? `$${settings.minWithdrawal}`       : "Not set" },
              { label: "Signup Bonus",        value: settings.signupBonus          != null ? `$${settings.signupBonus}`         : "Not set" },
              { label: "Daily Check-in",      value: settings.dailyCheckInAmount   != null ? `$${settings.dailyCheckInAmount}`  : "Not set" },
              { label: "Check-in Enabled",    value: settings.dailyCheckInEnabled  != null ? (settings.dailyCheckInEnabled ? "Yes" : "No") : "Not set" },
              { label: "Referral Commission", value: settings.referralCommissionPct != null ? `${settings.referralCommissionPct}%` : "Not set" },
              { label: "Maintenance Mode",    value: settings.maintenanceMode      != null ? (settings.maintenanceMode ? "ON 🔴" : "OFF 🟢") : "Not set" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Settings not loaded.</p>
        )}
      </div>

      {/* Maintenance mode quick toggle */}
      {settings && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${settings.maintenanceMode ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          <div>
            <p className="font-bold text-gray-800 text-sm">Maintenance Mode</p>
            <p className="text-xs text-gray-500 mt-0.5">{settings.maintenanceMessage || "No message set"}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${settings.maintenanceMode ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
            {settings.maintenanceMode ? "ON" : "OFF"}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
