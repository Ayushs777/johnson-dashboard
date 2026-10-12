"use strict";

const PERMISSIONS = Object.freeze({
  KCODE: Object.freeze(["dashboard", "workOrder", "employeeDetails"]),
  EREC_OPR: Object.freeze([
    "dashboard",
    "workOrder",
    "attendance",
    "qualityReports",
    "nocRequest",
    "workOrderRequest",
    "advanceRequest",
    "customerWorkDetails",
  ]),
  TESTING: Object.freeze(["dashboard", "attendance", "advanceRequest"]),
  ESPD: Object.freeze([
    "dashboard",
    "attendance",
    "customerWorkDetails",
    "advanceRequest",
  ]),
});

const ECODE_DEPARTMENT_GROUPS = Object.freeze({
  erec: "EREC_OPR",
  "erec/opr": "EREC_OPR",
  erecopr: "EREC_OPR",
  erection: "EREC_OPR",
  opr: "EREC_OPR",
  testing: "TESTING",
  "testing/esc": "TESTING",
  testingesc: "TESTING",
  espd: "ESPD",
});

const UNCONFIGURED_ECODE_PERMISSIONS = Object.freeze(["attendance"]);

const normalizeDepartment = (department) =>
  String(department || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const getAccessProfile = (type, department = "") => {
  if (type === "kcode") {
    return {
      permissionGroup: "KCODE",
      permissions: [...PERMISSIONS.KCODE],
      accessConfigured: true,
    };
  }

  if (type === "ecode") {
    const permissionGroup =
      ECODE_DEPARTMENT_GROUPS[normalizeDepartment(department)] || null;
    return {
      permissionGroup,
      permissions: permissionGroup
        ? [...PERMISSIONS[permissionGroup]]
        : [...UNCONFIGURED_ECODE_PERMISSIONS],
      accessConfigured: permissionGroup !== null,
    };
  }

  return { permissionGroup: null, permissions: [], accessConfigured: true };
};

module.exports = {
  ECODE_DEPARTMENT_GROUPS,
  PERMISSIONS,
  getAccessProfile,
  normalizeDepartment,
};
