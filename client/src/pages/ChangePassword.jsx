import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * ChangePassword page
 *
 * Shown automatically when a KCode user logs in for the first time
 * (or after an admin password reset). The user must successfully set a new
 * password before they can access any other part of the application.
 *
 * Route: /change-password   (public to authenticated KCode users only)
 */
const ChangePassword = () => {
  const { user, kcodeChangePassword, logout, needsPasswordChange, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword,     setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showCurrent,     setShowCurrent]       = useState(false);
  const [showNew,         setShowNew]           = useState(false);
  const [showConfirm,     setShowConfirm]       = useState(false);
  const [error,           setError]             = useState('');
  const [success,         setSuccess]           = useState('');
  const [isSubmitting,    setIsSubmitting]      = useState(false);

  // If user is not authenticated at all, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If the user somehow gets here but doesn't need a password change,
  // redirect to dashboard immediately.
  useEffect(() => {
    if (isAuthenticated && !needsPasswordChange) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, needsPasswordChange, navigate]);

  // Client-side validation
  const validate = () => {
    if (!currentPassword) return 'Current password is required.';
    if (!newPassword)     return 'New password is required.';
    if (!confirmPassword) return 'Please confirm your new password.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    if (newPassword.length < 8)         return 'New password must be at least 8 characters.';
    if (newPassword === currentPassword) return 'New password must be different from your current password.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await kcodeChangePassword({ currentPassword, newPassword, confirmPassword });

      if (res.success) {
        setSuccess('Password changed successfully. Redirecting to dashboard…');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        setError(res.message || 'Password change failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength indicator
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: 'Weak',   color: 'bg-rose-500' };
    if (score <= 3) return { level: 2, label: 'Fair',   color: 'bg-amber-500' };
    if (score <= 4) return { level: 3, label: 'Good',   color: 'bg-sky-500'  };
    return           { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo / brand */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 font-black text-2xl tracking-tighter">
            JL
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          JOHNSON
        </h2>
        <p className="text-center text-xs font-bold text-sky-400 tracking-widest uppercase mt-0.5">
          LIFTS &amp; ESCALATORS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/80 sm:px-10">

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Change Your Password</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              You're logging in for the first time.<br />
              Please create a new password to continue.
            </p>
            {user?.kcode && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-700/60 px-3 py-1.5 rounded-full">
                <span className="text-xs text-slate-400">KCode:</span>
                <span className="text-xs font-bold text-sky-400">{user.kcode}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="current-password-input"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="new-password-input"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength.level >= n ? strength.color : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Strength: <span className="font-semibold text-slate-200">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirm-password-input"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-500/70'
                      : 'border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-400">Passwords do not match.</p>
              )}
              {confirmPassword && newPassword === confirmPassword && newPassword && (
                <p className="mt-1 text-[11px] text-emerald-400">Passwords match ✓</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                id="change-password-btn"
                type="submit"
                disabled={isSubmitting || !!success}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating Password…' : 'Change Password'}
              </button>
            </div>
          </form>

          {/* Logout link */}
          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Sign out and go back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
