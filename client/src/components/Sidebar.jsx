import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  BarChart3,
  User,
  Settings,
  LogOut,
  ClipboardList,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CODE_MODULES } from "../config/codeModules";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const {
    user,
    role,
    logout,
    isECodeUser,
    isCodeUser,
    hasPermission,
    permissionGroup,
  } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ── Standard nav for KCode / Admin / Manager / Employee / Viewer ─────────
  const navItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Manager", "Employee", "Viewer"],
    },
    {
      title: "Work Orders",
      path: "/work-orders",
      icon: ClipboardList,
      roles: ["Admin", "Manager", "Employee"],
    },
    {
      title: "Users",
      path: "/users",
      icon: Users,
      roles: ["Admin"],
      badge: "Admin Only",
    },

    {
      title: "Reports",
      path: "/reports",
      icon: FileSpreadsheet,
      roles: ["Admin", "Manager", "Viewer"],
    },
    {
      title: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      roles: ["Admin", "Manager", "Viewer"],
    },
    {
      title: "Profile",
      path: "/profile",
      icon: User,
      roles: ["Admin", "Manager", "Employee", "Viewer"],
    },
    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["Admin", "Manager"],
    },
  ];

  const activeItems = isCodeUser
    ? CODE_MODULES.filter((item) => hasPermission(item.permission))
    : navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 flex flex-col justify-between ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Sidebar Header / Brand Logo */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 font-black text-xl tracking-tighter">
            JL
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-wide text-base font-display">
              JOHNSON
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-sky-400">
              LIFTS & ESCALATORS
            </p>
          </div>
        </div>

        {/* ECode badge */}
        {isECodeUser && (
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide flex items-center gap-1.5">
            <CalendarCheck className="w-3 h-3" />
            <span>
              {permissionGroup?.replace("_", " / ") || "Access not configured"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-1">
        <p className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
          {isCodeUser ? "My Menu" : "Main Menu"}
        </p>
        {activeItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition group ${
                  isActive
                    ? isECodeUser
                      ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30"
                      : "bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30"
                    : "hover:bg-slate-800/80 hover:text-white text-slate-400"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition duration-200 group-hover:scale-110" />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 mb-2 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                isECodeUser
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-sky-500/20 text-sky-400 border-sky-500/30"
              }`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || "User"}
              </p>
              <span
                className={`inline-flex items-center text-[10px] font-medium ${isECodeUser ? "text-emerald-400" : "text-sky-400"}`}
              >
                {isCodeUser ? (
                  <>
                    {isECodeUser ? (
                      <CalendarCheck className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 mr-0.5" />
                    )}
                    {user?.ecode || user?.kcode || "Code User"}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                    {role}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
