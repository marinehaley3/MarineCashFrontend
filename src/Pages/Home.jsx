// src/Pages/Home.jsx
import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { WalletContext } from "../Context/WalletContext";
import { RewardCodeContext } from "../Context/RewardCodeContext";
import API from "../api/axios";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";

const menuItems = [
  { icon: "fa-coins",           color: "text-green-500",   label: "Earn",          to: "/earn" },
  { icon: "fa-wallet",          color: "text-blue-500",    label: "Wallet",        to: "/wallet" },
  { icon: "fa-users",           color: "text-purple-500",  label: "Referrals",     to: "/referral" },
  { icon: "fa-user",            color: "text-orange-500",  label: "Profile",       to: "/profile" },
  { icon: "fa-whatsapp fab",    color: "text-green-500",   label: "Join Group",    to: "https://chat.whatsapp.com/EUQiHGRx8IqEFWZd9NoUML", external: true },
  { icon: "fa-comments",        color: "text-pink-500",    label: "Chatroom",      to: "/chat" },
  { icon: "fa-circle-question", color: "text-indigo-500",  label: "FAQ",           to: "/faq" },
  { icon: "fa-headset",         color: "text-red-500",     label: "Support",       to: "/support" },
  { icon: "fa-plus-circle",     color: "text-yellow-500",  label: "Post Task",     to: "/post-task" },
  { icon: "fa-bell",            color: "text-teal-500",    label: "Notifications", to: "/notifications" },
  { icon: "fa-crown",           color: "text-amber-500",   label: "Top Earners",   to: "/top-earners" },
];

// Returns how many hours:minutes until midnight
const timeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  return `${h}h ${m}m`;
};

export default function Home() {
  const { user } = useContext(AuthContext);
  const { wallet, fetchWallet } = useContext(WalletContext);
  const { redeemCode } = useContext(RewardCodeContext);

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  // Check-in state
  const [checkInAmount, setCheckInAmount] = useState(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  const [countdown, setCountdown] = useState("");

  // Load daily check-in settings + whether user already claimed today
  useEffect(() => {
    const loadCheckIn = async () => {
      try {
        const res = await API.get("/admin/settings");
        const s = res.data.settings || res.data;
        setCheckInAmount(s.dailyCheckInAmount ?? null);
        setCheckInEnabled(s.dailyCheckInEnabled ?? false);
      } catch {
        // silently fail — button will just show default state
      }

      // Determine if already claimed from lastCheckIn on user object
      if (user?.lastCheckIn) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(user.lastCheckIn) >= today) {
          setAlreadyClaimed(true);
        }
      }
    };
    loadCheckIn();
  }, [user]);

  // Countdown ticker when already claimed
  useEffect(() => {
    if (!alreadyClaimed) return;
    setCountdown(timeUntilMidnight());
    const interval = setInterval(() => setCountdown(timeUntilMidnight()), 60000);
    return () => clearInterval(interval);
  }, [alreadyClaimed]);

  const handleCheckIn = async () => {
    setClaiming(true);
    try {
      const res = await API.post("/admin/daily-checkin");
      setMsg(`✅ Claimed! +$${Number(res.data.amount).toFixed(3)} added to your wallet`);
      setAlreadyClaimed(true);
      if (fetchWallet) fetchWallet();
    } catch (err) {
      const m = err.response?.data?.message || "❌ Failed to claim.";
      setMsg(m);
      if (err.response?.status === 400) setAlreadyClaimed(true); // already claimed
    }
    setClaiming(false);
    setTimeout(() => setMsg(""), 5000);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const res = await redeemCode(code.trim().toUpperCase());
      setMsg(`✅ Redeemed! +$${Number(res.amount).toFixed(3)}`);
      setCode("");
      if (fetchWallet) fetchWallet();
    } catch (err) {
      setMsg(err.response?.data?.message || "❌ Invalid code");
    }
    setTimeout(() => setMsg(""), 4000);
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      <TopBar />

      {/* ── Daily Check-in ── */}
      <section className="flex justify-between items-center px-4 py-4 shadow rounded-xl mt-4 mx-2 bg-white">
        <div>
          <p className="font-semibold text-gray-700">Daily Check-in</p>
          {alreadyClaimed ? (
            <p className="text-xs text-gray-400">Next claim in <span className="font-bold text-orange-500">{countdown}</span></p>
          ) : (
            <p className="text-xs text-gray-400">
              {checkInEnabled && checkInAmount != null
                ? `Claim $${Number(checkInAmount).toFixed(3)} today`
                : "Come back every day to claim"}
            </p>
          )}
        </div>

        {!checkInEnabled ? (
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-4 py-2 rounded-xl">
            Disabled
          </span>
        ) : alreadyClaimed ? (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            ✓ Claimed
          </span>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={claiming}
            className="bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-bold rounded-xl px-4 py-2 text-sm shadow disabled:opacity-50"
          >
            {claiming
              ? "Claiming..."
              : `Claim${checkInAmount != null ? ` $${Number(checkInAmount).toFixed(3)}` : ""}`}
          </button>
        )}
      </section>

      {/* Global message */}
      {msg && (
        <div className={`mx-2 mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-center ${msg.startsWith("✅") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg}
        </div>
      )}

      {/* ── Menu Grid ── */}
      <main className="grid grid-cols-3 gap-4 text-center px-4 py-4 m-2">
        {menuItems.map((item) =>
          item.external ? (
            <a
              key={item.label}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white shadow rounded-xl p-3 flex flex-col items-center hover:scale-105 transition-all"
            >
              <i className={`fas ${item.icon} ${item.color} text-4xl`}></i>
              <p className="text-xs font-semibold mt-2 text-gray-700">{item.label}</p>
            </a>
          ) : (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white shadow rounded-xl p-3 flex flex-col items-center hover:scale-105 transition-all"
            >
              <i className={`fas ${item.icon} ${item.color} text-4xl`}></i>
              <p className="text-xs font-semibold mt-2 text-gray-700">{item.label}</p>
            </Link>
          )
        )}
      </main>

      {/* ── Announcements ── */}
      <section className="bg-white shadow mx-2 my-2 p-4 rounded-xl">
        <h2 className="font-semibold text-gray-700 mb-2">📢 Announcements</h2>
        <ul className="space-y-1 list-disc pl-5 text-sm text-gray-600">
          <li>✅ New tasks available in Earn Section.</li>
          <li>💰 Do simple tasks and get paid.</li>
          <li>🏦 Withdrawals processed every Friday.</li>
          <li>⚠️ Minimum withdrawal is $5.</li>
        </ul>
      </section>

      {/* ── Reward Code ── */}
      <section className="bg-white shadow mx-2 mt-2 p-4 rounded-xl">
        <p className="font-semibold text-gray-700 mb-2">🎁 Redeem Code</p>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Reward Code"
            className="flex-1 border-2 border-blue-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 text-sm transition-all"
          >
            Redeem
          </button>
        </form>
      </section>

      <BottomNav />
    </div>
  );
}
