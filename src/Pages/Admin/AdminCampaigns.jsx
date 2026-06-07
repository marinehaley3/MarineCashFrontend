import React, { useEffect, useState } from "react";
import API from "../../api/axios";

const STATUS_COLORS = {
  pending_approval: "bg-yellow-100 text-yellow-700",
  draft:            "bg-blue-100 text-blue-700",
  active:           "bg-green-100 text-green-700",
  paused:           "bg-gray-100 text-gray-600",
  exhausted:        "bg-orange-100 text-orange-700",
  stopped:          "bg-red-100 text-red-500",
  rejected:         "bg-red-100 text-red-700",
  completed:        "bg-purple-100 text-purple-700",
};

const CATEGORY_ICONS = {
  survey: "fa-clipboard-list", video: "fa-play-circle", follow: "fa-users",
  signup: "fa-user-plus", offer: "fa-tag", app_install: "fa-download",
  game: "fa-gamepad", other: "fa-tasks",
};

const AdminCampaigns = () => {
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [detail, setDetail]           = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason]   = useState("");
  const [subRejectReason, setSubRejectReason] = useState("");
  const [rejectingSubId, setRejectingSubId]   = useState(null);
  const [msg, setMsg]                 = useState({ text: "", success: true });
  const [filters, setFilters]         = useState({ status: "pending_approval", search: "" });

  const flash = (t, s = true) => {
    setMsg({ text: t, success: s });
    setTimeout(() => setMsg({ text: "", success: true }), 4000);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = { status: filters.status };
      if (filters.search) params.search = filters.search;
      const res = await API.get("/campaign/admin/all", { params });
      setCampaigns(res.data.items || []);
    } catch (e) {
      flash("❌ Failed to load campaigns.", false);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [filters]);

  const openDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await API.get(`/campaign/admin/${id}`);
      setDetail(res.data);
    } catch { flash("❌ Failed to load campaign detail.", false); }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); setRejectReason(""); };

  const handleApprove = async (id) => {
    try {
      await API.put(`/campaign/admin/${id}/approve`);
      flash("✅ Campaign approved. Owner can now fund it.");
      closeDetail();
      fetchCampaigns();
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return flash("❌ Enter a rejection reason.", false);
    try {
      await API.put(`/campaign/admin/${id}/reject`, { reason: rejectReason });
      flash("✅ Campaign rejected.");
      closeDetail();
      fetchCampaigns();
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
  };

  const handleSubReview = async (campaignId, subId, action) => {
    if (action === "reject" && !subRejectReason.trim())
      return flash("❌ Enter a rejection reason for the submission.", false);
    try {
      await API.put(`/campaign/admin/${campaignId}/submissions/${subId}/review`, {
        action,
        rejectionReason: action === "reject" ? subRejectReason : undefined,
      });
      flash(`✅ Submission ${action}d.`);
      setSubRejectReason("");
      setRejectingSubId(null);
      openDetail(campaignId);
    } catch (e) { flash("❌ " + (e.response?.data?.message || "Failed."), false); }
  };

  const statuses = ["pending_approval", "draft", "active", "paused", "exhausted", "stopped", "rejected"];

  return (
    <div className="space-y-4 max-w-4xl">
      <h2 className="text-lg font-extrabold text-gray-800">📋 Campaigns</h2>

      {msg.text && (
        <div className={`p-3 rounded-xl text-sm font-semibold text-center ${msg.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow p-4 flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap flex-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilters((p) => ({ ...p, status: s }))}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition ${
                filters.status === s ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-400"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <input
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          placeholder="Search title..."
          className="border-2 border-gray-200 focus:border-orange-400 rounded-xl px-3 py-1.5 text-sm outline-none"
        />
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <p className="text-center text-orange-500 animate-pulse font-bold py-10 text-sm">Loading...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No campaigns found.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map((c) => (
              <div key={c._id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-orange-100 rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                      <i className={`fas ${CATEGORY_ICONS[c.category] || "fa-tasks"} text-orange-500`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        by <span className="font-semibold">{c.poster?.fullName}</span>
                        {" · "}{c.category}{" · "}${Number(c.payPerTask).toFixed(3)}/task
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-500"}`}>
                          {c.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.approvedCount}/{c.maxEarners} done · ${Number(c.payoutBudget).toFixed(2)} budget
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => selected === c._id ? closeDetail() : openDetail(c._id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition shrink-0"
                  >
                    {selected === c._id ? "Close" : "View"}
                  </button>
                </div>

                {/* Detail panel */}
                {selected === c._id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    {detailLoading ? (
                      <p className="text-xs text-orange-500 animate-pulse font-bold">Loading detail...</p>
                    ) : detail ? (
                      <div className="space-y-4">
                        {/* Campaign info */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                          <p className="font-bold text-gray-700">Campaign Info</p>
                          <p className="text-gray-600">{detail.description}</p>
                          {detail.instructions && (
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs font-bold text-gray-500 mb-1">Instructions</p>
                              <p className="text-gray-600 text-xs">{detail.instructions}</p>
                            </div>
                          )}
                          {detail.targetUrl && (
                            <a href={detail.targetUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-500 underline break-all">
                              {detail.targetUrl}
                            </a>
                          )}
                          {detail.exampleImageUrls?.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {detail.exampleImageUrls.map((url, i) => (
                                <img key={i} src={url} alt={`example-${i}`}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                              ))}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            {[
                              ["Pay/Task", `$${Number(detail.payPerTask).toFixed(3)}`],
                              ["Max Earners", detail.maxEarners],
                              ["Payout Budget", `$${Number(detail.payoutBudget).toFixed(2)}`],
                              ["Platform Fee", `$${Number(detail.feeAmount).toFixed(2)} (${detail.platformFeePctAtCreate}%)`],
                              ["Escrow Required", `$${Number(detail.escrowRequired).toFixed(2)}`],
                              ["Posted", new Date(detail.createdAt).toLocaleDateString()],
                            ].map(([k, v]) => (
                              <div key={k} className="bg-white rounded-lg p-2">
                                <p className="text-gray-400">{k}</p>
                                <p className="font-bold text-gray-700">{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Admin actions for pending_approval */}
                        {detail.status === "pending_approval" && (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(detail._id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl text-sm transition"
                              >
                                ✅ Approve Campaign
                              </button>
                            </div>
                            <div className="space-y-2">
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Rejection reason (required to reject)..."
                                rows={2}
                                className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-3 py-2 text-sm outline-none resize-none"
                              />
                              <button
                                onClick={() => handleReject(detail._id)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition"
                              >
                                ❌ Reject Campaign
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Submissions */}
                        {detail.submissions?.length > 0 && (
                          <div>
                            <p className="font-bold text-gray-700 text-sm mb-2">
                              Submissions ({detail.submissions.length})
                            </p>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {detail.submissions.map((s) => (
                                <div key={s._id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-bold text-gray-700">
                                        {s.user?.fullName || "Unknown"}
                                      </p>
                                      <p className="text-[11px] text-gray-400">{s.user?.email}</p>
                                      <p className="text-[11px] text-gray-400">
                                        {new Date(s.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-500"}`}>
                                      {s.status.replace("_", " ")}
                                    </span>
                                  </div>
                                  {s.proofText && (
                                    <p className="text-xs bg-white rounded-lg p-2 text-gray-600">{s.proofText}</p>
                                  )}
                                  {s.proofUrl && (
                                    <a href={s.proofUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-blue-500 underline break-all">
                                      {s.proofUrl}
                                    </a>
                                  )}
                                  {s.proofImageUrls?.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                      {s.proofImageUrls.map((url, i) => (
                                        <img key={i} src={url} alt={`proof-${i}`}
                                          className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                      ))}
                                    </div>
                                  )}
                                  {s.rejectionReason && (
                                    <p className="text-xs text-red-500 font-semibold bg-red-50 rounded-lg px-2 py-1">
                                      Rejected: {s.rejectionReason}
                                    </p>
                                  )}
                                  {s.status === "pending" && (
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSubReview(detail._id, s._id, "approve")}
                                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 rounded-xl text-xs transition"
                                        >
                                          ✅ Approve
                                        </button>
                                        <button
                                          onClick={() => setRejectingSubId(rejectingSubId === s._id ? null : s._id)}
                                          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 rounded-xl text-xs transition"
                                        >
                                          ❌ Reject
                                        </button>
                                      </div>
                                      {rejectingSubId === s._id && (
                                        <div className="space-y-1">
                                          <input
                                            value={subRejectReason}
                                            onChange={(e) => setSubRejectReason(e.target.value)}
                                            placeholder="Reason for rejection..."
                                            className="w-full border-2 border-red-200 focus:border-red-400 rounded-xl px-3 py-1.5 text-xs outline-none"
                                          />
                                          <button
                                            onClick={() => handleSubReview(detail._id, s._id, "reject")}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-xl text-xs transition"
                                          >
                                            Confirm Rejection
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaigns;
