import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";

const CATEGORY_LABELS = {
  survey:      { label: "Surveys",      icon: "fa-clipboard-list", color: "text-green-500" },
  video:       { label: "Watch Video",  icon: "fa-play-circle",    color: "text-green-500"   },
  follow:      { label: "Social Media", icon: "fa-users",          color: "text-green-500"   },
  signup:      { label: "Sign Ups",     icon: "fa-user-plus",      color: "text-green-500"  },
  offer:       { label: "Offers",       icon: "fa-tag",            color: "text-green-500" },
  app_install: { label: "Install Apps", icon: "fa-download",       color: "text-green-500" },
  game:        { label: "Games",        icon: "fa-gamepad",        color: "text-green-500"  },
  other:       { label: "Other Tasks",  icon: "fa-tasks",          color: "text-green-600" },
};

export default function Campaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryParam = searchParams.get("category") || "";

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [selected, setSelected]   = useState(null); // campaign detail modal

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (categoryParam) params.category = categoryParam;
      if (search.trim()) params.search = search.trim();
      const res = await API.get("/campaign", { params });
      setCampaigns(res.data.items || []);
      setPages(res.data.pages || 1);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [categoryParam, search]);
  useEffect(() => { fetchCampaigns(); }, [categoryParam, search, page]);

  const catInfo = CATEGORY_LABELS[categoryParam] || { label: "All Tasks", icon: "fa-briefcase", color: "text-orange-500" };

  return (
    <div className="bg-gray-100 min-h-screen pb-28">
      <TopBar />

      <div className="mx-3 mt-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
          <div className="bg-orange-100 rounded-xl w-11 h-11 flex items-center justify-center">
            <i className={`fas ${catInfo.icon} ${catInfo.color} text-xl`}></i>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-800">{catInfo.label}</h1>
            <p className="text-xs text-gray-400">Complete tasks and get paid instantly on approval</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[{ value: "", label: "All" }, ...Object.entries(CATEGORY_LABELS).map(([v, c]) => ({ value: v, label: c.label }))].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSearchParams(cat.value ? { category: cat.value } : {})}
              className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-xl border-2 transition shrink-0 ${
                categoryParam === cat.value
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-400 bg-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full bg-white border-2 border-gray-200 focus:border-orange-400 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none shadow"
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-orange-500 animate-pulse font-bold py-10 text-sm">Loading...</p>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-14">
            <i className="fas fa-inbox text-4xl text-gray-300"></i>
            <p className="text-gray-400 text-sm mt-3">No active campaigns in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const cat = CATEGORY_LABELS[c.category] || { icon: "fa-tasks", color: "text-gray-400" };
              return (
                <div
                  key={c._id}
                  onClick={() => setSelected(selected?._id === c._id ? null : c)}
                  className="bg-white rounded-2xl shadow p-4 cursor-pointer active:scale-[0.99] transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-50 rounded-xl w-11 h-11 flex items-center justify-center shrink-0">
                      <i className={`fas ${cat.icon} ${cat.color} text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          💰 ${Number(c.payPerTask).toFixed(3)}/task
                        </span>
                        <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {c.maxEarners - (c.completedCount || 0)} spots left
                        </span>
                        {c.poster?.fullName && (
                          <span className="text-xs text-gray-400">by {c.poster.fullName}</span>
                        )}
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${selected?._id === c._id ? "up" : "down"} text-gray-400 text-xs mt-1 shrink-0`}></i>
                  </div>

                  {/* Expanded detail */}
                  {selected?._id === c._id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {c.targetUrl && (
                        <a href={c.targetUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-500 font-semibold bg-blue-50 rounded-xl px-3 py-2">
                          <i className="fas fa-link"></i> {c.targetUrl}
                        </a>
                      )}
                      {c.instructions && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-600 mb-1">📋 Instructions</p>
                          <p className="text-xs text-gray-500">{c.instructions}</p>
                        </div>
                      )}
                      {c.exampleImageUrls?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-600 mb-2">🖼 Examples</p>
                          <div className="flex gap-2 flex-wrap">
                            {c.exampleImageUrls.map((url, i) => (
                              <img key={i} src={url} alt={`ex-${i}`}
                                className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/submit-proof/${c._id}`)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition"
                      >
                        Start Task & Submit Proof
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-3 pb-4">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-500 disabled:opacity-40">
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm font-bold text-gray-600">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-sm font-bold text-gray-500 disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
