import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Hash,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [loginType, setLoginType] = useState("kcode"); // 'kcode' | 'ecode'
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithKCode, loginWithECode, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleTypeSwitch = (type) => {
    setLoginType(type);
    setCode("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError(
        `Please enter your ${loginType === "kcode" ? "KCode" : "ECode"}`,
      );
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    const normalised = code.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(normalised)) {
      setError(
        `${loginType === "kcode" ? "KCode" : "ECode"} must contain only letters and numbers`,
      );
      return;
    }

    try {
      setIsSubmitting(true);

      if (loginType === "kcode") {
        // ── KCode path (Google Sheets) ──────────────────────────────────────
        const res = await loginWithKCode(normalised, password);
        if (res.success) {
          if (res.user?.firstLogin === true) {
            navigate("/change-password", { replace: true });
          } else {
            navigate("/work-orders", { replace: true });
          }
        } else {
          setError(res.message || "Login failed");
        }
      } else {
        // ── ECode path ──────────────────────────────────────────────────────
        const res = await loginWithECode(normalised, password);
        if (res.success) {
          navigate("/dashboard", { replace: true });
        } else {
          setError(res.message || "Login failed");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.response?.data?.message ||
        "Unable to connect to the server. Please check the backend API.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Quick-fill helper for the Admin demo button (uses legacy login) */
  const handleAdminLogin = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await login("admin", "admin123");
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.message || "Admin login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKCode = loginType === "kcode";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-sky-500 selection:text-white">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 font-black text-2xl tracking-tighter">
            JL
          </div>
        </div>

        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight font-display">
          JOHNSON
        </h2>
        <p className="text-center text-xs font-bold text-sky-400 tracking-widest uppercase mt-0.5">
          LIFTS &amp; ESCALATORS
        </p>
        <p className="mt-2 text-center text-sm text-slate-400 font-medium">
          Operations &amp; Data Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/80 sm:px-10">
          {/* ── Login Type Toggle ─────────────────────────────────────────── */}
          <div className="flex rounded-xl bg-slate-900/60 p-1 mb-6 border border-slate-700">
            <button
              id="toggle-kcode"
              type="button"
              onClick={() => handleTypeSwitch("kcode")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                isKCode
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              KCode Login
            </button>
            <button
              id="toggle-ecode"
              type="button"
              onClick={() => handleTypeSwitch("ecode")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !isKCode
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ECode Login
            </button>
          </div>

          {/* ── Type label ───────────────────────────────────────────────── */}
          <p className="text-[11px] text-slate-500 text-center mb-5">
            {isKCode
              ? "Sign in with your KCode to access Work Orders and operational pages."
              : "Sign in with your ECode to access modules assigned to your department."}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* ── Code field ──────────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="code-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                {isKCode ? "KCode" : "ECode"}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="h-4 w-4" />
                </div>
                <input
                  id="code-input"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    isKCode
                      ? "Enter KCode e.g. KJ1001"
                      : "Enter ECode e.g. EC10025"
                  }
                  autoComplete="username"
                  className={`block w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    isKCode
                      ? "border-slate-700 focus:ring-sky-500"
                      : "border-slate-700 focus:ring-emerald-500"
                  }`}
                />
              </div>
            </div>

            {/* ── Password field ───────────────────────────────────────────── */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                    isKCode
                      ? "border-slate-700 focus:ring-sky-500"
                      : "border-slate-700 focus:ring-emerald-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Remember Me ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500"
                />
                <span className="ml-2 font-medium">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setError(
                    "Contact your Johnson Lifts administrator to reset your password.",
                  )
                }
                className="font-medium text-sky-400 hover:text-sky-300 transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* ── Submit ──────────────────────────────────────────────────── */}
            <div>
              <button
                id="login-btn"
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isKCode
                    ? "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 focus:ring-sky-500"
                    : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:ring-emerald-500"
                }`}
              >
                {isSubmitting ? (
                  <span>Authenticating…</span>
                ) : (
                  <>
                    <span>Login to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Admin Access ─────────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider text-center mb-3">
              Admin Access
            </p>
            <button
              id="admin-login-btn"
              type="button"
              onClick={handleAdminLogin}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-900/60 hover:bg-slate-900 text-xs font-medium text-purple-300 rounded-lg border border-purple-500/30 transition flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sign in as Admin</span>
            </button>
            <p className="mt-3 text-center text-[10px] text-slate-500">
              Employees log in using their KCode or ECode above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
