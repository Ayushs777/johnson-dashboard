import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  Shield,
  User as UserIcon,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashboardService } from "../services/dashboardService";

const Header = ({ toggleSidebar }) => {
  const { user, role, isCodeUser, isECodeUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isCodeUser) return;

    const fetchNotifs = async () => {
      try {
        const res = await dashboardService.getNotifications();
        if (res.success) {
          setNotifications(res.data || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [isCodeUser]);

  const handleMarkRead = async (id) => {
    try {
      await dashboardService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case "Admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Manager":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Employee":
        return "bg-sky-100 text-sky-800 border-sky-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile menu toggle + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-display leading-tight">
              Johnson Lifts & Escalators
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Operations & Data Management Portal
            </p>
          </div>
        </div>

        {/* Right Header items */}
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          {!isCodeUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition border border-slate-200/80 focus:outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Menu */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      System Alerts & Activity
                    </span>
                    <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No recent notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3.5 flex items-start gap-3 transition ${
                            !n.isRead
                              ? "bg-sky-50/40 font-medium"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              n.type === "error"
                                ? "bg-rose-500"
                                : n.type === "warning"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkRead(n._id)}
                              title="Mark as read"
                              className="text-slate-400 hover:text-sky-600 p-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logged in User Tag */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">
                {user?.name || "Ayush Chaudhary"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border self-end mt-0.5 ${getRoleBadgeColor(
                  role,
                )}`}
              >
                {isECodeUser
                  ? user?.permissionGroup?.replace("_", " / ") || "ECode"
                  : role || "Employee"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
