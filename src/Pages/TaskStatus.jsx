import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";
import { WalletContext } from "../Context/WalletContext";
import { CampaignContext } from "../Context/CampaignContext";

const STATUS_COLORS = {
  pending_approval: "bg-yellow-100 text-yellow-700",
  active:           "bg-green-100 text-green-700",
  paused:           "bg-gray-100 text-gray-600",
  exhausted:        "bg-orange-100 text-orange-700",
  stopped:          "bg-red-100 text-red-500",
  rejected:         "bg-red-100 text-red-700",
};

const SUB_COLORS = {
  pending:       "bg-yellow-100 text-yellow-700",
  approved:      "bg-green-100 text-green-600",
  auto_approved: "bg-green-100 text-green-600",
  rejected:      "bg-red-100 text-red-600",
};

export default function TaskStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wallet, setWallet } = useContext(WalletContext);
  const { markSeen } = useContext(CampaignContext);

  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [detail, setDetail]           = useState({});
  const [topUpId, setTopUpId]         = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [msg, setMsg]                 = useState({ text: "", success: true });
  const [tab, setTab]                 = useState("mine");

  const flash = (t, s = true) => {
    setMsg({ text: t, success: s });
    setTimeout(() => setMsg({ text: "", success: true }), 4000);
  };

  const refreshWallet = async () => {
    try {
      const res = await API.get("/wallet");
      setWallet(res.data);
    } catch {}
  };

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await API.get("/campaign/mine");
      setCampaigns(res.data.items || []);
    } catch {
      flash("❌ Failed to load your campaigns.", false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "mine") fetchMine();
  }, [tab]);

  useEffect(() => {
    const submitId = searchParams.get("submit");
    if (submitId) {
      setTab("mine");
      setExpanded(submitId);
    }
  }, [searchParams]);

  const openDetail = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!detail[id]) {
      try {
        const res = await API.get(`/campaign/${id}`);
        setDetail((p) => ({ ...p, [id]: res.data }));
      } catch {}
    }
  };

  const refreshDetail = async (id) => {
    try {
      const res = await API.get(`/campaign/${id}`);
      setDetail((p) => ({ ...p, [id]: res.data }));
    } catch {}
  };

  const handleTopUp = async (id) => {
    if (!topUpAmount || Number(topUpAmount) <= 0)
      return flash("❌ Enter a valid top-up amount.", false);
    try {
      await API.put(`/campaign/${id}/fund-activate`, { topUpAmount: Number(topUpAmount) });
      flash("✅ Campaign topped up & reactivated!");
      setTopUpId(null);
      setTopUpAmount("");
      fetchMine();
      refreshWallet();
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Failed."), false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await API.put(`/campaign/${id}/${action}`);
      flash(`✅ Campaign ${action}d.`);
      fetchMine();
      if (action === "stop") refreshWallet();
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Failed."), false);
    }
  };

  const handleSubReview = async (campaignId, subId, action, reason) => {
    try {
      await API.put(`/campaign/${campaignId}/submissions/${subId}/review`, {
        action,
        rejectionReason: reason,
      });
      flash(`✅ Submission ${action}d.`);
      await refreshDetail(campaignId);
      fetchMine();
      if (action === "approve") refreshWallet();
    } catch (e) {
      flash("❌ " + (e.response?.data?.message || "Failed."), false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-28">
      <TopBar />

      <div className="mx-3 mt-4 space-y-4">
        <h1 className="text-base font-extrabold text-gray-800">📋 Task Status</h1>

        {msg.text && (
          <div className={`p-3 rounded-xl text-sm font-semibold text-center ${
            msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[["mine", "My Campaigns"], ["browse", "Browse Tasks"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                tab === key
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Browse tab */}
        {tab === "browse" && (
          <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
            <i className="fas fa-briefcase text-4xl text-orange-300"></i>
            <p className="text-gray-500 text-sm font-semibold">Find active campaigns to complete and earn</p>
            <button
              onClick={() => navigate("/campaigns")}
              className="mt-1 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-2.5 rounded-xl text-sm transition"
            >
              Browse Campaigns
            </button>
          </div>
        )}

        {/* Mine tab */}
        {tab === "mine" && (
          loading ? (
            <p className="text-center text-orange-500 animate-pulse font-bold py-10 text-sm">Loading...</p>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center space-y-3">
              <i className="fas fa-folder-open text-gray-300 text-4xl"></i>
              <p className="text-gray-400 text-sm">No campaigns yet.</p>
              <button
                onClick={() => navigate("/post-task")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition"
              >
                Post Your First Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const d = detail[c._id];
                const allSubs = d?.campaign?.submissions || [];
                const pendingSubs  = allSubs.filter((s) => s.status === "pending");
                const reviewedSubs = allSubs.filter((s) => s.status !== "pending");

                return (
                  <div key={c._id} className="bg-white rounded-2xl shadow overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{c.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {c.category} · ${Number(c.payPerTask).toFixed(3)}/task · {c.approvedCount}/{c.maxEarners} done
                          </p>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-500"}`}>
                              {c.status.replace(/_/g, " ")}
                            </span>
                            {c.pendingCount > 0 && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                ⏳ {c.pendingCount} pending review
                              </span>
                            )}
                          </div>

                          {c.status === "pending_approval" && (
                            <p className="text-xs text-yellow-600 font-semibold mt-1.5 bg-yellow-50 rounded-lg px-2 py-1">
                              ⏳ Funds held · Awaiting admin review
                            </p>
                          )}
                          {c.status === "rejected" && (
                            <p className="text-xs text-red-500 font-semibold mt-1.5 bg-red-50 rounded-lg px-2 py-1">
                              ❌ {c.adminRejectionReason
                                ? `Rejected: ${c.adminRejectionReason}`
                                : "Campaign rejected"
                              } · Funds refunded to your wallet
                            </p>
                          )}
                          {c.status === "active" && (
                            <p className="text-xs text-green-600 font-semibold mt-1.5">
                              ✅ Live — users can now complete this task
                            </p>
                          )}
                        </div>

                        {!["pending_approval", "rejected", "stopped"].includes(c.status) && (
                          <button
                            onClick={() => openDetail(c._id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition shrink-0"
                          >
                            {expanded === c._id ? "Close" : "Manage"}
                          </button>
                        )}
                      </div>

                      {["active", "paused", "exhausted"].includes(c.status) && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Budget used</span>
                            <span>
                              ${Number(c.approvedCount * c.payPerTask).toFixed(3)} / $
                              {Number(c.payoutBudget + c.approvedCount * c.payPerTask).toFixed(3)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-orange-400 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (c.approvedCount / c.maxEarners) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded manage panel */}
                    {expanded === c._id && (
                      <div className="border-t border-gray-100 p-4 space-y-4">

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {c.status === "active" && (
                            <button
                              onClick={() => handleAction(c._id, "pause")}
                              className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                            >
                              ⏸ Pause
                            </button>
                          )}
                          {c.status === "paused" && (
                            <button
                              onClick={() => handleAction(c._id, "resume")}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                            >
                              ▶ Resume
                            </button>
                          )}
                          {["active", "paused"].includes(c.status) && (
                            <button
                              onClick={() => handleAction(c._id, "stop")}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                            >
                              🛑 Stop & Refund
                            </button>
                          )}
                          {c.status === "exhausted" && (
                            <button
                              onClick={() => setTopUpId(topUpId === c._id ? null : c._id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                            >
                              🔄 Top Up Budget
                            </button>
                          )}
                        </div>

                        {/* Top-up form */}
                        {topUpId === c._id && (
                          <div className="bg-orange-50 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-bold text-orange-600">Add more budget</p>
                            <p className="text-[11px] text-orange-500">Amount will be deducted from your wallet immediately.</p>
                            <input
                              type="number"
                              value={topUpAmount}
                              onChange={(e) => setTopUpAmount(e.target.value)}
                              placeholder="Total amount to add (inc. fee)"
                              step="0.01"
                              min="0"
                              className="w-full border-2 border-orange-200 focus:border-orange-400 rounded-xl px-3 py-2 text-sm outline-none"
                            />
                            <div className="flex justify-between text-[11px] text-gray-400">
                              <span>Your balance</span>
                              <span className="font-bold">${Number(wallet?.balance || 0).toFixed(4)}</span>
                            </div>
                            <button
                              onClick={() => handleTopUp(c._id)}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-xs transition"
                            >
                              Confirm Top Up
                            </button>
                          </div>
                        )}

                        {/* Stats summary */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {[
                            ["Approved", c.approvedCount, "text-green-600"],
                            ["Pending",  c.pendingCount,  "text-yellow-600"],
                            ["Rejected", c.rejectedCount, "text-red-500"],
                          ].map(([k, v, color]) => (
                            <div key={k} className="bg-gray-50 rounded-xl p-2 text-center">
                              <p className="text-gray-400">{k}</p>
                              <p className={`font-extrabold text-lg ${color}`}>{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Pending submissions */}
                        {pendingSubs.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-700 mb-2">
                              ⏳ Pending Reviews ({pendingSubs.length})
                            </p>
                            <div className="space-y-3">
                              {pendingSubs.map((s) => (
                                <SubmissionCard
                                  key={s._id}
                                  sub={s}
                                  onApprove={() => handleSubReview(c._id, s._id, "approve")}
                                  onReject={(reason) => handleSubReview(c._id, s._id, "reject", reason)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reviewed submissions */}
                        {reviewedSubs.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 mb-2">
                              Reviewed ({reviewedSubs.length})
                            </p>
                            <div className="space-y-2">
                              {reviewedSubs.map((s) => (
                                <div key={s._id} className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-700">
                                      {s.user?.fullName || "User"}
                                    </p>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${SUB_COLORS[s.status] || "bg-gray-100 text-gray-500"}`}>
                                      {s.status === "auto_approved" ? "auto approved" : s.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-400">
                                    {new Date(s.submittedAt).toLocaleString()}
                                  </p>
                                  {s.proofText && (
                                    <p className="text-xs text-gray-500 bg-white rounded-lg px-2 py-1.5">
                                      {s.proofText}
                                    </p>
                                  )}
                                  {s.proofUrl && (
                                    <a
                                      href={s.proofUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 underline break-all block"
                                    >
                                      {s.proofUrl}
                                    </a>
                                  )}
                                  {s.proofImageUrls?.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                      {s.proofImageUrls.map((url, i) => (
                                        <img
                                          key={i}
                                          src={url}
                                          alt=""
                                          onClick={() => window.open(url, "_blank")}
                                          className="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                      ))}
                                    </div>
                                  )}
                                  {s.status === "rejected" && s.rejectionReason && (
                                    <p className="text-[11px] text-red-500 bg-red-50 rounded-lg px-2 py-1.5">
                                      <span className="font-bold">Reason:</span> {s.rejectionReason}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {allSubs.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">No submissions yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function SubmissionCard({ sub, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason]       = useState("");
  const [loading, setLoading]     = useState(null); // "approve" | "reject" | null

  const handleApprove = async () => {
    setLoading("approve");
    await onApprove();
    setLoading(null);
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setLoading("reject");
    await onReject(reason);
    setLoading(null);
    setRejecting(false);
    setReason("");
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2 border-2 border-yellow-100">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">{sub.user?.fullName || "User"}</p>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
          pending
        </span>
      </div>
      <p className="text-[10px] text-gray-400">{new Date(sub.submittedAt).toLocaleString()}</p>

      {sub.proofText && (
        <p className="text-xs bg-white rounded-lg p-2 text-gray-600">{sub.proofText}</p>
      )}
      {sub.proofUrl && (
        <a
          href={sub.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 underline break-all block"
        >
          {sub.proofUrl}
        </a>
      )}
      {sub.proofImageUrls?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {sub.proofImageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              onClick={() => window.open(url, "_blank")}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer"
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-1.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
        >
          {loading === "approve"
            ? <i className="fas fa-spinner fa-spin"></i>
            : "✅ Approve"}
        </button>
        <button
          onClick={() => setRejecting(!rejecting)}
          disabled={!!loading}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-1.5 rounded-xl text-xs transition"
        >
          ❌ Reject
        </button>
      </div>

      {rejecting && (
        <div className="space-y-1.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full border-2 border-red-200 focus:border-red-400 rounded-xl px-3 py-1.5 text-xs outline-none"
          />
          <button
            onClick={handleReject}
            disabled={!reason.trim() || !!loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-1.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
          >
            {loading === "reject"
              ? <i className="fas fa-spinner fa-spin"></i>
              : "Confirm Rejection"}
          </button>
        </div>
      )}
    </div>
  );
        }
