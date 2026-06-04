import React, { useContext, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { WalletContext } from "../Context/WalletContext";
import { updateProfile } from "../api/index";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";
import logo from "../Assets/logo.png";

export default function Profile() {
  const { user, setUser, logout } = useContext(AuthContext);
  const { wallet } = useContext(WalletContext);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text: "", success: true });
  const [form, setForm]         = useState({
    fullName: user?.fullName || "",
    phone:    user?.phone    || "",
    country:  user?.country  || "",
  });

  const flash = (text, success = true) => {
    setMsg({ text, success });
    setTimeout(() => setMsg({ text: "", success: true }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setUser((prev) => ({ ...prev, ...updated }));
      flash("✅ Profile updated!");
      setEditMode(false);
    } catch (err) {
      flash(err.response?.data?.message || "❌ Update failed.", false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({ fullName: user?.fullName || "", phone: user?.phone || "", country: user?.country || "" });
    setEditMode(false);
  };

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=f97316&color=fff&size=128`;

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* Top nav */}
      <nav className="bg-orange-400 w-full flex items-center justify-between px-4 sticky top-0 z-50 shadow-md" style={{ height: "64px" }}>
        <h1 className="text-lg font-bold text-white">My Profile</h1>
        <i className="fas fa-cog text-white text-xl"></i>
      </nav>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-xl mx-3 mt-4 p-5 flex flex-col items-center text-center">
        <img
          src={user?.photo || avatar}
          alt="Avatar"
          style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #f97316" }}
        />
        <h2 className="text-base font-bold text-gray-800 mt-3">{user?.fullName}</h2>
        <p className="text-gray-400 text-xs mt-0.5">
          Member since {new Date(user?.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </p>
        {user?.badge && (
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
              {user?.referralLevel ? `Level ${user.referralLevel}` : "Member"}
            </span>
          </div>
        )}
      </div>

      {/* Account Details */}
      <div className="bg-white shadow rounded-xl mx-3 mt-3 p-4">
        <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">Account Details</h3>
        {[
          { label: "Email",         value: user?.email },
          { label: "Phone",         value: user?.phone    || "Not set" },
          { label: "Country",       value: user?.country  || "Not set" },
          { label: "Referral Code", value: user?.referralCode || "—" },
          { label: "Total Balance", value: `$${Number(wallet?.balance || 0).toFixed(2)}`, green: true },
        ].map(({ label, value, green }) => (
          <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500 font-medium">{label}</span>
            <span className={`text-xs font-bold ${green ? "text-green-500" : "text-gray-700"}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      {editMode && (
        <div className="bg-white shadow rounded-xl mx-3 mt-3 p-4">
          <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">Edit Profile</h3>
          {[
            { name: "fullName", label: "Full Name", type: "text" },
            { name: "phone",    label: "Phone",     type: "tel" },
            { name: "country",  label: "Country",   type: "text" },
          ].map(({ name, label, type }) => (
            <div key={name} className="mb-3">
              <label className="text-xs text-gray-500 font-semibold block mb-1">{label}</label>
              <input
                type={type}
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>
          ))}
          {msg.text && (
            <p className={`text-xs font-semibold text-center mb-2 ${msg.success ? "text-green-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-2 text-sm transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl py-2 text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white shadow rounded-xl mx-3 mt-3 p-4 space-y-2">
        <h3 className="font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-1">Actions</h3>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition"
          >
            <i className="fas fa-user-edit"></i> Edit Profile
          </button>
        )}
        <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition">
          <i className="fas fa-lock"></i> Change Password
        </button>
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition"
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
