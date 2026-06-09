import React, { useContext, useRef, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { WalletContext } from "../Context/WalletContext";
import API from "../api/axios";
import BottomNav from "../Components/BottomNav";
import BadgeIcon from "../Components/BadgeIcon";

export default function Profile() {
  const { user, setUser, logout } = useContext(AuthContext);
  const { wallet } = useContext(WalletContext);
  const [editMode, setEditMode]             = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg]                       = useState({ text: "", success: true });
  const [form, setForm]                     = useState({
    fullName: user?.fullName || "",
    phone:    user?.phone    || "",
    country:  user?.country  || "",
  });
  const fileRef = useRef(null);

  const flash = (text, success = true) => {
    setMsg({ text, success });
    setTimeout(() => setMsg({ text: "", success: true }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await API.put("/users/profile", form);
      setUser((prev) => ({ ...prev, ...res.data }));
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await API.post("/users/avatar", fd);
      setUser((prev) => ({ ...prev, photo: res.data.photo }));
      flash("✅ Photo updated!");
    } catch (err) {
      flash(err.response?.data?.message || "❌ Upload failed.", false);
    }
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=f97316&color=fff&size=128`;

  const hasBadge = user?.badge?.imageUrl && !user?.badge?.hidden;

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      <nav className="bg-orange-400 w-full flex items-center justify-between px-4 sticky top-0 z-50 shadow-md" style={{ height: "64px" }}>
        <h1 className="text-lg font-bold text-white">My Profile</h1>
        <i className="fas fa-cog text-white text-xl"></i>
      </nav>

      <div className="bg-white shadow rounded-xl mx-3 mt-4 p-5 flex flex-col items-center text-center">
        {/* Avatar with badge overlay (Meta-style) */}
        <div className="relative inline-block">
          <img
            src={user?.photo || avatar}
            alt="Avatar"
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #f97316" }}
          />
          {/* Badge pinned bottom-right of avatar like Meta verification */}
          {hasBadge && (
            <span
              className="absolute bottom-0 left-0 flex items-center justify-center"
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 0 0 2px #f97316",
                padding: "2px",
              }}
              title={user.badge.name}
            >
              <img
                src={user.badge.imageUrl}
                alt={user.badge.name}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            </span>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50"
          >
            {uploadingPhoto
              ? <i className="fas fa-spinner fa-spin text-[10px]"></i>
              : <i className="fas fa-camera text-[10px]"></i>
            }
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Name row with inline badge (Meta verification style) */}
        <div className="flex items-center justify-center gap-1 mt-3">
          <h2 className="text-base font-bold text-gray-800">{user?.fullName}</h2>
          {hasBadge && <BadgeIcon badge={user.badge} size={18} />}
        </div>

        <p className="text-gray-400 text-xs mt-0.5">
          Member since {new Date(user?.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </p>

        {/* Level pill + badge name pill */}
        <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
            {user?.referralLevel ? `Level ${user.referralLevel}` : "Member"}
          </span>
          {hasBadge && (
            <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              <img
                src={user.badge.imageUrl}
                alt={user.badge.name}
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 0 0 1.5px #f97316",
                }}
              />
              <span className="text-[11px] font-bold text-orange-600">{user.badge.name}</span>
            </span>
          )}
        </div>

        {msg.text && (
          <p className={`text-xs font-semibold mt-2 ${msg.success ? "text-green-600" : "text-red-500"}`}>
            {msg.text}
          </p>
        )}
      </div>

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
                type={type} value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none transition"
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave} disabled={saving}
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
