import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ProtectedRoute
 *
 * Guards any route behind authentication.
 *
 * Rules (in priority order):
 *  1. While auth is loading   → show spinner.
 *  2. Not authenticated       → redirect to /login.
 *  3. KCode user whose firstLogin is still true (needsPasswordChange)
 *     AND not already on /change-password
 *                             → redirect to /change-password.
 *  4. Code users lacking the route permission → deny access.
 *  5. Authenticated but wrong role → show "Access Restricted" page.
 *  6. All checks pass         → render children.
 */
const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermission,
  allowKCode = false,
}) => {
  const {
    isAuthenticated,
    loading,
    role,
    user,
    needsPasswordChange,
    isECodeUser,
    isCodeUser,
    hasPermission,
  } = useAuth();
  const location = useLocation();

  // 1. Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  // 2. Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. First-login guard — force password change before any other protected page
  //    (Allow the /change-password route itself through so no infinite redirect)
  if (needsPasswordChange && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // 4. KCode and ECode sessions are authorized only by the server permission list.
  if (isCodeUser) {
    if (user?.type === "kcode" && allowKCode && !requiredPermission) {
      return children;
    }

    if (!requiredPermission || !hasPermission(requiredPermission)) {
      if (isECodeUser && user?.accessConfigured === false) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <h1 className="text-xl font-bold text-slate-900">
              Access not configured for your department.
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Attendance remains available while your department access is
              reviewed.
            </p>
            <a
              href="/attendance"
              className="mt-5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Open Attendance
            </a>
          </div>
        );
      }

      return <Navigate to="/dashboard" replace />;
    }
  }

  // 5. Role check
  if (!isCodeUser && allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-slate-600 mt-2 max-w-md">
          Your account role (
          <span className="font-semibold text-slate-900">{role}</span>) does not
          have permission to view this module.
        </p>
        <a
          href="/dashboard"
          className="mt-6 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          Return to Main Dashboard
        </a>
      </div>
    );
  }

  // 6. All checks passed
  return children;
};

export default ProtectedRoute;
