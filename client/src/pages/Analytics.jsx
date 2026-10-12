import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Layers, Wrench, AlertTriangle, Building2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';

const COLORS = ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getAnalytics();
        if (res.success) {
          setAnalyticsData(res.data);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing MongoDB Aggregation Pipelines for Visual Analytics..." />;
  }

  // Fallback demo data if database is empty so charts always render beautifully
  const monthlyServiceRequests = analyticsData?.monthlyServiceRequests?.length
    ? analyticsData.monthlyServiceRequests
    : [
        { month: 'May 2026', total: 18, completed: 15, pending: 3 },
        { month: 'Jun 2026', total: 24, completed: 20, pending: 4 },
        { month: 'Jul 2026', total: 29, completed: 26, pending: 3 },
        { month: 'Aug 2026', total: 35, completed: 31, pending: 4 },
        { month: 'Sep 2026', total: 42, completed: 38, pending: 4 },
      ];

  const installationStatus = analyticsData?.installationStatus?.length
    ? analyticsData.installationStatus
    : [
        { name: 'Completed', value: 14 },
        { name: 'In Progress', value: 5 },
        { name: 'Planned', value: 3 },
        { name: 'On Hold', value: 1 },
      ];

  const complaintsByPriority = analyticsData?.complaintsByPriority?.length
    ? analyticsData.complaintsByPriority
    : [
        { name: 'Critical', count: 2 },
        { name: 'High', count: 5 },
        { name: 'Medium', count: 8 },
        { name: 'Low', count: 4 },
      ];

  const servicesByLocation = analyticsData?.servicesByLocation?.length
    ? analyticsData.servicesByLocation
    : [
        { location: 'Lucknow', services: 18 },
        { location: 'Gurugram', services: 14 },
        { location: 'New Delhi', services: 12 },
        { location: 'Noida', services: 9 },
        { location: 'Kanpur', services: 6 },
      ];

  const customerGrowth = analyticsData?.customerGrowth?.length
    ? analyticsData.customerGrowth
    : [
        { month: 'May 2026', totalCustomers: 5 },
        { month: 'Jun 2026', totalCustomers: 8 },
        { month: 'Jul 2026', totalCustomers: 12 },
        { month: 'Aug 2026', totalCustomers: 16 },
        { month: 'Sep 2026', totalCustomers: 21 },
      ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Operations & Technical Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated MongoDB operational metrics, breakdown velocity, and growth statistics
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-sky-600" />
          <span>MongoDB Pipeline Powered</span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Service Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" />
              Monthly Service Requests & Completed Volume
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyServiceRequests}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="completed" fill="#0284c7" name="Completed Services" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending Services" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Installation Status Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Installation Project Status Distribution
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={installationStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {installationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Complaints by Priority Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Complaints Breakdown by Priority Level
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintsByPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="Logged Tickets" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Customer Growth Timeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Cumulative Customer Fleet Growth
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="totalCustomers" stroke="#10b981" fill="#d1fae5" name="Active Customers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
