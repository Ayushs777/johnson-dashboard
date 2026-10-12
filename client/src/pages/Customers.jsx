import React, { useState, useEffect } from 'react';
import { Plus, Building2, Phone, Mail, MapPin, Layers, Calendar, CheckCircle } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { role: currentUserRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [amcFilter, setAmcFilter] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const initialForm = {
    customerId: '',
    customerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    numberOfLifts: 1,
    installationDate: new Date().toISOString().split('T')[0],
    amcStatus: 'Active',
    serviceStatus: 'Operational',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({
        page,
        limit: 15,
        search,
        amcStatus: amcFilter,
      });
      if (res.success) {
        setCustomers(res.data || []);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load customer records', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, amcFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedCustomer(null);
    setFormData({
      ...initialForm,
      customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setIsEditMode(true);
    setSelectedCustomer(customer);
    setFormData({
      customerId: customer.customerId,
      customerName: customer.customerName,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      numberOfLifts: customer.numberOfLifts,
      installationDate: customer.installationDate
        ? new Date(customer.installationDate).toISOString().split('T')[0]
        : '',
      amcStatus: customer.amcStatus,
      serviceStatus: customer.serviceStatus,
      remarks: customer.remarks || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (
      !formData.customerId ||
      !formData.customerName ||
      !formData.contactPerson ||
      !formData.phone ||
      !formData.email ||
      !formData.city
    ) {
      setFormError('Please fill in all mandatory customer information');
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await customerService.updateCustomer(selectedCustomer._id, formData);
      } else {
        res = await customerService.createCustomer(formData);
      }

      if (res.success) {
        setToast({
          message: isEditMode ? 'Customer record updated' : 'Customer created successfully',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        setFormError(res.message || 'Saving failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error saving customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Delete customer "${customer.customerName}" (${customer.customerId})?`)) {
      try {
        const res = await customerService.deleteCustomer(customer._id);
        if (res.success) {
          setToast({ message: 'Customer record deleted', type: 'success' });
          fetchCustomers();
        }
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to delete customer', type: 'error' });
      }
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = [
      'Customer ID',
      'Customer Name',
      'Contact Person',
      'Phone',
      'Email',
      'City',
      'State',
      'Lifts',
      'AMC Status',
      'Service Status',
    ];
    const rows = customers.map((c) => [
      c.customerId,
      `"${c.customerName}"`,
      `"${c.contactPerson}"`,
      c.phone,
      c.email,
      c.city,
      c.state,
      c.numberOfLifts,
      c.amcStatus,
      c.serviceStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `johnson_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Customer ID',
      key: 'customerId',
      sortable: true,
      render: (val) => <span className="font-bold text-slate-900">{val}</span>,
    },
    {
      title: 'Customer Name',
      key: 'customerName',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          <div className="text-xs text-slate-500 font-medium">
            {row.contactPerson} ({row.phone})
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'city',
      sortable: true,
      render: (val, row) => (
        <span className="text-xs font-semibold text-slate-700">
          {val}, {row.state}
        </span>
      ),
    },
    {
      title: 'Lifts',
      key: 'numberOfLifts',
      sortable: true,
      render: (val) => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200">
          {val} {val === 1 ? 'Lift' : 'Lifts'}
        </span>
      ),
    },
    {
      title: 'AMC Status',
      key: 'amcStatus',
      sortable: true,
      render: (val) => {
        const colors = {
          Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          Expired: 'bg-rose-100 text-rose-800 border-rose-200',
          Pending: 'bg-amber-100 text-amber-800 border-amber-200',
          'Under Maintenance': 'bg-sky-100 text-sky-800 border-sky-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[val] || colors.Active}`}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Service Health',
      key: 'serviceStatus',
      sortable: true,
      render: (val) => {
        const colors = {
          Operational: 'text-emerald-600',
          Degraded: 'text-amber-600',
          Offline: 'text-rose-600',
        };
        return (
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                val === 'Operational' ? 'bg-emerald-500' : val === 'Degraded' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
            <span className={colors[val] || 'text-slate-700'}>{val}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <DataTable
        title="Customer Database"
        subtitle="Registered corporate clients, commercial complexes, hospitals, and residential towers"
        columns={columns}
        data={customers}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchCustomers}
        onView={handleOpenViewModal}
        onEdit={currentUserRole !== 'Viewer' ? handleOpenEditModal : null}
        onDelete={handleDeleteCustomer}
        onExportCSV={handleExportCSV}
        userRole={currentUserRole}
        filterOptions={[
          { label: 'All AMC', value: 'All' },
          { label: 'Active', value: 'Active' },
          { label: 'Expired', value: 'Expired' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Under Maintenance', value: 'Under Maintenance' },
        ]}
        activeFilter={amcFilter}
        onFilterChange={(f) => setAmcFilter(f)}
        actions={
          currentUserRole !== 'Viewer' && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )
        }
      />

      {/* Customer Create / Edit Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Customer: ${formData.customerName}` : 'Register New Customer Account'}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer ID *</label>
              <input
                type="text"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Organization Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Phoenix Palassio Mall"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Anand Verma"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="facility@domain.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building Street Address, Sector / Area"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Lucknow"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Uttar Pradesh"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Lifts *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.numberOfLifts}
                onChange={(e) => setFormData({ ...formData, numberOfLifts: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Installation Date</label>
              <input
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AMC Status *</label>
              <select
                value={formData.amcStatus}
                onChange={(e) => setFormData({ ...formData, amcStatus: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Active">Active Contract</option>
                <option value="Expired">Expired</option>
                <option value="Pending">Pending Renewal</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Status *</label>
              <select
                value={formData.serviceStatus}
                onChange={(e) => setFormData({ ...formData, serviceStatus: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Operational">Operational (All Clear)</option>
                <option value="Degraded">Degraded (Partial Issues)</option>
                <option value="Offline">Offline (Shut Down)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks & Technical Notes</label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Contract SLA 4 hrs, gearless high speed motor..."
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
              {isSaving ? 'Saving Record...' : isEditMode ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Customer Record Details: ${selectedCustomer.customerId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="text-base font-bold text-slate-900">{selectedCustomer.customerName}</h4>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800">
                  {selectedCustomer.amcStatus} AMC
                </span>
              </div>
              <p className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Contact Person</p>
                <p className="font-bold text-slate-900 mt-1">{selectedCustomer.contactPerson}</p>
                <p className="text-slate-500">{selectedCustomer.phone}</p>
                <p className="text-slate-500">{selectedCustomer.email}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Equipment Fleet</p>
                <p className="font-bold text-slate-900 mt-1">{selectedCustomer.numberOfLifts} Elevators / Escalators</p>
                <p className="text-slate-500">Service Status: {selectedCustomer.serviceStatus}</p>
                <p className="text-slate-500">
                  Installed: {new Date(selectedCustomer.installationDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedCustomer.remarks && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-bold text-[10px] uppercase tracking-wider text-amber-800">Remarks</p>
                <p className="mt-0.5 leading-relaxed">{selectedCustomer.remarks}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
