import React, { useState, useEffect } from 'react';
import { Plus, Layers, User, Calendar, MapPin, CheckCircle, Wrench } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { installationService } from '../services/installationService';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

const Installations = () => {
  const { role: currentUserRole } = useAuth();
  const [installations, setInstallations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState(null);

  const initialForm = {
    installationId: '',
    customer: '',
    projectName: '',
    location: '',
    liftType: 'Passenger',
    liftCapacity: '8 Persons / 544 kg',
    numberOfFloors: 4,
    installationDate: new Date().toISOString().split('T')[0],
    status: 'Planned',
    technician: 'Ramesh Yadav',
    projectManager: 'Vikram Sethi',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchInstallations = async () => {
    try {
      setLoading(true);
      const res = await installationService.getInstallations({
        page,
        limit: 15,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setInstallations(res.data || []);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to fetch installation records', type: 'error' });
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
    fetchInstallations();
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCustomerDropdown();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedInstallation(null);
    setFormData({
      ...initialForm,
      installationId: `INST-${Math.floor(5000 + Math.random() * 4000)}`,
      customer: customers[0]?._id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setSelectedInstallation(item);
    setFormData({
      installationId: item.installationId,
      customer: item.customer?._id || item.customer || '',
      projectName: item.projectName,
      location: item.location,
      liftType: item.liftType,
      liftCapacity: item.liftCapacity,
      numberOfFloors: item.numberOfFloors,
      installationDate: item.installationDate
        ? new Date(item.installationDate).toISOString().split('T')[0]
        : '',
      status: item.status,
      technician: item.technician,
      projectManager: item.projectManager,
      remarks: item.remarks || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.installationId || !formData.customer || !formData.projectName || !formData.location) {
      setFormError('Please fill in required fields (ID, Customer, Project, Location)');
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await installationService.updateInstallation(selectedInstallation._id, formData);
      } else {
        res = await installationService.createInstallation(formData);
      }

      if (res.success) {
        setToast({
          message: isEditMode ? 'Installation record updated' : 'Installation project created',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchInstallations();
      } else {
        setFormError(res.message || 'Saving failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error saving installation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInstallation = async (item) => {
    if (window.confirm(`Delete installation project "${item.projectName}" (${item.installationId})?`)) {
      try {
        const res = await installationService.deleteInstallation(item._id);
        if (res.success) {
          setToast({ message: 'Installation record deleted', type: 'success' });
          fetchInstallations();
        }
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to delete record', type: 'error' });
      }
    }
  };

  const columns = [
    {
      title: 'Installation ID',
      key: 'installationId',
      sortable: true,
      render: (val) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      title: 'Project Name & Customer',
      key: 'projectName',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          <div className="text-xs text-slate-500 font-medium">{row.customer?.customerName || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Lift Type / Specs',
      key: 'liftType',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-xs font-bold">{val}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {row.numberOfFloors} Floors • {row.liftCapacity}
          </span>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      sortable: true,
    },
    {
      title: 'Project Status',
      key: 'status',
      sortable: true,
      render: (val) => {
        const colors = {
          Planned: 'bg-slate-100 text-slate-800 border-slate-200',
          'In Progress': 'bg-sky-100 text-sky-800 border-sky-200',
          Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          'On Hold': 'bg-amber-100 text-amber-800 border-amber-200',
          Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[val] || colors.Planned}`}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Lead Tech / PM',
      key: 'technician',
      render: (val, row) => (
        <span className="text-xs text-slate-700 font-medium">
          Tech: {val} <br />
          <span className="text-slate-400 text-[11px]">PM: {row.projectManager}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <DataTable
        title="Installation Projects Database"
        subtitle="Erection, testing, and commissioning tracking for elevator shafts and escalators"
        columns={columns}
        data={installations}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchInstallations}
        onEdit={currentUserRole !== 'Viewer' ? handleOpenEditModal : null}
        onDelete={handleDeleteInstallation}
        userRole={currentUserRole}
        filterOptions={[
          { label: 'All Projects', value: 'All' },
          { label: 'Planned', value: 'Planned' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'On Hold', value: 'On Hold' },
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
              <span>New Installation</span>
            </button>
          )
        }
      />

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Installation: ${formData.installationId}` : 'New Installation Project'}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation ID *</label>
              <input
                type="text"
                required
                value={formData.installationId}
                onChange={(e) => setFormData({ ...formData, installationId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer *</label>
              <select
                required
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.customerName} ({c.customerId}) - {c.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g. Block A High-Speed Lifts"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Gomti Nagar, Lucknow"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lift Type *</label>
              <select
                value={formData.liftType}
                onChange={(e) => setFormData({ ...formData, liftType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Passenger">Passenger Elevator</option>
                <option value="Goods">Goods / Freight Lift</option>
                <option value="Home Lift">Residential Home Lift</option>
                <option value="Escalator">Heavy Duty Escalator</option>
                <option value="Hospital Lift">Hospital Stretcher Lift</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Capacity / Specs</label>
              <input
                type="text"
                value={formData.liftCapacity}
                onChange={(e) => setFormData({ ...formData, liftCapacity: e.target.value })}
                placeholder="e.g. 13 Persons / 884 kg"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Floors</label>
              <input
                type="number"
                value={formData.numberOfFloors}
                onChange={(e) => setFormData({ ...formData, numberOfFloors: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lead Technician</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Manager</label>
              <input
                type="text"
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
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
              {isSaving ? 'Saving...' : isEditMode ? 'Update Installation' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Installations;
