import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("johnson_user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("johnson_user");
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("johnson_token") || null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser((prev) => ({ ...prev, ...res.data }));
            localStorage.setItem("johnson_user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.error("Session verification error:", err);
          setToken(null);
          setUser(null);
          localStorage.removeItem("johnson_token");
          localStorage.removeItem("johnson_user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  /**
   * KCode login — primary login path for employees.
   * Uses Google Sheets as the credential source.
   * The response includes firstLogin which is stored on the user object.
   */
  const loginWithKCode = async (kcode, password) => {
    const data = await authService.loginWithKCode(kcode, password);
    if (data.success && data.token) {
      const userObj = {
        ...data.user,
        userId: data.user.kcode,
        token: data.token,
      };
      setUser(userObj);
      setToken(data.token);
    }
    return data;
  };

  /**
   * ECode login — for employees who use ECode authentication.
   * These users can access the limited dashboard and attendance pages.
   */
  const loginWithECode = async (ecode, password) => {
    const data = await authService.loginWithECode(ecode, password);
    if (data.success && data.token) {
      const userObj = {
        ...data.user,
        userId: data.user.ecode,
        token: data.token,
      };
      setUser(userObj);
      setToken(data.token);
    }
    return data;
  };

  /**
   * Legacy login — kept for Admin (MongoDB-backed) accounts.
   */
  const login = async (userId, password) => {
    const data = await authService.login(userId, password);
    if (data.success && data.data) {
      setUser(data.data);
      setToken(data.data.token);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const hasPermission = (permission) =>
    Array.isArray(user?.permissions) && user.permissions.includes(permission);

  /**
   * MongoDB user password change (Admin via Profile page).
   */
  const changePassword = async (passwordData) => {
    return await authService.changePassword(passwordData);
  };

  /**
   * KCode user password change.
   * On success the backend issues a fresh JWT (firstLogin: false).
   * We update context state so the app can navigate to /work-orders immediately.
   */
  const kcodeChangePassword = async (passwordData) => {
    const result = await authService.kcodeChangePassword(passwordData);
    if (result.success && result.token) {
      const updatedUser = {
        ...user,
        ...result.user,
        userId: result.user?.kcode || user?.kcode,
        token: result.token,
        firstLogin: false,
      };
      setUser(updatedUser);
      setToken(result.token);
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        loginWithKCode,
        loginWithECode,
        logout,
        changePassword,
        kcodeChangePassword,
        role: user?.role || "Guest",
        // Convenience flag — true only for KCode users who haven't yet changed password
        needsPasswordChange:
          user?.type === "kcode" && user?.firstLogin === true,
        // User type helpers
        isECodeUser: user?.type === "ecode",
        isKCodeUser: user?.type === "kcode",
        isMongoUser: user?.type === "mongo" || (!user?.type && !!user),
        isCodeUser: user?.type === "kcode" || user?.type === "ecode",
        permissions: user?.permissions || [],
        permissionGroup: user?.permissionGroup || null,
        accessConfigured: user?.accessConfigured !== false,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
