import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Key, Lock, CheckCircle2, Building2, Briefcase, MapPin, Layers, FileText, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, changePassword, kcodeChangePassword } = useAuth();
  // KCode users change their password via the Google Sheet write-back endpoint
  const isKCodeUser = user?.type === 'kcode';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  // field alias so we send the right key to the KCode endpoint
  const confirmPassword = confirmNewPassword;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      // Route to the correct endpoint based on account type
      const res = isKCodeUser
        ? await kcodeChangePassword({ currentPassword, newPassword, confirmPassword })
        : await changePassword({ currentPassword, newPassword, confirmNewPassword });

      if (res.success) {
        setToast({ message: 'Password changed successfully', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(res.message || 'Password update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentName = user?.department || 'Operations & Maintenance';
  const displayEmail = user?.email || (user?.userId ? `${user.userId.toLowerCase()}@johnsonlifts.in` : 'operations@johnsonlifts.in');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* User Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-sky-600/20 font-display">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">{user?.name || user?.userId || 'Ayush Chaudhary'}</h2>
              <span className="px-3 py-1 bg-sky-100 text-sky-800 border border-sky-200 rounded-full text-xs font-bold">
                {user?.role || 'Employee'}
              </span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                {departmentName}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Johnson Lifts & Escalators Operations Portal User
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" />
                <span>User ID / KCode: <strong className="text-slate-900">{user?.userId || user?.kcode || 'K03829'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>{displayEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Status: <strong className="text-emerald-700">{user?.status || 'Active'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department & Operational Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            Department & Operational Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed department allocation and operational credentials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Department / Division</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{departmentName}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Service Engineering & Maintenance</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Designation / Role</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{user?.role || 'Field Operations Engineer'}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Authorized Field Technician</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Service Code / KCode</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{user?.kcode || user?.userId || 'K03829'}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Synced with Master Google Sheet</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Operational Branch</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">Regional Operations Division</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Johnson Lifts & Escalators India</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Access Permissions</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">Work Orders & Attendance</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Full PDF Download & Viewing Rights</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Account Type</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{isKCodeUser ? 'KCode Sheet Authenticated' : 'System Account'}</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">Live JWT Session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Change Section (Requirement 25) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-600" />
            Security & Change Password
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKCodeUser
              ? 'KCode account passwords are stored in the Google Sheet and updated in real time.'
              : 'Admin passwords are hashed with bcrypt on the backend server.'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Security Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
