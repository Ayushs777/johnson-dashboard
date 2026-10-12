import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Printer, Filter, RefreshCw } from 'lucide-react';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';
import { customerService } from '../services/customerService';
import { installationService } from '../services/installationService';
import { serviceService } from '../services/serviceService';
import { complaintService } from '../services/complaintService';

const Reports = () => {
  const [reportType, setReportType] = useState('Service Report');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  const [location, setLocation] = useState('All');
  const [status, setStatus] = useState('All');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      let res;
      if (reportType === 'Customer Report') {
        res = await customerService.getCustomers({ limit: 100 });
      } else if (reportType === 'Installation Report') {
        res = await installationService.getInstallations({ limit: 100, status });
      } else if (reportType === 'Service Report') {
        res = await serviceService.getServices({ limit: 100, status });
      } else if (reportType === 'Complaint Report') {
        res = await complaintService.getComplaints({ limit: 100, status });
      } else {
        res = await serviceService.getServices({ limit: 100 });
      }

      if (res && res.success) {
        setData(res.data || []);
        setToast({ message: `${reportType} generated (${(res.data || []).length} records)`, type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error generating report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateReport();
  }, [reportType]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter((k) => k !== '_id' && k !== '__v');
    const csvRows = [keys.join(',')];
    data.forEach((row) => {
      const values = keys.map((k) => {
        const val = typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k];
        return `"${val || ''}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `johnson_${reportType.toLowerCase().replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    if (reportType === 'Customer Report') {
      return [
        { title: 'Customer ID', key: 'customerId', render: (v) => <span className="font-bold">{v}</span> },
        { title: 'Customer Name', key: 'customerName', render: (v) => <span className="font-bold text-slate-900">{v}</span> },
        { title: 'City', key: 'city' },
        { title: 'Lifts', key: 'numberOfLifts' },
        { title: 'AMC Status', key: 'amcStatus' },
      ];
    }
    if (reportType === 'Installation Report') {
      return [
        { title: 'Installation ID', key: 'installationId', render: (v) => <span className="font-bold">{v}</span> },
        { title: 'Project Name', key: 'projectName' },
        { title: 'Location', key: 'location' },
        { title: 'Lift Type', key: 'liftType' },
        { title: 'Status', key: 'status' },
      ];
    }
    if (reportType === 'Service Report') {
      return [
        { title: 'Service ID', key: 'serviceId', render: (v) => <span className="font-bold">{v}</span> },
        { title: 'Lift ID', key: 'liftId' },
        { title: 'Type', key: 'serviceType' },
        { title: 'Technician', key: 'technician' },
        { title: 'Status', key: 'status' },
      ];
    }
    return [
      { title: 'Ticket ID', key: 'complaintId', render: (v) => <span className="font-bold">{v}</span> },
      { title: 'Lift ID', key: 'liftId' },
      { title: 'Type', key: 'complaintType' },
      { title: 'Priority', key: 'priority' },
      { title: 'Status', key: 'status' },
    ];
  };

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Filter Control Box (Requirement 22) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Executive Operations Report Generator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter by date, location, and status criteria</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Report Type *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
            >
              <option value="Customer Report">Customer Report</option>
              <option value="Installation Report">Installation Report</option>
              <option value="Service Report">Service Report</option>
              <option value="Complaint Report">Complaint Report</option>
              <option value="Monthly Operations Report">Monthly Operations Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Filter</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active / Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending / Open</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      <DataTable
        title={`${reportType} Summary`}
        subtitle={`Generated for period ${dateFrom} to ${dateTo}`}
        columns={getColumns()}
        data={data}
        loading={loading}
        totalItems={data.length}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
};

export default Reports;
