import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, UserX, Shield, Trash2, Edit } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { role: currentUserRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        page,
        limit: 15,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      if (res.success) {
        setUsers(res.data || []);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to fetch user directory', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({
      userId: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Employee',
      status: 'Active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user._id);
    setFormData({
      userId: user.userId,
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      status: user.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isEditMode && (!formData.userId || !formData.password || !formData.name || !formData.email)) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (!isEditMode && formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await userService.updateUser(selectedUserId, formData);
      } else {
        res = await userService.createUser(formData);
      }

      if (res.success) {
        setToast({
          message: isEditMode ? 'User updated successfully' : 'User created successfully',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setFormError(res.message || 'Operation failed');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error while saving user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await userService.updateUser(user._id, { status: newStatus });
      if (res.success) {
        setToast({ message: `Account ${user.userId} set to ${newStatus}`, type: 'success' });
        fetchUsers();
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update status', type: 'error' });
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user account "${user.userId}"?`)) {
      try {
        const res = await userService.deleteUser(user._id);
        if (res.success) {
          setToast({ message: 'User deleted successfully', type: 'success' });
          fetchUsers();
        }
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to delete user', type: 'error' });
      }
    }
  };

  const columns = [
    {
      title: 'User ID',
      key: 'userId',
      sortable: true,
      render: (val, row) => (
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <span>{val}</span>
          {row._id === currentUser?._id && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">You</span>
          )}
        </div>
      ),
    },
    {
      title: 'Name',
      key: 'name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900">{val}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      sortable: true,
      render: (val) => {
        const colors = {
          Admin: 'bg-purple-100 text-purple-800 border-purple-200',
          Manager: 'bg-amber-100 text-amber-800 border-amber-200',
          Employee: 'bg-sky-100 text-sky-800 border-sky-200',
          Viewer: 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[val] || colors.Viewer}`}>
            {val}
          </span>
        );
      },
    },
    {
      title: 'Account Status',
      key: 'status',
      sortable: true,
      render: (val, row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          title="Click to toggle status"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            val === 'Active'
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
          }`}
        >
          {val === 'Active' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
          <span>{val}</span>
        </button>
      ),
    },
    {
      title: 'Created Date',
      key: 'createdAt',
      sortable: true,
      render: (val) => new Date(val).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <DataTable
        title="Admin User Management"
        subtitle="Manage administrative accounts, role privileges, and active directory statuses"
        columns={columns}
        data={users}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchUsers}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteUser}
        userRole={currentUserRole}
        filterOptions={[
          { label: 'All Roles', value: 'All' },
          { label: 'Admin', value: 'Admin' },
          { label: 'Manager', value: 'Manager' },
          { label: 'Employee', value: 'Employee' },
          { label: 'Viewer', value: 'Viewer' },
        ]}
        activeFilter={roleFilter}
        onFilterChange={(f) => setRoleFilter(f)}
        actions={
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        }
      />

      {/* User Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit User: ${formData.userId}` : 'Create New User Account'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">User ID *</label>
              <input
                type="text"
                disabled={isEditMode}
                required
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="e.g. emp_102"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="rahul@johnsonlifts.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isEditMode ? 'New Password (Optional)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!isEditMode}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {!isEditMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Permission *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Manager">Manager (Operations)</option>
                <option value="Employee">Employee (Field/Service)</option>
                <option value="Viewer">Viewer (Read-Only Reports)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              {isSaving ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
