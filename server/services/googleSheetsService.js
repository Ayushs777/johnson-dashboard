/**
 * Google Sheets Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of all Google Sheets API interaction.
 *
 * Design principles enforced here:
 *  1. Column order NEVER matters   — headers are discovered dynamically.
 *  2. Header row location NEVER matters — scanned from the top until found.
 *  3. Header matching is flexible   — normalised (lower-case, strip spaces/-/_).
 *  4. Authentication NEVER uses a cache — each login/password-change fetches live.
 *  5. Passwords are NEVER logged anywhere in this module.
 *  6. The service account needs Editor permission to write passwords back.
 *
 * Security note (required by business):
 *  Passwords are stored and written in plain text to the Google Sheet so that
 *  the administrator can view and manage them. Plain-text passwords in any
 *  external service are a security risk. Ensure the Sheet is shared only with
 *  authorised people and the service-account key is kept secret.
 */

"use strict";

const { google } = require("googleapis");

// ─── Column alias maps ────────────────────────────────────────────────────────
// Each entry is a set of normalised strings that map to that field.
// normalizeHeader() collapses all of them to one canonical form before lookup.

const FIELD_ALIASES = {
  kcode: new Set([
    "kcode",
    "k-code",
    "k code",
    "employeekcode",
    "empkcode",
    "user id",
    "userid",
  ]),
  ecode: new Set([
    "ecode",
    "e-code",
    "e code",
    "employeecode",
    "empcode",
    "emp code",
    "empecode",
    "employeeid",
  ]),
  password: new Set([
    "password",
    "pass",
    "loginpassword",
    "userpassword",
    "pwd",
  ]),
  status: new Set(["status", "accountstatus", "userstatus", "actstatus"]),
  name: new Set([
    "name",
    "employeename",
    "username",
    "fullname",
    "empname",
    "engname",
    "eng name",
    "engineername",
  ]),
  role: new Set(["role", "userrole", "designation", "desig", "jobrole"]),
  department: new Set(["department", "departmentname", "dept", "division"]),
  email: new Set([
    "email",
    "emailid",
    "email id",
    "mail",
    "emailaddress",
    "employeeemail",
    "employeeemailid",
    "loginid",
    "login id",
    "loginemail",
  ]),
};

/**
 * Normalise a raw header string:
 *   trim, lower-case, strip all whitespace/underscores/hyphens.
 */
function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "");
}

function resolveField(normalised) {
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.has(normalised)) return field;
  }
  return null;
}

function getAuthClient() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error(
      "Google Sheets credentials are not configured in environment variables.",
    );
  }

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

// ─── Column-letter helpers ────────────────────────────────────────────────────

/**
 * Convert a 0-based column index to a Google Sheets column letter.
 * e.g. 0 → 'A', 1 → 'B', 25 → 'Z', 26 → 'AA'
 */
function columnIndexToLetter(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

function findNocRequestHeader(rows) {
  const aliases = {
    timestamp: (header) => header === "timestamp",
    email: (header) => header === "email" || header === "emailaddress",
    jobNo: (header) =>
      header === "jobnumber" || header.startsWith("jobno"),
    jobName: (header) => header === "jobname",
    currentStatus: (header) => header === "currentstatus",
  };
  const requiredFields = Object.keys(aliases);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] || [];
    const columns = Object.fromEntries(
      requiredFields.map((field) => [field, []]),
    );

    row.forEach((cell, columnIndex) => {
      const header = String(cell || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      for (const field of requiredFields) {
        if (aliases[field](header)) columns[field].push(columnIndex);
      }
    });

    if (requiredFields.every((field) => columns[field].length === 1)) {
      return { headerRowIndex: rowIndex, columns };
    }
  }

  throw new Error(
    "NOC Request sheet configuration is invalid. Required headers are Timestamp, Email Address, Job No, Job Name, and Current Status.",
  );
}

function buildNocRequestRow(headerRow, request) {
  const { columns } = findNocRequestHeader([headerRow]);
  const values = Array(headerRow.length).fill("");

  values[columns.timestamp[0]] = request.timestamp;
  values[columns.email[0]] = request.email;
  values[columns.jobNo[0]] = request.jobNo;
  values[columns.jobName[0]] = request.jobName;
  values[columns.currentStatus[0]] = request.currentStatus;

  return values;
}

// ─── Sheet data fetcher ───────────────────────────────────────────────────────

/**
 * Fetch ALL values from the configured sheet/tab.
 * Returns a 2-D array of raw string values (rows × cols).
 * Throws a sanitised error — never exposes internal API details.
 */
async function getSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is not set in environment variables.");
  }

  let auth, sheets;
  try {
    auth = getAuthClient();
    sheets = google.sheets({ version: "v4", auth });
  } catch (err) {
    // credentials misconfiguration
    throw new Error(
      "Authentication service configuration error. Contact the administrator.",
    );
  }

  let response;
  try {
    // Fetch the entire used range of the configured tab.
    response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName, // e.g. "Sheet1" — Google reads all used cells
    });
  } catch (err) {
    // Do NOT leak the Google API error message to the caller.
    console.error("[GoogleSheets] API read error:", err.message);
    throw new Error(
      "Unable to connect to the authentication service. Please try again later.",
    );
  }

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error(
      "Authentication sheet is empty. Please contact the administrator.",
    );
  }

  return rows; // raw 2-D array
}

// ─── Header row finder ────────────────────────────────────────────────────────

/**
 * Scan the rows top-to-bottom and return the first row index that contains
 * ALL three required field headers: kcode, password, status.
 *
 * Returns:
 *   { headerRowIndex: number, headerMap: { kcode, password, status, name?, role? } }
 *
 * Throws a descriptive (but safe) error when:
 *  - No row contains the required headers.
 *  - A required header is present but another required header is missing.
 */
function findHeaderRow(rows) {
  let foundPartial = false;
  let partialColMap = null;

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || row.length === 0) continue;

    // Build a normalised → column-index map for this row
    const colMap = {};
    row.forEach((cell, colIdx) => {
      const norm = normalizeHeader(cell);
      if (norm) {
        const field = resolveField(norm);
        if (field && !(field in colMap)) {
          colMap[field] = colIdx;
        }
      }
    });

    const hasKCode = "kcode" in colMap;
    const hasPassword = "password" in colMap;

    if (hasKCode && hasPassword) {
      return { headerRowIndex: rowIdx, headerMap: colMap };
    }
  }

  throw new Error(
    "Authentication sheet configuration is invalid. Please contact the administrator. Could not find a row containing KCode and Password headers.",
  );
}

// ─── Public: get full sheet structure ────────────────────────────────────────

/**
 * Returns the sheet structure needed for read/write operations:
 *   { rows, headerRowIndex, headerMap }
 *
 * rows         — full 2-D array from the sheet
 * headerRowIndex — 0-based row index of the header row
 * headerMap    — { kcode: colIdx, password: colIdx, status: colIdx, name?: colIdx, role?: colIdx }
 */
async function getSheetStructure() {
  const rows = await getSheetData();
  const { headerRowIndex, headerMap } = findHeaderRow(rows);

  // Check for duplicate KCodes in the data rows
  const dataRows = rows.slice(headerRowIndex + 1);
  const seenKCodes = new Map();
  dataRows.forEach((row, relIdx) => {
    const kcode = (row[headerMap.kcode] || "").trim().toUpperCase();
    if (!kcode) return;
    if (seenKCodes.has(kcode)) {
      console.error(
        `[GoogleSheets] Duplicate KCode detected: "${kcode}" ` +
          `at sheet rows ${seenKCodes.get(kcode) + headerRowIndex + 2} and ` +
          `${relIdx + headerRowIndex + 2} (1-based).`,
      );
    } else {
      seenKCodes.set(kcode, relIdx);
    }
  });

  return { rows, headerRowIndex, headerMap };
}

// ─── Public: find a single KCode user ────────────────────────────────────────

/**
 * Find a KCode user using a fully header-driven approach.
 *
 * Primary source: GOOGLE_KCODE_SHEET_ID / GOOGLE_KCODE_SHEET_NAME (real office KCode sheet, tab "ID").
 * Fallback: legacy employee sheet (GOOGLE_SHEET_ID / GOOGLE_SHEET_NAME).
 *
 * Column ORDER does NOT matter — columns are auto-detected by FIELD_ALIASES.
 * So if Login ID, Password, K-Code columns shift positions, it still works.
 *
 * @param {string} kcode  Already normalised (trimmed + upper-cased).
 * @returns {Object|null} { kcode, password, status, name, role, department, email } or null.
 * @throws On API/config errors (callers translate to safe HTTP responses).
 */
async function findKCodeUser(kcode) {
  if (!kcode) return null;

  // ── Sheet candidates: primary KCode sheet first, then fallbacks ──────────────
  const sheetCandidates = [
    {
      sheetId: process.env.GOOGLE_KCODE_SHEET_ID,
      tabNames: [
        process.env.GOOGLE_KCODE_SHEET_NAME,
        "ID",
        "KCode",
        "K-Code",
        "Users",
        "Login",
      ].filter(Boolean),
    },
    {
      // Legacy fallback: employee sheet
      sheetId: process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_ECODE_SHEET_ID,
      tabNames: [
        process.env.GOOGLE_SHEET_NAME,
        "User ID",
        "Email ID",
        "Sheet1",
      ].filter(Boolean),
    },
  ];

  let rows = null;
  let sourceLabel = "unknown";

  for (const candidate of sheetCandidates) {
    if (!candidate.sheetId) continue;
    for (const tabName of candidate.tabNames) {
      const fetched = await getSheetDataByName(tabName, candidate.sheetId);
      if (fetched && fetched.length > 1) {
        rows = fetched;
        sourceLabel = tabName;
        break;
      }
    }
    if (rows) break;
  }

  if (!rows || rows.length === 0) {
    throw new Error(
      "Authentication sheet configuration is invalid. Please contact the administrator. " +
        "Could not load KCode user data.",
    );
  }

  // ── Header detection: scan rows top-to-bottom ────────────────────────────────
  let headerRowIndex = -1;
  let headerMap = {};

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const colMap = {};
    row.forEach((cell, colIdx) => {
      const norm = normalizeHeader(cell);
      if (!norm) return;
      const field = resolveField(norm);
      if (field && !(field in colMap)) {
        colMap[field] = colIdx;
      }
    });

    // Need at minimum: a kcode (or ecode) column AND a password column
    if (("kcode" in colMap || "ecode" in colMap) && "password" in colMap) {
      headerRowIndex = r;
      headerMap = colMap;
      // If sheet uses 'ecode' column name instead of 'kcode' (employee sheet scenario)
      if (!("kcode" in headerMap) && "ecode" in headerMap) {
        headerMap.kcode = headerMap.ecode;
      }
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      "Authentication sheet configuration is invalid. Please contact the administrator. " +
        "Could not find a row containing KCode and Password headers.",
    );
  }

  // ── Search data rows ─────────────────────────────────────────────────────────
  const dataRows = rows.slice(headerRowIndex + 1);
  const matches = [];

  dataRows.forEach((row) => {
    const rowKCode = (row[headerMap.kcode] || "").trim().toUpperCase();
    if (rowKCode === kcode) {
      matches.push(row);
    }
  });

  if (matches.length > 1) {
    console.error(
      `[GoogleSheets] Ambiguous KCode: "${kcode}" appears ${matches.length} times in tab "${sourceLabel}".`,
    );
    throw new Error(
      "Authentication configuration error: duplicate KCode detected. " +
        "Please contact the administrator.",
    );
  }

  if (matches.length === 0) return null;

  const row = matches[0];
  const password = (row[headerMap.password] || "").trim();
  const status =
    headerMap.status != null ? (row[headerMap.status] || "").trim() : "Active";
  const name = headerMap.name != null ? (row[headerMap.name] || "").trim() : "";
  const role = headerMap.role != null ? (row[headerMap.role] || "").trim() : "";
  const department =
    headerMap.department != null
      ? (row[headerMap.department] || "").trim()
      : "";
  const email =
    headerMap.email != null ? (row[headerMap.email] || "").trim() : "";

  console.log(
    `[GoogleSheets] KCode user "${kcode}" found in tab "${sourceLabel}"`,
  );

  // ── Enrich with department from employee sheet ────────────────────────────────
  // The KCode sheet (ID tab) has Login ID, Password, K-Code but no department.
  // Look up the employee profile by email from the employee sheet (User ID tab).
  let enrichedDept = department;
  let enrichedName = name;
  if ((!enrichedDept || !enrichedName) && email) {
    try {
      const profile = await lookupEmployeeProfile({ email });
      if (profile) {
        if (!enrichedDept && profile.department)
          enrichedDept = profile.department;
        if (!enrichedName && profile.name) enrichedName = profile.name;
      }
    } catch (e) {
      // Non-fatal: dept lookup failed, continue without it
      console.warn(
        "[GoogleSheets] Department enrichment lookup failed:",
        e.message,
      );
    }
  }

  return {
    kcode,
    password,
    status: status || "Active",
    name: enrichedName || kcode,
    role: role || "Employee",
    department: enrichedDept,
    email,
  };
}

// ─── Public: lookup employee profile from employee sheet ─────────────────────

/**
 * Header-driven employee profile lookup.
 * Searches the employee sheet (GOOGLE_ECODE_SHEET_ID) for a matching email or empCode.
 * Returns { name, department, empCode, email } or null if not found.
 *
 * Used to enrich KCode users (who have no dept in their KCode sheet) with department.
 *
 * @param {Object} opts  { email?: string, empCode?: string }
 */
async function lookupEmployeeProfile({ email = "", empCode = "" } = {}) {
  const sheetId =
    process.env.GOOGLE_ECODE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  const tabsToTry = [
    process.env.GOOGLE_ECODE_SHEET_NAME,
    "User ID",
    "Email ID",
    "Sheet1",
  ].filter(Boolean);

  let rows = null;
  for (const tab of tabsToTry) {
    const fetched = await getSheetDataByName(tab, sheetId);
    if (fetched && fetched.length > 1) {
      rows = fetched;
      break;
    }
  }
  if (!rows || rows.length === 0) return null;

  // ── Header-driven column detection ───────────────────────────────────────────
  let headerRowIndex = -1;
  let colMap = {};

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const candidate = {};
    row.forEach((cell, ci) => {
      const norm = normalizeHeader(cell);
      if (!norm) return;
      const field = resolveField(norm);
      if (field && !(field in candidate)) candidate[field] = ci;
    });
    // Need at minimum: email (or ecode) column so we can match the user
    if ("email" in candidate || "ecode" in candidate) {
      headerRowIndex = r;
      colMap = candidate;
      break;
    }
  }
  if (headerRowIndex === -1) return null;

  // ── Search by email or empCode ────────────────────────────────────────────────
  const targetEmail = email ? email.trim().toLowerCase() : "";
  const targetEmpCode = empCode ? empCode.trim().toUpperCase() : "";

  const dataRows = rows.slice(headerRowIndex + 1);
  for (const row of dataRows) {
    if (!row || row.length === 0) continue;

    const rowEmail =
      colMap.email != null
        ? (row[colMap.email] || "").trim().toLowerCase()
        : "";
    const rowEmpCode =
      colMap.ecode != null
        ? (row[colMap.ecode] || "").trim().toUpperCase()
        : "";

    const matchEmail = targetEmail && rowEmail === targetEmail;
    const matchEmpCode = targetEmpCode && rowEmpCode === targetEmpCode;

    if (matchEmail || matchEmpCode) {
      return {
        name: colMap.name != null ? (row[colMap.name] || "").trim() : "",
        department:
          colMap.department != null
            ? (row[colMap.department] || "").trim()
            : "",
        empCode: rowEmpCode,
        email: rowEmail,
      };
    }
  }
  return null;
}

// ─── Public: update KCode password in sheet ───────────────────────────────────

/**
 * Write newPassword to the exact Password cell for the given KCode.
 * Discovers both the column and the row dynamically.
 * Only touches the single password cell — all other data is preserved.
 *
 * Atomicity note: this function either succeeds fully or throws.
 * The caller (controller) should update MongoDB only AFTER this resolves.
 *
 * @param {string} kcode        Already normalised (trimmed + upper-cased).
 * @param {string} newPassword  Plain-text password (business requirement).
 * @throws On API/config errors.
 */
async function updateKCodePassword(kcode, newPassword) {
  if (!kcode || !newPassword) {
    throw new Error("KCode and new password are required for password update.");
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is not configured.");
  }

  const { rows, headerRowIndex, headerMap } = await getSheetStructure();
  const dataRows = rows.slice(headerRowIndex + 1);

  // Find the exact row index (0-based in `rows` array) for this KCode
  let targetAbsoluteRowIndex = -1;
  let matchCount = 0;

  dataRows.forEach((row, relIdx) => {
    const rowKCode = (row[headerMap.kcode] || "").trim().toUpperCase();
    if (rowKCode === kcode) {
      matchCount++;
      targetAbsoluteRowIndex = headerRowIndex + 1 + relIdx; // 0-based in rows[]
    }
  });

  if (matchCount === 0) {
    throw new Error(`KCode "${kcode}" not found in the sheet.`);
  }
  if (matchCount > 1) {
    throw new Error(
      `Duplicate KCode "${kcode}" in sheet. Cannot update password safely.`,
    );
  }

  // Convert to 1-based sheet row number (Google Sheets rows start at 1)
  const sheetRowNumber = targetAbsoluteRowIndex + 1;
  const passwordColLetter = columnIndexToLetter(headerMap.password);

  // A1 notation for the single password cell, e.g. "Sheet1!C6"
  const cellA1 = `${sheetName}!${passwordColLetter}${sheetRowNumber}`;

  let auth, sheets;
  try {
    auth = getAuthClient();
    sheets = google.sheets({ version: "v4", auth });
  } catch (err) {
    throw new Error(
      "Authentication service configuration error. Contact the administrator.",
    );
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellA1,
      valueInputOption: "RAW", // write exactly as-is, no formula interpretation
      requestBody: {
        values: [[newPassword]], // single cell update — NEVER log newPassword
      },
    });
  } catch (err) {
    console.error("[GoogleSheets] Password write error:", err.message);
    throw new Error(
      "Failed to update the password in the authentication sheet. Please try again later.",
    );
  }
}

async function appendNocRequest({ email, jobNo, jobName, currentStatus }) {
  const spreadsheetId = process.env.GOOGLE_NOC_REQUEST_SHEET_ID;
  const sheetName = process.env.GOOGLE_NOC_REQUEST_SHEET_NAME || "Sheet1";

  if (!spreadsheetId) {
    throw new Error("NOC Request Google Sheet is not configured.");
  }

  let sheets;
  try {
    sheets = google.sheets({ version: "v4", auth: getAuthClient() });
  } catch (err) {
    throw new Error(
      "Authentication service configuration error. Contact the administrator.",
    );
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName.replace(/'/g, "''")}'`,
    });
    const rows = response.data.values || [];
    const { headerRowIndex } = findNocRequestHeader(rows);
    const headerRow = rows[headerRowIndex];
    const values = buildNocRequestRow(headerRow, {
      timestamp: new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      }),
      email,
      jobNo,
      jobName,
      currentStatus,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName.replace(/'/g, "''")}'!A:${columnIndexToLetter(values.length - 1)}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
  } catch (err) {
    if (err.message.startsWith("NOC Request sheet configuration is invalid.")) {
      throw err;
    }
    console.error("[GoogleSheets] NOC Request append error:", err.message);
    throw new Error(
      "Unable to submit the NOC Request to Google Sheets. Please try again later.",
    );
  }
}

// ─── Generic Sheet fetcher by tab name ────────────────────────────────────────

async function getSheetDataByName(tabName, customSheetId = null) {
  const sheetId = customSheetId || process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID or custom sheet ID is not set.");
  }

  let auth, sheets;
  try {
    auth = getAuthClient();
    sheets = google.sheets({ version: "v4", auth });
  } catch (err) {
    throw new Error(
      "Authentication service configuration error. Contact the administrator.",
    );
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: tabName,
    });
    return response.data.values || [];
  } catch (err) {
    if (err.message && err.message.includes("Unable to parse range")) {
      // It's normal for a sheet to not exist when iterating over fallback names, so we don't log it.
    } else {
      console.error(
        `[GoogleSheets] API read error for sheet '${tabName}':`,
        err.message,
      );
    }
    return null;
  }
}

// ─── Public: find a single ECode user ────────────────────────────────────────

async function findECodeUser(ecode) {
  if (!ecode) return null;

  // Priority order: .env configured tab → known office tab names → fallbacks
  const sheetNamesToTry = [
    process.env.GOOGLE_ECODE_SHEET_NAME, // "Email ID" (set in .env)
    "Email ID", // actual tab name in office sheet
    "EmailID",
    "emp_user_id",
    process.env.GOOGLE_USERS_SHEET_NAME,
    process.env.GOOGLE_SHEET_NAME,
    "ECode",
    "Users",
    "Sheet1",
  ].filter(Boolean);

  let rows = null;
  for (const sName of sheetNamesToTry) {
    const fetched = await getSheetDataByName(
      sName,
      process.env.GOOGLE_ECODE_SHEET_ID,
    );
    if (fetched && fetched.length > 0) {
      // Verify that this tab has an Emp Code / ECode column
      for (let r = 0; r < fetched.length; r++) {
        const row = fetched[r];
        if (!row) continue;
        const colNorms = row.map(normalizeHeader);
        const hasECodeCol = colNorms.some((header) => {
          const field = resolveField(header);
          return field === "ecode" || field === "kcode";
        });
        if (hasECodeCol) {
          rows = fetched;
          console.log(`[GoogleSheets] ECode data found in tab: "${sName}"`);
          break;
        }
      }
    }
    if (rows) break;
  }

  if (!rows || rows.length === 0) {
    try {
      rows = await getSheetData();
    } catch (e) {
      return null;
    }
  }

  let headerRowIndex = -1;
  let headerMap = {};

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || row.length === 0) continue;

    const colMap = {};
    row.forEach((cell, colIdx) => {
      const norm = normalizeHeader(cell);
      if (norm) {
        const field = resolveField(norm);
        if (field && !(field in colMap)) {
          colMap[field] = colIdx;
        }
      }
    });

    if (("ecode" in colMap || "kcode" in colMap) && "password" in colMap) {
      headerRowIndex = rowIdx;
      headerMap = colMap;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error(
      "[GoogleSheets] Could not find header row containing ECode and Password",
    );
    return null;
  }

  const dataRows = rows.slice(headerRowIndex + 1);
  const targetECode = String(ecode).trim().toUpperCase();

  const ecodeColIdx = headerMap.ecode ?? headerMap.kcode;
  const matches = [];
  dataRows.forEach((row) => {
    const rowECode = (row[ecodeColIdx] || "").trim().toUpperCase();
    if (rowECode === targetECode) {
      matches.push(row);
    }
  });

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error(
      "Authentication configuration error: duplicate ECode detected. Please contact the administrator.",
    );
  }

  const row = matches[0];
  const status =
    headerMap.status != null ? (row[headerMap.status] || "").trim() : "Active";
  const password = (row[headerMap.password] || "").trim();
  const name = headerMap.name != null ? (row[headerMap.name] || "").trim() : "";
  const role = headerMap.role != null ? (row[headerMap.role] || "").trim() : "";
  const department =
    headerMap.department != null
      ? (row[headerMap.department] || "").trim()
      : "";
  const email =
    headerMap.email != null ? (row[headerMap.email] || "").trim() : "";

  let employeeProfile = null;
  try {
    employeeProfile = await lookupEmployeeProfile({
      empCode: targetECode,
      email,
    });
  } catch (profileError) {
    console.warn(
      "[GoogleSheets] ECode employee profile lookup failed:",
      profileError.message,
    );
  }

  return {
    ecode: targetECode,
    password,
    status,
    name: employeeProfile?.name || name || targetECode,
    role: role || "Employee",
    department: employeeProfile?.department || department,
    email: employeeProfile?.email || email,
  };
}

// ─── Work Orders Dynamic Retrieval ───────────────────────────────────────────

const WORK_ORDER_HEADER_MAP = {
  fileName: ["filename", "pdfname", "documentname", "file", "pdf", "name"],
  fileUrl: [
    "fileurl",
    "pdfurl",
    "documenturl",
    "driveurl",
    "url",
    "pdflink",
    "filelink",
    "drivelink",
    "googledrivelink",
    "link",
    "pdf",
  ],
  folderPath: ["folderpath", "folder", "directory"],
  jobNo: ["jobno", "jobnumber", "workorder", "workordernumber", "job", "jobid"],
  type: ["type", "worktype", "wotype"],
  engineerName: ["engineername", "engineer", "employeename", "engname"],
  scCode: ["sccode", "s/ccode", "servicecode", "kcode"],
  scEmailId: ["scemailid", "s/cemailid", "s/cemail", "serviceemail", "email"],
};

async function getWorkOrdersData(
  kcodeFilter = null,
  isManagement = false,
  emailFilter = null,
) {
  const tabNamesToTry = [
    process.env.GOOGLE_WO_SHEET_NAME,
    "All WOs",
    "ALL_WO",
    process.env.GOOGLE_WORK_ORDERS_SHEET_NAME,
    "WorkOrders",
    "Work Orders",
    "Work_Orders",
    "Sheet1",
  ].filter(Boolean);

  let rows = null;
  const woSheetId =
    process.env.GOOGLE_WO_SHEET_ID || process.env.GOOGLE_WORK_ORDERS_SHEET_ID;
  for (const tName of tabNamesToTry) {
    const fetched = await getSheetDataByName(tName, woSheetId);
    if (fetched && fetched.length > 0) {
      rows = fetched;
      break;
    }
  }

  if (!rows || rows.length === 0) {
    return [];
  }

  let headerRowIndex = -1;
  let colIndexMap = {};

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const mapCandidate = {};
    row.forEach((cell, cIdx) => {
      const norm = normalizeHeader(cell);
      if (!norm) return;

      for (const [canonicalKey, aliases] of Object.entries(
        WORK_ORDER_HEADER_MAP,
      )) {
        if (aliases.includes(norm) && !(canonicalKey in mapCandidate)) {
          mapCandidate[canonicalKey] = cIdx;
        }
      }
    });

    if (
      "fileName" in mapCandidate &&
      "fileUrl" in mapCandidate &&
      "jobNo" in mapCandidate &&
      "scCode" in mapCandidate
    ) {
      headerRowIndex = r;
      colIndexMap = mapCandidate;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      "Work Order configuration error: required columns (File Name, File URL, Job No, S/c Code) were not found.",
    );
  }

  const dataRows = rows.slice(headerRowIndex + 1);
  const targetKCode = kcodeFilter
    ? String(kcodeFilter).trim().toUpperCase()
    : null;
  const targetEmail = emailFilter
    ? String(emailFilter).trim().toLowerCase()
    : null;

  const result = [];
  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0) return;

    const rowKCode =
      colIndexMap.scCode != null
        ? (row[colIndexMap.scCode] || "").trim().toUpperCase()
        : "";
    const rowEmail =
      colIndexMap.scEmailId != null
        ? (row[colIndexMap.scEmailId] || "").trim().toLowerCase()
        : "";

    if (targetEmail && rowEmail !== targetEmail) {
      return;
    }

    if (
      !targetEmail &&
      !isManagement &&
      targetKCode &&
      rowKCode !== targetKCode
    ) {
      return;
    }

    if (
      !targetEmail &&
      isManagement &&
      targetKCode &&
      rowKCode !== targetKCode
    ) {
      return;
    }

    // if no KCode is assigned to the row and we are filtering for a specific kcode, skip it
    if (!targetEmail && !isManagement && !rowKCode) {
      return;
    }

    const jobNo =
      colIndexMap.jobNo != null ? (row[colIndexMap.jobNo] || "").trim() : "";

    const wo = {
      // create a unique internal ID for the react UI to use as a key, since Job No can be duplicate
      id: `WO-${idx + 1001}-${jobNo}`,
      jobNo: jobNo,
      fileName:
        colIndexMap.fileName != null
          ? (row[colIndexMap.fileName] || "").trim()
          : "",
      fileUrl:
        colIndexMap.fileUrl != null
          ? (row[colIndexMap.fileUrl] || "").trim()
          : "",
      folderPath:
        colIndexMap.folderPath != null
          ? (row[colIndexMap.folderPath] || "").trim()
          : "",
      type:
        colIndexMap.type != null ? (row[colIndexMap.type] || "").trim() : "",
      engineerName:
        colIndexMap.engineerName != null
          ? (row[colIndexMap.engineerName] || "").trim()
          : "",
      scCode: rowKCode,
      scEmailId:
        colIndexMap.scEmailId != null
          ? (row[colIndexMap.scEmailId] || "").trim()
          : "",
    };

    result.push(wo);
  });

  return result;
}

// ─── Attendance Dynamic Retrieval ─────────────────────────────────────────────

const ATTENDANCE_HEADER_MAP = {
  ecode: [
    "ecode",
    "e code",
    "e-code",
    "employeecode",
    "empcode",
    "employeeid",
    "empid",
  ],
  employeeName: ["employeename", "name", "empname", "fullname"],
  date: ["date", "attendancedate", "day"],
  loginTime: ["logintime", "timein", "checkin", "in", "login"],
  logoutTime: ["logouttime", "timeout", "checkout", "out", "logout"],
  status: ["status", "attendancestatus", "mark"],
  workingHours: [
    "workinghours",
    "hours",
    "totalhours",
    "duration",
    "workhours",
  ],
};

async function getAttendanceData(
  ecodeFilter = null,
  isManagement = false,
  filterMonth = null,
  filterYear = null,
) {
  const tabNamesToTry = [
    process.env.GOOGLE_ATTENDANCE_SHEET_NAME,
    "Attendance",
    "Form responses 1",
    "Attendance_Data",
    "AttendanceData",
  ].filter(Boolean);

  let rows = null;
  for (const tName of tabNamesToTry) {
    const fetched = await getSheetDataByName(
      tName,
      process.env.GOOGLE_ATTENDANCE_SHEET_ID ||
        process.env.GOOGLE_ECODE_SHEET_ID,
    );
    if (fetched && fetched.length > 0) {
      rows = fetched;
      break;
    }
  }

  if (!rows || rows.length === 0) {
    return [];
  }

  const targetECode = ecodeFilter
    ? String(ecodeFilter).trim().toUpperCase()
    : null;

  // ── GRID DETECTION (two-pass, row-isolated) ──────────────────────────────────
  // Real sheet layout:
  //   Row 0: Title "ATTENDANCE SHEET FOR THE MONTH OF ..."
  //   Row 1: "Start Date 01-09-2026  End Date 30-09-2026"
  //   Row 2: empty / merged cells
  //   Row 3: COUNT/SUMMARY row — has stray numbers (21, 22, 27 ...) — MUST NOT USE for day mapping
  //   Row 4: Column headers — S.N., EMP ID., DOJ, Employee Name, ..., Tue, Wed, Thu ...
  //   Row 5: Day number row — (empty x10), 01, 02, 03 ... 30
  //   Row 6+: Employee data rows
  //
  // The previous single-pass approach mixed day-number detection across ALL rows,
  // so stray numbers in Row 3 (like 21, 22, 27) were stored first in dayColMap
  // at WRONG column indices, and the "if (!(dayNum in dayColMap))" guard then
  // prevented the correct Row 5 values from overwriting them — causing wrong data.
  //
  // Fix: two separate passes — Pass 1 finds month/year + EMP ID header row,
  //      Pass 2 builds dayColMap ONLY from the row with the most day numbers
  //      in the neighbourhood of the header row.

  let empIdColIdx = -1;
  let empNameColIdx = -1;
  let empHeaderRowIdx = -1; // row that contains S.N., EMP ID., Employee Name ...
  let dayNumRowIdx = -1; // row that contains 01, 02, 03 ... 30
  const dayColMap = {};
  let gridYear = new Date().getFullYear();
  let gridMonth = new Date().getMonth() + 1;

  const MONTH_NAMES = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  // ── Pass 1: month/year detection + find EMP ID header row ────────────────────
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r] || [];
    let rowYearCandidate = 0,
      rowMonthCandidate = 0;

    row.forEach((cell, cIdx) => {
      const s = String(cell || "").trim();

      // Check for date pattern (e.g. "01-09-2026" or "01/09/2026")
      const dm =
        s.match(/(\d{2})[-/](\d{2})[-/](\d{4})/) ||
        s.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (dm) {
        if (dm[3] && dm[3].length === 4) {
          gridMonth = parseInt(dm[2], 10);
          gridYear = parseInt(dm[3], 10);
        } else if (dm[1] && dm[1].length === 4) {
          gridYear = parseInt(dm[1], 10);
          gridMonth = parseInt(dm[2], 10);
        }
      }
      const lc = s.toLowerCase();
      const mi = MONTH_NAMES.findIndex((mn) => lc.includes(mn));
      if (mi !== -1) gridMonth = mi + 1;
    });

    // EMP ID header row — only strict ECode/EmpID column headers qualify
    if (empHeaderRowIdx === -1) {
      row.forEach((cell, cIdx) => {
        // Strip trailing dots/periods before matching (handles "EMP ID." → "empid")
        const norm = normalizeHeader(cell).replace(/\.+$/, "");
        if (["empid", "ecode", "employeecode", "empcode"].includes(norm)) {
          empIdColIdx = cIdx;
          empHeaderRowIdx = r;
        }
        if (
          ["employeename", "name", "empname"].includes(norm) &&
          empNameColIdx === -1
        ) {
          empNameColIdx = cIdx;
        }
      });
    }
  }

  // ── Pass 2: build dayColMap ONLY from the best day-number row ─────────────────
  // Scan empHeaderRowIdx and the 3 rows that follow.
  // Pick whichever row has the most 1–31 day numbers.
  if (empHeaderRowIdx !== -1) {
    let bestRow = -1,
      bestCount = 0;
    const scanLimit = Math.min(empHeaderRowIdx + 4, rows.length - 1);
    for (let r = empHeaderRowIdx; r <= scanLimit; r++) {
      let cnt = 0;
      (rows[r] || []).forEach((cell) => {
        const s = String(cell || "").trim();
        const n = parseInt(s.replace(/^0+/, "") || "0", 10);
        if (!isNaN(n) && n >= 1 && n <= 31 && /^\d{1,2}$/.test(s)) cnt++;
      });
      if (cnt > bestCount) {
        bestCount = cnt;
        bestRow = r;
      }
    }
    if (bestRow !== -1 && bestCount >= 15) {
      dayNumRowIdx = bestRow;
      // Build dayColMap from the FIRST contiguous sequential run of day numbers (1→31).
      // We find where the run starts (first occurrence of "1" or "01"), then walk
      // forward accepting only strictly increasing consecutive day numbers.
      // This prevents stray isolated numbers in summary/metadata columns (e.g. "5"
      // appearing at col 52 after col 41 has "DO") from overwriting the real day map.
      const bestRowCells = rows[bestRow] || [];
      // Find the start of the contiguous run: first cell that equals 1
      let runStartCol = -1;
      for (let ci = 0; ci < bestRowCells.length; ci++) {
        const s = String(bestRowCells[ci] || "").trim();
        const n = parseInt(s.replace(/^0+/, "") || "0", 10);
        if (n === 1 && /^\d{1,2}$/.test(s)) {
          runStartCol = ci;
          break;
        }
      }
      if (runStartCol !== -1) {
        // Walk forward: accept only cells whose day number == lastDay + 1
        let lastDay = 0;
        for (let ci = runStartCol; ci < bestRowCells.length; ci++) {
          const s = String(bestRowCells[ci] || "").trim();
          const n = parseInt(s.replace(/^0+/, "") || "0", 10);
          if (
            !isNaN(n) &&
            n >= 1 &&
            n <= 31 &&
            /^\d{1,2}$/.test(s) &&
            n === lastDay + 1
          ) {
            dayColMap[n] = ci;
            lastDay = n;
          } else if (s === "") {
            // Ignore empty cells (e.g., merged cells or formatting gaps)
            continue;
          } else if (lastDay > 0) {
            // The sequence broke on non-empty non-matching content — stop scanning
            break;
          }
        }
      }
    }
  }

  const dayHeaderRowIdx = dayNumRowIdx !== -1 ? dayNumRowIdx : empHeaderRowIdx;

  // If monthly matrix grid detected:
  if (empIdColIdx !== -1 && Object.keys(dayColMap).length >= 5) {
    const result = [];
    const dataRows = rows.slice(dayHeaderRowIdx + 1);

    dataRows.forEach((row) => {
      if (!row || row.length === 0) return;

      let rowECode = (row[empIdColIdx] || "").trim().toUpperCase();

      // If empIdColIdx didn't contain an ecode directly, scan first 5 cells for ECode pattern
      if (!rowECode || !rowECode.match(/^E?\d+/i)) {
        for (let c = 0; c < Math.min(5, row.length); c++) {
          const val = String(row[c] || "")
            .trim()
            .toUpperCase();
          const match = val.match(/(E\d{4,6})/);
          if (match) {
            rowECode = match[1];
            break;
          }
        }
      }

      if (!rowECode) return;

      // Filter strictly by logged-in user unless management with no filter
      if (targetECode && rowECode !== targetECode) {
        return;
      }

      let empName =
        empNameColIdx !== -1 ? (row[empNameColIdx] || "").trim() : "";
      if (!empName && row[3]) {
        empName = String(row[3]).trim();
      }

      Object.entries(dayColMap).forEach(([dayNumStr, colIdx]) => {
        const dayNum = parseInt(dayNumStr, 10);
        const rawVal = row[colIdx];
        const cellVal = rawVal != null ? String(rawVal).trim() : "";

        // ── Skip empty/unmarked days — only push records with an actual status ──
        if (cellVal === "" || cellVal === "--" || cellVal === "-") return;

        const dateStr = `${gridYear}-${String(gridMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

        const upperVal = cellVal.toUpperCase();
        let status = cellVal; // Default: show raw value if unrecognised

        if (["DO", "P", "PRESENT"].includes(upperVal)) {
          status = "Present";
        } else if (["HO", "HOLIDAY", "H"].includes(upperVal)) {
          status = "Holiday";
        } else if (["OS", "OUTSTATION"].includes(upperVal)) {
          status = "Outstation";
        } else if (["L", "LEAVE", "CL", "EL", "SL"].includes(upperVal)) {
          status = "Leave";
        } else if (["DE", "DEPUTATION", "DEP"].includes(upperVal)) {
          status = "Deputation";
        } else if (["HD", "HALF", "HALFDAY", "HALF DAY"].includes(upperVal)) {
          status = "Half Day";
        } else if (["AB", "A", "ABSENT"].includes(upperVal)) {
          status = "Absent";
        } else if (
          ["CO", "COMPOFF", "COMP-OFF", "COMP OFF"].includes(upperVal)
        ) {
          status = "Comp-Off";
        } else if (
          [
            "WO",
            "OFF",
            "WEEKOFF",
            "WEEK OFF",
            "WH",
            "WK OFF",
            "WKOFF",
          ].includes(upperVal)
        ) {
          status = "Week Off";
        } else if (!isNaN(parseFloat(cellVal)) && isFinite(cellVal)) {
          // Numbers represent daily working hours logged — treat as Present
          status = "Present";
        }

        result.push({
          ecode: rowECode,
          employeeName: empName,
          date: dateStr,
          loginTime: "--",
          logoutTime: "--",
          status: status,
          workingHours:
            !isNaN(parseFloat(cellVal)) && isFinite(cellVal) ? cellVal : "",
        });
      });
    });

    // Sort by date ascending
    result.sort((a, b) => a.date.localeCompare(b.date));

    // Filter by requested month/year if provided, otherwise return all from the sheet's month
    return result.filter((r) => {
      const rDate = new Date(r.date);
      if (isNaN(rDate.getTime())) return true;
      const rMonth = rDate.getMonth() + 1;
      const rYear = rDate.getFullYear();
      if (filterMonth && filterYear) {
        return rMonth === filterMonth && rYear === filterYear;
      }
      return rMonth === gridMonth && rYear === gridYear;
    });
  }

  // 2. Standard row-by-row format parsing (Form responses 1 or log table)
  let headerRowIndex = -1;
  let colIndexMap = {};

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const mapCandidate = {};
    row.forEach((cell, cIdx) => {
      const norm = normalizeHeader(cell);
      if (!norm) return;

      for (const [canonicalKey, aliases] of Object.entries(
        ATTENDANCE_HEADER_MAP,
      )) {
        if (aliases.includes(norm) && !(canonicalKey in mapCandidate)) {
          mapCandidate[canonicalKey] = cIdx;
        }
      }
    });

    if ("ecode" in mapCandidate && "date" in mapCandidate) {
      headerRowIndex = r;
      colIndexMap = mapCandidate;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.error(
      "[GoogleSheets] Attendance sheet header row not found (requires ECode/Emp ID and Date headers).",
    );
    return [];
  }

  const dataRows = rows.slice(headerRowIndex + 1);

  const result = [];
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;

    const rowECode =
      colIndexMap.ecode != null
        ? (row[colIndexMap.ecode] || "").trim().toUpperCase()
        : "";

    if (!rowECode) return;

    if (targetECode && rowECode !== targetECode) {
      return;
    }

    const rawDate =
      colIndexMap.date != null ? (row[colIndexMap.date] || "").trim() : "";

    // Filter by requested month/year if provided
    if (rawDate && filterMonth && filterYear) {
      const dParsed = new Date(rawDate);
      if (!isNaN(dParsed.getTime())) {
        if (
          dParsed.getFullYear() !== filterYear ||
          dParsed.getMonth() + 1 !== filterMonth
        ) {
          return;
        }
      }
    }

    const att = {
      ecode: rowECode,
      employeeName:
        colIndexMap.employeeName != null
          ? (row[colIndexMap.employeeName] || "").trim()
          : "",
      date: rawDate,
      loginTime:
        colIndexMap.loginTime != null
          ? (row[colIndexMap.loginTime] || "").trim()
          : "--",
      logoutTime:
        colIndexMap.logoutTime != null
          ? (row[colIndexMap.logoutTime] || "").trim()
          : "--",
      status:
        colIndexMap.status != null
          ? (row[colIndexMap.status] || "Present").trim()
          : "Present",
      workingHours:
        colIndexMap.workingHours != null
          ? (row[colIndexMap.workingHours] || "").trim()
          : "",
    };

    result.push(att);
  });

  return result;
}

// Helper function to stream Google Drive files directly via HTTP when Drive API is disabled
function streamFromGoogleDriveUrl(fileIdOrUrl) {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const http = require("http");

    function makeRequest(targetUrl, redirects = 0) {
      if (redirects > 5) {
        return reject(
          new Error("Too many redirects while downloading PDF file."),
        );
      }

      const parsedUrl = new URL(targetUrl);
      const protocol = parsedUrl.protocol === "https:" ? https : http;

      const req = protocol.get(
        targetUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          },
        },
        (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith("/")) {
              redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
            }
            return makeRequest(redirectUrl, redirects + 1);
          }

          if (res.statusCode !== 200) {
            return reject(
              new Error(
                `Failed to download PDF (HTTP Status ${res.statusCode}).`,
              ),
            );
          }

          resolve(res);
        },
      );

      req.on("error", (err) => reject(err));
    }

    let downloadUrl = fileIdOrUrl;
    if (
      !fileIdOrUrl.startsWith("http://") &&
      !fileIdOrUrl.startsWith("https:")
    ) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileIdOrUrl}`;
    }

    makeRequest(downloadUrl);
  });
}

/**
 * Downloads a PDF securely from Google Drive using a Work Order's File URL.
 * Validates that the work order belongs to the user before accessing.
 */
async function downloadWorkOrderPdf(
  id,
  kcodeFilter = null,
  isManagement = false,
  emailFilter = null,
) {
  const workOrders = await getWorkOrdersData(
    kcodeFilter,
    isManagement,
    emailFilter,
  );

  const wo = workOrders.find((w) => w.id === id || w.jobNo === id);
  if (!wo) {
    throw new Error(
      "Work order not found or you do not have permission to access it.",
    );
  }

  if (!wo.fileUrl) {
    throw new Error(
      "PDF is not available for this work order (Missing File URL).",
    );
  }

  // Extract Google Drive File ID or use direct link
  let fileId = null;
  if (wo.fileUrl) {
    const dMatch = wo.fileUrl.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (dMatch) {
      fileId = dMatch[1];
    } else {
      const idMatch = wo.fileUrl.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
      if (idMatch) {
        fileId = idMatch[1];
      } else if (/^[a-zA-Z0-9_-]{25,}$/.test(wo.fileUrl.trim())) {
        fileId = wo.fileUrl.trim();
      }
    }
  }

  const defaultFileName = wo.fileName || `${wo.jobNo || "WorkOrder"}.pdf`;

  // First, try Google Drive API if available
  if (
    fileId &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    try {
      const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n",
      );
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      const drive = google.drive({ version: "v3", auth });
      const response = await drive.files.get(
        { fileId: fileId, alt: "media" },
        { responseType: "stream" },
      );

      return {
        stream: response.data,
        fileName: defaultFileName,
      };
    } catch (error) {
      console.warn(
        "[GoogleDrive] Drive API attempt failed, falling back to direct HTTP stream:",
        error.message,
      );
    }
  }

  // Fallback: Direct HTTP stream (works for shared/public Google Drive links or direct file links)
  try {
    const stream = await streamFromGoogleDriveUrl(fileId || wo.fileUrl);
    return {
      stream,
      fileName: defaultFileName,
    };
  } catch (fallbackError) {
    console.error(
      "[GoogleDrive] Fallback download error:",
      fallbackError.message,
    );
    throw new Error(
      "Unable to download PDF file. Please verify the file link in Google Drive.",
    );
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  normalizeHeader,
  resolveField,
  findNocRequestHeader,
  buildNocRequestRow,
  getSheetData,
  getSheetDataByName,
  getSheetStructure,
  findKCodeUser,
  findECodeUser,
  lookupEmployeeProfile,
  updateKCodePassword,
  appendNocRequest,
  getWorkOrdersData,
  getAttendanceData,
  downloadWorkOrderPdf,
  invalidateCache: () => {},
};
