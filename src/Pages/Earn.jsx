// src/Pages/Earn.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import TopBar from "../Components/TopBar";
import BottomNav from "../Components/BottomNav";
import { CampaignContext } from "../Context/CampaignContext";

const earnItems = [
  { icon: "fa-clipboard-list", color: "text-green-500", label: "Surveys",      desc: "Complete surveys to earn",          to: "/campaigns?category=survey",  hasBadge: true  },
  { icon: "fa-users",          color: "text-green-500", label: "Social Media",  desc: "Follow, like and share to earn",    to: "/campaigns?category=follow",  hasBadge: true  },
  { icon: "fa-tasks",          color: "text-green-600", label: "Other Tasks",   desc: "Browse all other tasks",            to: "/campaigns?category=other",   hasBadge: true  },
  { icon: "fa-camera",         color: "text-green-400", label: "Watch & Earn",  desc: "Earn by watching videos",           to: "/offerwalls",                 hasBadge: false },
  { icon: "fa-google fab",     color: "text-green-500", label: "Sign Ups",      desc: "Earn from app & site registration", to: "/offerwalls",                 hasBadge: false },
  { icon: "fa-arrow-down",     color: "text-green-500", label: "Install Apps",  desc: "Earn by installing apps",           to: "/offerwalls",                 hasBadge: false },
  { icon: "fa-gamepad",        color: "text-green-500", label: "Play Games",    desc: "Earn by gaming",                    to: "/offerwalls",                 hasBadge: false },
  { icon: "fa-tasks",          color: "text-green-600", label: "Task Status",   desc: "Check your submissions",            to: "/task-status",                hasBadge: false },
  { icon: "fa-gift",           color: "text-green-500", label: "Redeem Code",   desc: "Redeem your code here",             to: "/reward",                     hasBadge: false },
];

export default function Earn() {
  const { badge } = useContext(CampaignContext);

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      <TopBar />

      <section className="bg-white mx-2 mt-4 p-4 rounded-xl shadow border-l-4 border-orange-400">
        <h2 className="text-base font-bold text-orange-500 mb-2">
          <i className="fas fa-info-circle mr-2"></i>Important Guidelines
        </h2>
        <ul className="space-y-1 list-disc pl-5 text-sm text-gray-600">
          <li>Proofs reviewed within <span className="font-semibold text-green-600">48 hours</span></li>
          <li>One account per person. Multiple accounts will be <span className="text-red-500">banned</span></li>
          <li>Approval rate below <span className="text-red-500">30%</span> may result in suspension</li>
          <li>Fake or unclear proofs will lead to <span className="text-red-500">rejection</span></li>
        </ul>
      </section>

      <main className="grid grid-cols-3 gap-4 px-4 py-4 m-2">
        {earnItems.map((item) => (
          <Link
            key={item.label + item.to}
            to={item.to}
            className="relative bg-white shadow rounded-xl p-3 flex flex-col items-center text-center hover:scale-105 transition-all"
          >
            {item.hasBadge && badge > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-md z-10">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
            <i className={`fas ${item.icon} ${item.color} text-4xl`}></i>
            <p className="text-xs font-semibold mt-2 text-gray-700">{item.label}</p>
            <span className="text-[10px] text-gray-400 mt-1">{item.desc}</span>
          </Link>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
