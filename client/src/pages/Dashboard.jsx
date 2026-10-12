import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Building2,
  Layers,
  Activity,
  Wrench,
  AlertTriangle,
  Users,
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { dashboardService } from "../services/dashboardService";
import { complaintService } from "../services/complaintService";
import { workOrderService } from "../services/workOrderService";
import { useAuth } from "../context/AuthContext";
import { CODE_MODULES } from "../config/codeModules";

const Dashboard = () => {
  const { user, isCodeUser, hasPermission, permissionGroup } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isCodeUser) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, complaintsRes, workOrdersRes] =
          await Promise.allSettled([
            dashboardService.getStats(),
            complaintService.getComplaints({ page: 1, limit: 5 }),
            workOrderService.getWorkOrders(),
          ]);

        if (statsRes.status === "fulfilled" && statsRes.value?.success) {
          setStats(statsRes.value.data);
          if (statsRes.value.data?.totalWorkOrders) {
            setTotalJobs(statsRes.value.data.totalWorkOrders);
          }
        }

        if (
          workOrdersRes.status === "fulfilled" &&
          workOrdersRes.value?.success
        ) {
          setTotalJobs(workOrdersRes.value.workOrders?.length || 0);
        }

        if (
          complaintsRes.status === "fulfilled" &&
          complaintsRes.value?.success
        ) {
          setRecentComplaints(complaintsRes.value.data || []);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isCodeUser]);

  if (isCodeUser) {
    const availableModules = CODE_MODULES.filter(
      (module) =>
        module.permission !== "dashboard" && hasPermission(module.permission),
    );

    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            {permissionGroup?.replace("_", " / ") || "Employee Dashboard"}
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            Welcome, {user?.name || "Employee"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Your employee portal is ready. Choose an assigned module to
            continue.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {availableModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.permission}
                onClick={() => navigate(module.path)}
                className="flex min-h-24 items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
              >
                <span className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-900">
                  {module.title}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingSpinner text="Connecting to Portal & Loading Dashboard..." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" />
              Johnson Operations Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
              Welcome back, {user?.name || "User"}
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-xl">
              Real-time monitoring of Johnson Lifts & Escalators work orders,
              project status, and field operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/work-orders")}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Work Orders ({totalJobs})</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Jobs"
          value={totalJobs || stats?.totalWorkOrders || 0}
          icon={ClipboardList}
          color="sky"
          trend="up"
          trendText="Work Orders Active"
          onClick={() => navigate("/work-orders")}
        />

        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Building2}
          color="sky"
          trend="up"
          trendText="+12% this month"
          onClick={() => navigate("/customers")}
        />

        <StatCard
          title="Total Installations"
          value={stats?.totalInstallations || 0}
          icon={Layers}
          color="indigo"
          trend="up"
          trendText="Elevators & Escalators"
          onClick={() => navigate("/installations")}
        />

        <StatCard
          title="Active Lifts"
          value={stats?.activeLifts || 0}
          icon={Activity}
          color="emerald"
          trendText="Operational status"
          onClick={() => navigate("/customers")}
        />

        <StatCard
          title="Pending Services"
          value={stats?.pendingServices || 0}
          icon={Wrench}
          color="amber"
          trendText="Inspection due"
          onClick={() => navigate("/services")}
        />

        <StatCard
          title="Open Complaints"
          value={stats?.openComplaints || 0}
          icon={AlertTriangle}
          color="rose"
          trend={stats?.criticalComplaints > 0 ? "down" : "up"}
          trendText={`${stats?.criticalComplaints || 0} Critical`}
          onClick={() => navigate("/complaints")}
        />
      </div>

      {/* Quick Access Section (Requirement 21) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Quick Access Modules
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Direct navigation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate("/work-orders")}
            className="flex flex-col items-center justify-center p-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl transition group text-center shadow-sm"
          >
            <div className="p-3 bg-sky-600 text-white rounded-xl group-hover:scale-110 transition shadow-md shadow-sky-600/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-sky-900 mt-2.5">
              Work Orders
            </span>
          </button>

          <button
            onClick={() => navigate("/customers")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-sky-100 text-sky-700 rounded-xl group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Customer Data
            </span>
          </button>

          <button
            onClick={() => navigate("/installations")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Installation Data
            </span>
          </button>

          <button
            onClick={() => navigate("/services")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Service Data
            </span>
          </button>

          <button
            onClick={() => navigate("/complaints")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Complaint Data
            </span>
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Reports
            </span>
          </button>

          <button
            onClick={() => navigate("/analytics")}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-300 rounded-2xl transition group text-center"
          >
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-110 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2.5">
              Analytics
            </span>
          </button>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Recent Field Complaints & SLA Dispatch
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live complaints requiring technician attention
            </p>
          </div>

          <button
            onClick={() => navigate("/complaints")}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentComplaints.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active breakdown tickets found
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Customer / Location</th>
                  <th className="px-4 py-3">Issue Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentComplaints.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {item.complaintId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {item.customer?.customerName || "N/A"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.complaintType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          item.priority === "Critical"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : item.priority === "High"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          item.status === "Resolved" || item.status === "Closed"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "In Progress"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item.assignedTechnician}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
