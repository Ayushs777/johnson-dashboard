"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getAccessProfile,
  normalizeDepartment,
} = require("../config/accessControl");
const { requirePermission } = require("../middleware/permissionMiddleware");
const {
  normalizeHeader,
  resolveField,
  findNocRequestHeader,
  buildNocRequestRow,
} = require("../services/googleSheetsService");

test("normalizes department formatting without partial matches", () => {
  assert.equal(normalizeDepartment(" EREC / OPR "), "erec/opr");
  assert.equal(
    getAccessProfile("ecode", "EREC/OPR").permissionGroup,
    "EREC_OPR",
  );
  assert.equal(
    getAccessProfile("ecode", "ERECTION").permissionGroup,
    "EREC_OPR",
  );
  assert.equal(getAccessProfile("ecode", "OPR").permissionGroup, "EREC_OPR");
  assert.equal(
    getAccessProfile("ecode", "TESTING / ESC").permissionGroup,
    "TESTING",
  );
  assert.equal(getAccessProfile("ecode", "ESPD").permissionGroup, "ESPD");
  assert.equal(
    getAccessProfile("ecode", "Regional Testing Support").accessConfigured,
    false,
  );
});

test("employee fields resolve from reordered header columns and aliases", () => {
  const headers = ["Department Name", "Employee Email", "Eng Name", "E-Code"];
  const values = ["TESTING", "worker@example.com", "Taylor Employee", "EC102"];
  const mapped = {};

  headers.forEach((header, index) => {
    const field = resolveField(normalizeHeader(header));
    if (field) mapped[field] = values[index];
  });

  test("NOC Request columns are located by headers after reordered columns and rows", () => {
    const result = findNocRequestHeader([
      ["Old report title"],
      [
        "Job Name",
        "Target W97 date",
        "Current Status",
        "Email Address",
        "In NOC Request",
        "Timestamp",
        "Job No (L-A1234)",
        "Target HO date",
      ],
    ]);

    assert.equal(result.headerRowIndex, 1);
    assert.equal(result.columns.timestamp[0], 5);
    assert.equal(result.columns.email[0], 3);
    assert.equal(result.columns.jobNo[0], 6);
    assert.equal(result.columns.jobName[0], 0);
    assert.equal(result.columns.currentStatus[0], 2);
  });

  test("NOC Request writes requested values under matching headers only", () => {
    const headers = [
      "Job Name",
      "Target W97 date",
      "Current Status",
      "Email Address",
      "In NOC Request",
      "Timestamp",
      "Job No (L-A1234)",
      "Target HO date",
    ];

    assert.deepEqual(
      buildNocRequestRow(headers, {
        timestamp: "11/10/2026 21:00:00",
        email: "worker@example.com",
        jobNo: "L-A1234",
        jobName: "Example site",
        currentStatus: "Under Testing",
      }),
      [
        "Example site",
        "",
        "Under Testing",
        "worker@example.com",
        "",
        "11/10/2026 21:00:00",
        "L-A1234",
        "",
      ],
    );
  });

  assert.deepEqual(mapped, {
    department: "TESTING",
    email: "worker@example.com",
    name: "Taylor Employee",
    ecode: "EC102",
  });
});

test("returns exactly the approved module permissions", () => {
  assert.deepEqual(getAccessProfile("kcode").permissions, [
    "dashboard",
    "workOrder",
    "employeeDetails",
  ]);
  assert.deepEqual(getAccessProfile("ecode", "EREC").permissions, [
    "dashboard",
    "workOrder",
    "attendance",
    "qualityReports",
    "nocRequest",
    "workOrderRequest",
    "advanceRequest",
    "customerWorkDetails",
  ]);
  assert.deepEqual(getAccessProfile("ecode", "TESTING").permissions, [
    "dashboard",
    "attendance",
    "advanceRequest",
  ]);
  assert.deepEqual(getAccessProfile("ecode", "ESPD").permissions, [
    "dashboard",
    "attendance",
    "customerWorkDetails",
    "advanceRequest",
  ]);
});

test("unknown ECode departments receive only the safe Attendance fallback", () => {
  const profile = getAccessProfile("ecode", "Unknown Department");
  assert.equal(profile.permissionGroup, null);
  assert.equal(profile.accessConfigured, false);
  assert.deepEqual(profile.permissions, ["attendance"]);
});

test("backend permission middleware enforces the department matrix", () => {
  const invoke = (type, department, permission) => {
    const response = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    let nextCalled = false;
    requirePermission(permission)(
      { user: { type, department } },
      response,
      () => {
        nextCalled = true;
      },
    );
    return { response, nextCalled };
  };

  assert.equal(invoke("ecode", "TESTING", "attendance").nextCalled, true);
  assert.equal(
    invoke("ecode", "TESTING", "workOrder").response.statusCode,
    403,
  );
  assert.equal(invoke("ecode", "ESPD", "customerWorkDetails").nextCalled, true);
  assert.equal(invoke("ecode", "ESPD", "nocRequest").response.statusCode, 403);
  assert.equal(
    invoke("ecode", "Unknown", "workOrder").response.body.message,
    "Access not configured for your department.",
  );
  assert.equal(invoke("kcode", "", "employeeDetails").nextCalled, true);
  assert.equal(invoke("kcode", "", "attendance").response.statusCode, 403);
});

test("backend middleware matches every approved access group", () => {
  const groups = [
    {
      type: "kcode",
      department: "",
      allowed: ["dashboard", "workOrder", "employeeDetails"],
      denied: [
        "attendance",
        "qualityReports",
        "nocRequest",
        "workOrderRequest",
        "customerWorkDetails",
      ],
    },
    {
      type: "ecode",
      department: "EREC/OPR",
      allowed: [
        "dashboard",
        "workOrder",
        "attendance",
        "qualityReports",
        "nocRequest",
        "workOrderRequest",
        "customerWorkDetails",
      ],
      denied: [],
    },
    {
      type: "ecode",
      department: "TESTING",
      allowed: ["dashboard", "attendance", "advanceRequest"],
      denied: [
        "workOrder",
        "qualityReports",
        "nocRequest",
        "workOrderRequest",
        "customerWorkDetails",
      ],
    },
    {
      type: "ecode",
      department: "ESPD",
      allowed: [
        "dashboard",
        "attendance",
        "customerWorkDetails",
        "advanceRequest",
      ],
      denied: ["workOrder", "qualityReports", "nocRequest", "workOrderRequest"],
    },
  ];

  for (const group of groups) {
    for (const permission of group.allowed) {
      const { nextCalled, response } = invokePermission(group, permission);
      assert.equal(
        nextCalled,
        true,
        `${group.department || group.type} should allow ${permission}`,
      );
      assert.equal(response.statusCode, 200);
    }
    for (const permission of group.denied) {
      const { nextCalled, response } = invokePermission(group, permission);
      assert.equal(
        nextCalled,
        false,
        `${group.department || group.type} should deny ${permission}`,
      );
      assert.equal(response.statusCode, 403);
    }
  }
});

const invokePermission = ({ type, department }, permission) => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  requirePermission(permission)(
    { user: { type, department } },
    response,
    () => {
      nextCalled = true;
    },
  );
  return { response, nextCalled };
};
