import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Customers from "./pages/Customers";
import Installations from "./pages/Installations";
import Services from "./pages/Services";
import Complaints from "./pages/Complaints";
import SheetData from "./pages/SheetData";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import WorkOrders from "./pages/WorkOrders";
import Attendance from "./pages/Attendance";
import ExtraWorkRequest from "./pages/ExtraWorkRequest";
import AdvanceRequest from "./pages/AdvanceRequest";
import NocRequest from "./pages/NocRequest";
import ModulePlaceholder from "./components/ModulePlaceholder";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* First-login mandatory password change (no DashboardLayout — standalone page) */}
          {/* ProtectedRoute still guards it (must be authenticated) but allows firstLogin users */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowKCode>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes inside Dashboard Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermission="dashboard">
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <DashboardLayout>
                  <Users />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
                <DashboardLayout>
                  <Customers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/installations"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
                <DashboardLayout>
                  <Installations />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
                <DashboardLayout>
                  <Services />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
                <DashboardLayout>
                  <Complaints />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sheet-data"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SheetData />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Viewer"]}>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Viewer"]}>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={["Admin", "Manager", "Employee", "Viewer"]}
              >
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/work-orders"
            element={
              <ProtectedRoute
                requiredPermission="workOrder"
                allowedRoles={["Admin", "Manager", "Employee"]}
              >
                <DashboardLayout>
                  <WorkOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/work-order"
            element={
              <ProtectedRoute
                requiredPermission="workOrder"
                allowedRoles={["Admin", "Manager", "Employee"]}
              >
                <DashboardLayout>
                  <WorkOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute requiredPermission="attendance">
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee-details"
            element={
              <ProtectedRoute requiredPermission="employeeDetails">
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quality-reports"
            element={
              <ProtectedRoute requiredPermission="qualityReports">
                <DashboardLayout>
                  <ModulePlaceholder title="Quality Reports" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/noc-request"
            element={
              <ProtectedRoute requiredPermission="nocRequest">
                <DashboardLayout>
                  <NocRequest />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/work-order-request"
            element={
              <ProtectedRoute requiredPermission="workOrderRequest">
                <DashboardLayout>
                  <ExtraWorkRequest />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/advance-request"
            element={
              <ProtectedRoute requiredPermission="advanceRequest">
                <DashboardLayout>
                  <AdvanceRequest />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-work-details"
            element={
              <ProtectedRoute requiredPermission="customerWorkDetails">
                <DashboardLayout>
                  <ModulePlaceholder title="Customer Work Details" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
