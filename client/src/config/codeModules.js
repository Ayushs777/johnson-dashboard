import {
  Building2,
  CalendarCheck,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

export const CODE_MODULES = [
  {
    permission: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    permission: "workOrder",
    title: "Work Order",
    path: "/work-orders",
    icon: ClipboardList,
  },
  {
    permission: "employeeDetails",
    title: "Employee Details",
    path: "/employee-details",
    icon: Users,
  },
  {
    permission: "attendance",
    title: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
  },
  {
    permission: "qualityReports",
    title: "Quality Reports",
    path: "/quality-reports",
    icon: FileSpreadsheet,
  },
  {
    permission: "nocRequest",
    title: "NOC Request",
    path: "/noc-request",
    icon: ShieldCheck,
  },
  {
    permission: "workOrderRequest",
    title: "Extra Work Request",
    path: "/work-order-request",
    icon: ClipboardList,
  },
  {
    permission: "advanceRequest",
    title: "Advance Request",
    path: "/advance-request",
    icon: Clock3,
  },
  {
    permission: "customerWorkDetails",
    title: "Customer Work Details",
    path: "/customer-work-details",
    icon: Building2,
  },
];
