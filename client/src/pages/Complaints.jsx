import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle, Clock, ShieldAlert, Wrench, UserCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import { complaintService } from '../services/complaintService';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

const Complaints = () => {
  const { role: currentUserRole } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Stats summary for complaints
  const [complaintStats, setComplaintStats] = useState({
    open: 0,
    critical: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const initialForm = {
    complaintId: '',
    customer: '',
    liftId: 'JL-LKW-01',
    location: '',
    complaintType: 'Breakdown',
    description: '',
    priority: 'Medium',
    assignedTechnician: 'Unassigned',
    status: 'Open',
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintService.getComplaints({
        page,
        limit: 15,
        search,
        priority: priorityFilter,
        status: statusFilter,
      });

      if (res.success) {
        const data = res.data || [];
        setComplaints(data);
        setTotalItems(res.pagination?.total || 0);

        // Compute complaint summary counters
        setComplaintStats({
          open: data.filter((c) => c.status === 'Open').length,
          critical: data.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed').length,
          inProgress: data.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length,
          resolved: data.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length,
        });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to fetch field complaint tickets', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDropdown = async () => {
    try {
      const res = await customerService.getCustomers({ limit: 100 });
      if (res.success) {
        setCustomers(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, search, priorityFilter, statusFilter]);

  useEffect(() => {
    fetchCustomerDropdown();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedComplaint(null);
    const selectedCust = customers[0];
    setFormData({
      ...initialForm,
      complaintId: `CMP-${Math.floor(2000 + Math.random() * 8000)}`,
      customer: selectedCust?._id || '',
      location: selectedCust ? `${selectedCust.customerName}, ${selectedCust.city}` : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setSelectedComplaint(item);
    setFormData({
      complaintId: item.complaintId,
      customer: item.customer?._id || item.customer || '',
      liftId: item.liftId,
      location: item.location,
      complaintType: item.complaintType,
      description: item.description,
      priority: item.priority,
      assignedTechnician: item.assignedTechnician,
      status: item.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.complaintId || !formData.customer || !formData.liftId || !formData.location || !formData.description) {
      setFormError('Please fill in required fields');
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await complaintService.updateComplaint(selectedComplaint._id, formData);
      } else {
        res = await complaintService.createComplaint(formData);
      }

      if (res.success) {
        setToast({
          message: isEditMode ? 'Complaint ticket updated' : 'Complaint ticket logged successfully',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchComplaints();
      } else {
        setFormError(res.message || 'Saving failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error logging complaint');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComplaint = async (item) => {
    if (window.confirm(`Delete complaint ticket "${item.complaintId}"?`)) {
      try {
        const res = await complaintService.deleteComplaint(item._id);
        if (res.success) {
          setToast({ message: 'Complaint ticket deleted', type: 'success' });
          fetchComplaints();
        }
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to delete complaint', type: 'error' });
      }
    }
  };

  const columns = [
    {
      title: 'Ticket ID',
      key: 'complaintId',
      sortable: true,
      render: (val) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      title: 'Customer & Lift Tag',
      key: 'liftId',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{row.customer?.customerName || 'N/A'}</div>
          <div className="text-xs text-sky-700 font-semibold">{val} • {row.location}</div>
        </div>
      ),
    },
    {
      title: 'Type & Problem Description',
      key: 'complaintType',
      sortable: true,
      render: (val, row) => (
        <div className="max-w-xs">
          <span className="font-bold text-slate-800 text-xs">{val}</span>
          <p className="text-xs text-slate-500 truncate mt-0.5">{row.description}</p>
        </div>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      sortable: true,
      render: (val) => {
        const colors = {
          Critical: 'bg-rose-100 text-rose-700 border-rose-200',
          High: 'bg-amber-100 text-amber-800 border-amber-200',
          Medium: 'bg-sky-100 text-sky-800 border-sky-200',
          Low: 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[val] || colors.Medium}`}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (val) => {
        const colors = {
          Open: 'bg-rose-100 text-rose-800 border-rose-200',
          Assigned: 'bg-amber-100 text-amber-800 border-amber-200',
          'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
          Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          Closed: 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[val] || colors.Open}`}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Assigned Tech',
      key: 'assignedTechnician',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-800 text-xs">{val}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Complaint Statistics Summary Header (Requirement 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</p>
            <h4 className="text-xl font-extrabold text-slate-900 font-display">{complaintStats.open}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical Priority</p>
            <h4 className="text-xl font-extrabold text-rose-700 font-display">{complaintStats.critical}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress / Dispatch</p>
            <h4 className="text-xl font-extrabold text-slate-900 font-display">{complaintStats.inProgress}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved SLA</p>
            <h4 className="text-xl font-extrabold text-slate-900 font-display">{complaintStats.resolved}</h4>
          </div>
        </div>
      </div>

      <DataTable
        title="Complaint Management Portal"
        subtitle="24x7 customer breakdown calls, leveling faults, door safety interlock tickets"
        columns={columns}
        data={complaints}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchComplaints}
        onEdit={currentUserRole !== 'Viewer' ? handleOpenEditModal : null}
        onDelete={handleDeleteComplaint}
        userRole={currentUserRole}
        filterOptions={[
          { label: 'All Priorities', value: 'All' },
          { label: 'Critical', value: 'Critical' },
          { label: 'High', value: 'High' },
          { label: 'Medium', value: 'Medium' },
          { label: 'Low', value: 'Low' },
        ]}
        activeFilter={priorityFilter}
        onFilterChange={(f) => setPriorityFilter(f)}
        actions={
          currentUserRole !== 'Viewer' && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Complaint</span>
            </button>
          )
        }
      />

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Complaint Ticket: ${formData.complaintId}` : 'Log New Customer Complaint Ticket'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Ticket ID *</label>
              <input
                type="text"
                required
                value={formData.complaintId}
                onChange={(e) => setFormData({ ...formData, complaintId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer *</label>
              <select
                required
                value={formData.customer}
                onChange={(e) => {
                  const cust = customers.find((c) => c._id === e.target.value);
                  setFormData({
                    ...formData,
                    customer: e.target.value,
                    location: cust ? `${cust.customerName}, ${cust.city}` : formData.location,
                  });
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerName} ({c.customerId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lift Tag / ID *</label>
              <input
                type="text"
                required
                value={formData.liftId}
                onChange={(e) => setFormData({ ...formData, liftId: e.target.value })}
                placeholder="e.g. JL-LKW-09"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Site location / Building floor"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Type *</label>
              <select
                value={formData.complaintType}
                onChange={(e) => setFormData({ ...formData, complaintType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500"
              >
                <option value="Breakdown">Elevator Stuck / Breakdown</option>
                <option value="Noise">Abnormal Noise / Vibration</option>
                <option value="Door Issue">Door Sensor / Safety Edge</option>
                <option value="Leveling Fault">Floor Leveling Fault</option>
                <option value="Power Issue">Power / ARD Failure</option>
                <option value="Other">Other Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority SLA *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500"
              >
                <option value="Critical">Critical (Passengers trapped / Hospital)</option>
                <option value="High">High (Major lift down)</option>
                <option value="Medium">Medium (Minor defect)</option>
                <option value="Low">Low (Cosmetic check)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Technician</label>
              <input
                type="text"
                value={formData.assignedTechnician}
                onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                placeholder="Technician Name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500"
            >
              <option value="Open">Open</option>
              <option value="Assigned">Assigned to Tech</option>
              <option value="In Progress">In Progress (On Site)</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Description *</label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed explanation of reported fault..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Ticket' : 'Log Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Complaints;
