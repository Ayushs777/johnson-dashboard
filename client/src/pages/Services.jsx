import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Calendar, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { serviceService } from '../services/serviceService';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

const Services = () => {
  const { role: currentUserRole } = useAuth();
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const initialForm = {
    serviceId: '',
    customer: '',
    liftId: 'JL-LKW-01',
    location: '',
    serviceType: 'Preventive',
    technician: 'Ramesh Yadav',
    serviceDate: new Date().toISOString().split('T')[0],
    nextServiceDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    issue: 'Routine 30-day lubrication and brake check',
    resolution: '',
    status: 'Pending',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await serviceService.getServices({
        page,
        limit: 15,
        search,
        status: statusFilter,
        serviceType: typeFilter,
      });
      if (res.success) {
        setServices(res.data || []);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to fetch service records', type: 'error' });
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
    fetchServices();
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCustomerDropdown();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedService(null);
    const selectedCust = customers[0];
    setFormData({
      ...initialForm,
      serviceId: `SRV-${Math.floor(8000 + Math.random() * 1000)}`,
      customer: selectedCust?._id || '',
      location: selectedCust ? `${selectedCust.customerName}, ${selectedCust.city}` : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setSelectedService(item);
    setFormData({
      serviceId: item.serviceId,
      customer: item.customer?._id || item.customer || '',
      liftId: item.liftId,
      location: item.location,
      serviceType: item.serviceType,
      technician: item.technician,
      serviceDate: item.serviceDate ? new Date(item.serviceDate).toISOString().split('T')[0] : '',
      nextServiceDate: item.nextServiceDate
        ? new Date(item.nextServiceDate).toISOString().split('T')[0]
        : '',
      issue: item.issue || '',
      resolution: item.resolution || '',
      status: item.status,
      remarks: item.remarks || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.serviceId || !formData.customer || !formData.liftId || !formData.location || !formData.technician) {
      setFormError('Please fill in required service fields');
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await serviceService.updateService(selectedService._id, formData);
      } else {
        res = await serviceService.createService(formData);
      }

      if (res.success) {
        setToast({
          message: isEditMode ? 'Service record updated' : 'Service record created',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchServices();
      } else {
        setFormError(res.message || 'Saving failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error saving service record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (item) => {
    if (window.confirm(`Delete service record "${item.serviceId}"?`)) {
      try {
        const res = await serviceService.deleteService(item._id);
        if (res.success) {
          setToast({ message: 'Service record deleted', type: 'success' });
          fetchServices();
        }
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to delete service record', type: 'error' });
      }
    }
  };

  const columns = [
    {
      title: 'Service ID',
      key: 'serviceId',
      sortable: true,
      render: (val) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      title: 'Customer & Lift ID',
      key: 'liftId',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{row.customer?.customerName || 'N/A'}</div>
          <div className="text-xs text-sky-700 font-semibold">{val} ({row.location})</div>
        </div>
      ),
    },
    {
      title: 'Service Type',
      key: 'serviceType',
      sortable: true,
      render: (val) => {
        const colors = {
          Preventive: 'bg-emerald-100 text-emerald-800',
          Corrective: 'bg-amber-100 text-amber-800',
          Emergency: 'bg-rose-100 text-rose-800',
          'AMC Inspection': 'bg-sky-100 text-sky-800',
        };
        return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors[val] || 'bg-slate-100'}`}>{val}</span>;
      },
    },
    {
      title: 'Technician',
      key: 'technician',
      sortable: true,
    },
    {
      title: 'Scheduled / Done',
      key: 'serviceDate',
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (val) => {
        const colors = {
          Pending: 'bg-slate-100 text-slate-800 border-slate-200',
          Assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
          Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          Escalated: 'bg-rose-100 text-rose-800 border-rose-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[val] || colors.Pending}`}>
            {val}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <DataTable
        title="Service & Maintenance Database"
        subtitle="Preventive AMC inspections, routine lubrication, and emergency breakdown field service logs"
        columns={columns}
        data={services}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchServices}
        onEdit={currentUserRole !== 'Viewer' ? handleOpenEditModal : null}
        onDelete={handleDeleteService}
        userRole={currentUserRole}
        filterOptions={[
          { label: 'All Statuses', value: 'All' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Assigned', value: 'Assigned' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(f) => setStatusFilter(f)}
        actions={
          currentUserRole !== 'Viewer' && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Service</span>
            </button>
          )
        }
      />

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Service Log: ${formData.serviceId}` : 'Create New Service Log'}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Service ID *</label>
              <input
                type="text"
                required
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
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
                placeholder="e.g. JL-LKW-01"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Building Name / Wing Location"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Type *</label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Preventive">Preventive Maintenance</option>
                <option value="Corrective">Corrective Maintenance</option>
                <option value="Emergency">Emergency Breakdown</option>
                <option value="AMC Inspection">AMC Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Technician *</label>
              <input
                type="text"
                required
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                placeholder="Technician Name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Date</label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Scheduled Inspection</label>
              <input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issue Reported / Action Items</label>
            <input
              type="text"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="e.g. Brake adjustment & rail oil check"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Summary</label>
            <textarea
              rows="2"
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              placeholder="Details of parts replaced or calibration completed..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
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
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Update Service Log' : 'Save Service Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Services;
