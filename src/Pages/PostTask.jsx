import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";
import { WalletContext } from "../Context/WalletContext";

const CATEGORIES = [
  { value: "survey",      label: "Surveys",      icon: "fa-clipboard-list" },
  { value: "video",       label: "Watch Video",  icon: "fa-play-circle" },
  { value: "follow",      label: "Social Media", icon: "fa-users" },
  { value: "signup",      label: "Sign Ups",     icon: "fa-user-plus" },
  { value: "offer",       label: "Offers",       icon: "fa-tag" },
  { value: "app_install", label: "Install Apps", icon: "fa-download" },
  { value: "game",        label: "Games",        icon: "fa-gamepad" },
  { value: "other",       label: "Other",        icon: "fa-tasks" },
];

const INIT = {
  title: "", description: "", category: "",
  payPerTask: "", maxEarners: "", perUserLimit: "1",
  instructions: "", targetUrl: "", expiresAt: "",
};

export default function PostTask() {
  const navigate = useNavigate();
  const { wallet, fetchWallet } = useContext(WalletContext);
  const [form, setForm]         = useState(INIT);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text: "", success: true });
  const [settings, setSettings] = useState(null);

  // Image gallery state
  const [imageFiles, setImageFiles]     = useState([]); // { file, previewUrl, uploading, url }
  const fileInputRef = useRef(null);

  useEffect(() => {
    API.get("/admin/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const flash = (t, s = true) => {
    setMsg({ text: t, success: s });
    setTimeout(() => setMsg({ text: "", success: true }), 5000);
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const payPerTask     = Number(form.payPerTask) || 0;
  const maxEarners     = Number(form.maxEarners) || 0;
  const feePct         = settings?.campaignFeePct ?? settings?.platformFeePct ?? 0;
  const payoutBudget   = parseFloat((payPerTask * maxEarners).toFixed(4));
  const feeAmount      = parseFloat((payoutBudget * feePct / 100).toFixed(4));
  const escrowRequired = parseFloat((payoutBudget + feeAmount).toFixed(4));
  const catMin         = settings?.categoryMinimums?.[form.category] ?? settings?.minPayGlobal ?? 0;

  // ── Image picker ──────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newEntries = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
      url: null,
    }));

    setImageFiles((prev) => [...prev, ...newEntries]);

    // Upload each to backend
    for (const entry of newEntries) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result.split(",")[1]);
          reader.onerror = rej;
          reader.readAsDataURL(entry.file);
        });
        const mimeType = entry.file.type;
        const { data } = await API.post("/campaign/upload-image", { imageBase64: base64, mimeType });
        setImageFiles((prev) =>
          prev.map((img) => img.id === entry.id ? { ...img, uploading: false, url: data.url } : img)
        );
      } catch {
        setImageFiles((prev) =>
          prev.map((img) => img.id === entry.id ? { ...img, uploading: false, error: true } : img)
        );
      }
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeImage = (id) => {
    setImageFiles((prev) => prev.filter((img) => img.id !== id));
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim())       return flash("❌ Title is required.", false);
    if (!form.description.trim()) return flash("❌ Description is required.", false);
    if (!form.category)           return flash("❌ Select a category.", false);
    if (!form.payPerTask || payPerTask <= 0) return flash("❌ Pay per task is required.", false);
    if (!form.maxEarners || maxEarners < 1)  return flash("❌ Max earners is required.", false);
    if (catMin > 0 && payPerTask < catMin)
      return flash(`❌ Minimum pay for this category is $${Number(catMin).toFixed(3)}.`, false);
    if (wallet?.balance < escrowRequired)
      return flash(`❌ Insufficient balance. Need $${escrowRequired.toFixed(4)}, you have $${Number(wallet?.balance || 0).toFixed(4)}.`, false);
    if (imageFiles.some((img) => img.uploading))
      return flash("❌ Please wait for images to finish uploading.", false);

    const uploadedUrls = imageFiles.filter((img) => img.url).map((img) => img.url);

    setSaving(true);
    try {
      const payload = {
        ...form,
        payPerTask:       Number(form.payPerTask),
        maxEarners:       Number(form.maxEarners),
        perUserLimit:     Number(form.perUserLimit) || 1,
        exampleImageUrls: uploadedUrls,
        expiresAt:        form.expiresAt || undefined,
      };
      await API.post("/campaign", payload);
      if (fetchWallet) fetchWallet();
      flash("✅ Campaign submitted! Funds have been held. Awaiting admin review.");
      setForm(INIT);
      setImageFiles([]);
      setTimeout(() => navigate("/task-status"), 2500);
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Failed to submit."), false);
    }
    setSaving(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-28">
      <TopBar />

      <div className="mx-3 mt-4 space-y-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-base font-extrabold text-gray-800 mb-1">📢 Post a Campaign</h1>
          <p className="text-xs text-gray-400">
            Funds are deducted immediately on submit. If admin rejects, you get a full refund.
          </p>
        </div>

        {msg.text && (
          <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {msg.text}
          </div>
        )}

        {/* Category */}
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => set("category", cat.value)}
                className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition text-center ${
                  form.category === cat.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <i className={`fas ${cat.icon} text-xl ${form.category === cat.value ? "text-orange-500" : "text-gray-400"}`}></i>
                <span className={`text-[10px] font-bold mt-1 ${form.category === cat.value ? "text-orange-600" : "text-gray-400"}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          {catMin > 0 && form.category && (
            <p className="text-xs text-orange-500 font-semibold mt-2 bg-orange-50 rounded-xl px-3 py-1.5">
              💡 Minimum pay for {form.category}: ${Number(catMin).toFixed(3)}
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Campaign Details</p>
          {[
            { key: "title",     label: "Title",              placeholder: "e.g. Follow us on Instagram", type: "text" },
            { key: "targetUrl", label: "Link / URL (optional)", placeholder: "https://...",               type: "url"  },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe what users need to do..."
              rows={3}
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Instructions (optional)</label>
            <textarea
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              placeholder="Step by step instructions..."
              rows={3}
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none resize-none"
            />
          </div>

          {/* Image Gallery Picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500">Example Images (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {imageFiles.map((img) => (
                <div key={img.id} className="relative w-20 h-20">
                  <img
                    src={img.previewUrl}
                    alt="preview"
                    className={`w-20 h-20 object-cover rounded-xl border-2 ${img.error ? "border-red-400 opacity-50" : "border-gray-200"}`}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin text-orange-500 text-sm"></i>
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-50/80 rounded-xl flex items-center justify-center">
                      <i className="fas fa-exclamation-circle text-red-500 text-sm"></i>
                    </div>
                  )}
                  {!img.uploading && (
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}

              {/* Add image button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center text-orange-400 hover:bg-orange-50 transition"
              >
                <i className="fas fa-plus text-lg"></i>
                <span className="text-[10px] font-bold mt-1">Add</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-[11px] text-gray-400 mt-1">Tap "Add" to choose from your gallery.</p>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Budget & Limits</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500">Pay Per Task ($)</label>
              <input
                type="number"
                value={form.payPerTask}
                onChange={(e) => set("payPerTask", e.target.value)}
                placeholder="e.g. 0.05"
                step="0.001" min="0"
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Max Earners</label>
              <input
                type="number"
                value={form.maxEarners}
                onChange={(e) => set("maxEarners", e.target.value)}
                placeholder="e.g. 100"
                min="1"
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Per User Limit</label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => set("perUserLimit", e.target.value)}
                placeholder="1"
                min="1"
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm mt-1 outline-none"
              />
            </div>
          </div>

          {payPerTask > 0 && maxEarners > 0 && (
            <div className="bg-orange-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p className="font-bold text-orange-600 mb-2">💰 Cost Breakdown</p>
              {[
                ["Payout Budget",              `$${payoutBudget.toFixed(4)}`],
                [`Platform Fee (${feePct}%)`,  `$${feeAmount.toFixed(4)}`],
                ["Total Deducted on Submit",   `$${escrowRequired.toFixed(4)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500 text-xs">{k}</span>
                  <span className={`font-bold text-xs ${k.includes("Total") ? "text-orange-600" : "text-gray-700"}`}>{v}</span>
                </div>
              ))}
              <div className="border-t border-orange-200 pt-2 flex justify-between">
                <span className="text-xs text-gray-500">Your Balance</span>
                <span className={`text-xs font-bold ${wallet?.balance >= escrowRequired ? "text-green-600" : "text-red-500"}`}>
                  ${Number(wallet?.balance || 0).toFixed(4)}
                  {wallet?.balance < escrowRequired && " ⚠️ Insufficient"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 font-semibold space-y-1">
          <p>💡 <span className="font-extrabold">How it works:</span></p>
          <p>• Funds are deducted from your wallet the moment you submit.</p>
          <p>• If admin approves → campaign goes live immediately.</p>
          <p>• If admin rejects → full refund to your wallet instantly.</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg transition disabled:opacity-50"
        >
          {saving ? "Submitting..." : `Submit & Deduct $${escrowRequired > 0 ? escrowRequired.toFixed(4) : "0.0000"}`}
        </button>
      </div>

      <BottomNav />
    </div>
  );
                }
