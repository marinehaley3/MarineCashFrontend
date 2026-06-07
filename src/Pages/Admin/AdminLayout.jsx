import React, { useContext, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import logo from "../../Assets/logo.png";

const ALL_SECTIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "fa-chart-line",
    to: "/admin",
  },
  {
    key: "users",
    label: "Users",
    icon: "fa-users",
    to: "/admin/users",
  },
  {
    key: "settings",
    label: "Settings",
    icon: "fa-sliders",
    to: "/admin/settings",
  },
  {
    key: "campaigns",
    label: "Campaigns",
    icon: "fa-clipboard-list",
    to: "/admin/AdminCampaigns",
  },
  {
    key: "badges",
    label: "Badges",
    icon: "fa-medal",
    to: "/admin/badges",
  },
  {
    key: "announcements",
    label: "Announcements",
    icon: "fa-bullhorn",
    to: "/admin/announcements",
  },
  {
    key: "polls",
    label: "Polls",
    icon: "fa-poll",
    to: "/admin/polls",
  },
  {
    key: "rewards",
    label: "Reward Codes",
    icon: "fa-gift",
    to: "/admin/rewards",
  },
  {
    key: "withdrawals",
    label: "Withdrawals",
    icon: "fa-money-bill",
    to: "/admin/withdrawals",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: "fa-shield-halved",
    to: "/admin/permissions",
    superadminOnly: true,
  },
];

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === "superadmin";
  const hidden = user?.hiddenSections || [];

  const visibleSections = ALL_SECTIONS.filter((section) => {
    if (section.superadminOnly && !isSuperAdmin) return false;
    if (!isSuperAdmin && hidden.includes(section.key)) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? "bg-orange-500 text-white shadow"
        : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"
    }`;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="bg-orange-400 flex items-center gap-3 px-4 py-4">
          <img
            src={logo}
            alt="logo"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div>
            <p className="text-white font-extrabold text-sm leading-tight">
              MarineCash
            </p>
            <p className="text-orange-100 text-xs capitalize">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleSections.map((section) => (
            <NavLink
              key={section.key}
              to={section.to}
              end={section.to === "/admin"}
              className={linkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fas ${section.icon} w-4 text-center`} />
              <span>{section.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-semibold truncate mb-2">
            {user?.fullName}
          </p>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2 text-sm flex items-center justify-center gap-2 transition"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-orange-400 h-14 flex items-center justify-between px-4 shadow-md shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-white text-xl"
          >
            <i className="fas fa-bars"></i>
          </button>

          <h1 className="text-white font-bold text-base">
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <span className="bg-white text-orange-500 text-xs font-bold px-2 py-1 rounded-full">
                Super Admin
              </span>
            )}

            <NavLink
              to="/home"
              className="text-white text-xs font-semibold hover:underline"
            >
              ← User Side
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
