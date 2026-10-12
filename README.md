# Johnson Lifts & Escalators — Operations & Data Management Portal

A full-stack, enterprise-grade Operations Dashboard for **Johnson Lifts & Escalators**. Built with **React, Vite, Tailwind CSS, Node.js, Express.js, and MongoDB Atlas**.

---

## 🏗️ Application Architecture

```text
React Frontend (Vite + Tailwind CSS + Recharts)
                      │
                      │ Axios REST API (JWT Bearer Auth)
                      ▼
        Node.js + Express Backend Server
               │                  │
               │ Mongoose ODM     │ googleapis (service account)
               ▼                  ▼
        MongoDB Atlas DB     Google Sheets API
        (app/admin data,          │
         KCode auth metadata)     ▼
                              Google Sheet
                          (KCode credentials —
                           source of truth)
```

---

## 🚀 Key Features

- **Dual Authentication:** Admin accounts via MongoDB + employee KCode/ECode login via Google Sheets.
- **Code-user Access:** KCode permissions remain separate from ECode department permissions. ECode users receive modules from their verified employee department.
- **Work Orders & Attendance:** KCode employees see Work Orders filtered by KCode. Authorized ECode users see only Work Orders matching their verified employee email; Attendance remains filtered to the signed-in ECode.
- **NOC Requests:** Authorized users can submit job details directly to a dedicated Google Sheet.
- **First-Login Password Change:** New KCode users are forced to set a personal password before accessing any page.
- **Dynamic Header Detection:** The backend scans the sheet to find the header row and column positions automatically. Column order and row location do not matter.
- **Password Write-Back:** When a user changes their password the backend writes it back to the exact cell in the Google Sheet.
- **Admin Password Reset:** Admins can reset a KCode user's temporary password, forcing another password change on next login.
- **Role-Based Access Control (RBAC):** Admin, Manager, Employee, and Viewer roles with filtered navigation and restricted APIs.
- **Dashboard Overview:** 6 real-time stat cards, Quick Access grid, SLA alerts, and recent complaint activity.
- **User Management (Admin Only):** Complete CRUD for administrative accounts, role privileges, and status toggles.
- **Customer Management, Installation Tracking, Service & Maintenance, Complaint Tickets** — complete operational modules.
- **Analytics & Reports:** Recharts visual graphs, CSV export, print.
- **In-App Notifications, Profile & Settings.**

---

## 🔑 Authentication Overview

### Admin Login (MongoDB-backed)

Click **"Sign in as Admin"** on the login page.

| Role      | User ID | Password   | Access                        |
| :-------- | :------ | :--------- | :---------------------------- |
| **Admin** | `admin` | `admin123` | Full access + User Management |

### Employee KCode / ECode Login (Google Sheets-backed)

Normal employees enter their **KCode** or **ECode** and **Password** on the login page.  
Credentials and data are maintained by the administrator in a Google Sheet — **no MongoDB account is required**.

**Example Google Sheet layout (KCode / Login tab)** (column order does NOT matter):

| Name  | Status | Role      | Password | KCode  | ECode |
| ----- | ------ | --------- | -------- | ------ | ----- |
| Rahul | Active | Employee  | test123  | KJ1001 |       |
| Amit  | Active | Manager   | abc456   | KJ1002 |       |
| Priya | Active | ECodeUser | pass789  |        | EC001 |

> The above shows headers in a **non-standard order** on purpose. The backend detects them automatically.

**KCode / ECode format rules:**

- Alphanumeric only (e.g. `KJ1001`, `EC001`, `JLX2026`)
- No spaces, dashes, or special characters
- Case-insensitive input — backend normalises to UPPERCASE

**ECode Access:** ECode permissions are loaded from the header-driven employee record and are checked by both the frontend and backend. Unknown departments receive Attendance only and see an access-not-configured message.

| Authentication / Department | Approved modules                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| KCode                       | Dashboard, Work Order, Employee Details                                                                                     |
| ECode: EREC / OPR           | Dashboard, Work Order, Attendance, Quality Reports, NOC Request, Extra Work Request, Advance Request, Customer Work Details |
| ECode: TESTING              | Dashboard, Attendance, Advance Request                                                                                      |
| ECode: ESPD                 | Dashboard, Attendance, Advance Request, Customer Work Details                                                               |

Extra Work Request embeds the supplied Google Form. Its submission history, completion counts, and elapsed times require the form's response spreadsheet and completion-status data to be connected. Advance Request is available to all configured ECode department groups; its form workflow is not connected yet. Quality Reports and Customer Work Details remain access-controlled placeholders. Protected APIs return `403 Forbidden` for code users without the corresponding permission.

---

## 🔄 Dynamic Google Sheet Detection

### Header Row

The header row can be **anywhere** in the sheet. The backend scans from top to bottom and finds the first row containing all three required headers: **KCode**, **Password**, **Status**.

Example where headers are on row 4 (rows 1–3 are title/notes — fully supported):

```
Row 1: Johnson Lifts & Escalators
Row 2: Employee Credentials — Last Updated Sep 2026
Row 3: (blank)
Row 4: Name | Department | Password | KCode | Status | Role   ← header row detected
Row 5: Rahul | Operations | test123 | KJ1001 | Active | Employee
```

### Column Order

Columns can be in **any order**. All of these sheet layouts work identically:

**Layout A** (standard):

```
KCode | Password | Name | Role | Status
```

**Layout B** (reordered):

```
Name | Status | Password | Role | KCode
```

**Layout C** (with extra columns):

```
Role | Department | KCode | Password | Status | Name | Email
```

The backend maps headers using normalised aliases, e.g.:

- `"K Code"`, `"k-code"`, `"KCODE"`, `"Employee KCode"` → all recognised as KCode
- `"Pass Word"`, `"LOGIN PASSWORD"`, `"pwd"` → all recognised as Password

### Required vs Optional Headers (Login Sheet)

| Header        | Required? | Fallback if missing        |
| ------------- | --------- | -------------------------- |
| KCode / ECode | ✅ Yes    | — (config error)           |
| Password      | ✅ Yes    | — (config error)           |
| Status        | ✅ Yes    | — (config error)           |
| Name          | Optional  | KCode used as display name |
| Role          | Optional  | Defaults to `Employee`     |
| Department    | Optional  | Ignored                    |
| Email         | Optional  | Ignored                    |

---

## 🏗️ Header-Driven Architecture

This application uses a strict **header-driven approach**, meaning **column positions do not matter**. The backend does not use fixed indexes (e.g. `row[0]`, `row[1]`).
Instead, it scans the sheets row by row until it identifies the necessary headers, then dynamically maps the columns.

- The **header row can be anywhere** (e.g., Row 1 or Row 5).
- **Columns can be reordered** freely.
- **Header Aliases** are supported (e.g., `S/c Code` or `kcode` or `service code` all map to the same field because the system normalises them by removing spaces, hyphens, and ignoring case).

---

## 🛠️ Work Orders (ALL_WO Sheet)

The Work Orders page uses the **ALL_WO** sheet in the same Google Spreadsheet.
This sheet maintains PDF Work Order links.

**Required Columns:**

1. `File Name`
2. `File URL`
3. `Job No`
4. `S/c Code`

**Optional Columns:**

- `Folder Path`
- `Type`
- `Engineer Name`
- `S/c Email ID`

> **Note:** If any of the required columns are missing, the backend will return a safe configuration error without exposing data.

### 🔒 Work Order Filtering & PDF Download Security

- **Server-Side Filtering:** The `S/c Code` in the sheet is matched against the authenticated user's `KCode` (from the JWT). The user **never** sees another KCode's work orders.
- **Secure PDF Download:** The `File URL` column contains Google Drive links. The backend securely acts as a proxy:
  1. The user clicks "Download".
  2. The backend verifies the requested Work Order actually belongs to the user.
  3. The backend extracts the Google Drive File ID.
  4. The backend streams the PDF to the user.
- **Google Drive Permissions:** To enable PDF downloads, the Google Service Account used for Google Sheets must also be granted **Viewer** access to the Google Drive folders/files where the PDFs are stored, and the Google Drive API must be enabled in the Google Cloud Project.

---

## 🔐 First-Login Password Change Flow

```text
New user added to Google Sheet:
KJ1005 | temp123 | Rahul | Employee | Active

User logs in with KJ1005 / temp123
            │
            ▼
  Backend checks MongoDB KCodeAuthMeta
            │
  No record found → firstLogin = true
            │
            ▼
  JWT issued with { firstLogin: true }
            │
            ▼
  Frontend redirects → /change-password
  (all other routes are blocked until complete)
            │
  User enters:
    Current Password: temp123
    New Password:     Rahul@2026
    Confirm:          Rahul@2026
            │
            ▼
  Backend:
   1. Verifies current password against Sheet
   2. Validates new password (min 8 chars, not same as old)
   3. Writes Rahul@2026 to the correct Sheet cell  ← atomically first
   4. Updates MongoDB: firstLoginCompleted = true
   5. Returns fresh JWT with { firstLogin: false }
            │
            ▼
  User redirected → /dashboard
  (next login goes straight to dashboard)
```

**Dashboard bypass prevention:** If a user with `firstLogin: true` manually navigates to `/dashboard` or any other route, `ProtectedRoute` redirects them back to `/change-password`. The backend also enforces this.

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Prerequisites

- Node.js v18+
- Local MongoDB **or** MongoDB Atlas URI
- Google Cloud project with Sheets API enabled (see below)

### 2. Configure Backend Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/johnson_lifts_dashboard
JWT_SECRET=johnson_lifts_secret_jwt_key_2026_super_secure
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173

GOOGLE_SHEET_ID=<your-sheet-id>
GOOGLE_SHEET_NAME=Sheet1
GOOGLE_NOC_REQUEST_SHEET_ID=<your-noc-request-sheet-id>
GOOGLE_NOC_REQUEST_SHEET_NAME=Sheet1
GOOGLE_SERVICE_ACCOUNT_EMAIL=<your-service-account@project.iam.gserviceaccount.com>
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

NOC Request submissions locate `Timestamp`, `Email Address`, `Job No`, `Job Name`, and `Current Status` dynamically, then write those values under the matching headers regardless of header-row or column order. Other columns are left blank. Share the spreadsheet with the service account as an **Editor**.

> ⚠️ **Do NOT set `GOOGLE_SHEET_RANGE`** — column positions are discovered dynamically. That variable is no longer used.

### 3. Start Backend Server

```bash
cd server
npm run dev
```

Backend: `http://localhost:5000`

### 4. Start Frontend Client

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`

---

## ☁️ Google Cloud & Google Sheets Setup

### Step 1 — Create / Select a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g. _Johnson Lifts Portal_) or select an existing one.

### Step 2 — Enable the Google Sheets API

1. In the Cloud Console, go to **APIs & Services → Library**.
2. Search for **Google Sheets API** and click **Enable**.

### Step 3 — Create a Service Account

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → Service Account**.
3. Give it a name (e.g. `johnson-sheets-reader`) and click **Create and Continue**.
4. No special IAM roles are needed (access is controlled by sheet sharing). Click **Done**.

### Step 4 — Create a Private Key

1. Click the service account you just created.
2. Go to the **Keys** tab → **Add Key → Create new key → JSON**.
3. A JSON file downloads — **keep it secure, never commit it to Git**.
4. Copy the values into `server/.env`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` → `client_email` field in the JSON
   - `GOOGLE_PRIVATE_KEY` → `private_key` field (keep `\n` as literal characters, wrap in double quotes)

### Step 5 — Prepare the Google Sheet

Create a Google Sheet. **Column order and header row position do not matter.** The system finds them automatically. The only requirement is that the sheet contains columns named KCode, Password, and Status (with flexible spelling — see aliases above).

Example (headers on row 4, non-standard column order — fully supported):

| (Row 1)  | Johnson Lifts & Escalators |              |           |            |          |
| -------- | -------------------------- | ------------ | --------- | ---------- | -------- |
| (Row 2)  | Credentials — Sep 2026     |              |           |            |          |
| (Row 3)  |                            |              |           |            |          |
| **Name** | **Department**             | **Password** | **KCode** | **Status** | **Role** |
| Rahul    | Operations                 | test123      | KJ1001    | Active     | Employee |
| Amit     | Operations                 | abc456       | KJ1002    | Active     | Manager  |

### Step 6 — Share the Sheet with the Service Account — **Editor Permission Required**

> ⚠️ **IMPORTANT:** The service account must have **Editor** access, NOT Viewer.  
> The application writes updated passwords back to the Sheet when users change their passwords.  
> Viewer access will cause password changes to fail with a permissions error.

1. Open the Google Sheet.
2. Click **Share**.
3. Paste the service account email (e.g. `johnson-sheets-reader@project.iam.gserviceaccount.com`).
4. Set permission to **Editor**.
5. Click **Send**.

### Step 7 — Add the Sheet ID to .env

The Sheet ID is the long string in the URL:

```
https://docs.google.com/spreadsheets/d/  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms  /edit
```

```env
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SHEET_NAME=Sheet1
```

### Step 8 — Restart Backend

```bash
cd server
npm run dev
```

---

## 🔄 Adding a New Employee (Zero-Downtime)

1. Open the Google Sheet.
2. Add a new row anywhere in the data area, e.g.:  
   `KJ1006 | temppass99 | New Employee | Employee | Active`
3. The employee can log in **immediately** — no backend restart, no code change, no MongoDB update needed.
4. On first login they will be redirected to change their password.

> The authentication system fetches **live data on every login** — there is no cache for authentication.

---

## 🔑 Admin Password Reset

An Admin can reset a KCode user's password without touching the Google Sheet manually:

**Endpoint:** `POST /api/auth/admin/reset-kcode-password`  
**Auth:** Admin JWT required

```json
{
  "kcode": "KJ1001",
  "newPassword": "Temporary@123"
}
```

This will:

1. Write the temporary password to the correct cell in the Google Sheet.
2. Set `firstLoginCompleted = false` in MongoDB so the user must change the temporary password on next login.

---

## 📋 Full Authentication Flow

```text
User enters KCode + Password
          │
          ▼
   POST /api/auth/kcode-login
          │
          ▼  (live Sheet read — no cache)
   Dynamic header detection:
    • Scan rows to find header row
    • Map columns by name aliases
          │
          ▼
   Find KCode row
          │
     ┌────┴────┐
   Found     Not Found
     │           │
     ▼           ▼
 Check Status  "Invalid KCode or password"
     │
  Active? ──No──▶ "This account is inactive…"
     │
     ▼
 Verify Password ──No──▶ "Invalid KCode or password"
     │
     ▼
 Check MongoDB KCodeAuthMeta
     │
  firstLoginCompleted?
  No (or no record) ──▶ Create/mark meta { firstLogin: true }
     │                        │
     │                        ▼
     │              JWT { firstLogin: true }
     │                        │
     │              Frontend → /change-password
     │
  Yes ──▶ JWT { firstLogin: false }
              │
              ▼
      Frontend → /dashboard
```

---

## 📦 API Endpoints (Auth)

| Method | Route                                  | Auth            | Description                                  |
| ------ | -------------------------------------- | --------------- | -------------------------------------------- |
| `POST` | `/api/auth/login`                      | Public          | MongoDB admin login                          |
| `POST` | `/api/auth/kcode-login`                | Public          | KCode (Sheet) login                          |
| `POST` | `/api/auth/ecode-login`                | Public          | ECode (Sheet) login                          |
| `GET`  | `/api/auth/me`                         | JWT             | Current user profile                         |
| `POST` | `/api/auth/kcode-change-password`      | KCode JWT       | Change KCode user password (writes to Sheet) |
| `PUT`  | `/api/auth/change-password`            | JWT             | MongoDB user password change                 |
| `POST` | `/api/auth/admin/reset-kcode-password` | Admin JWT       | Admin reset KCode temporary password         |
| `GET`  | `/api/work-orders`                     | KCode/Admin JWT | Google Sheets backed KCode Work Orders       |
| `GET`  | `/api/attendance`                      | ECode/Admin JWT | Google Sheets backed ECode Attendance        |
| `POST` | `/api/noc-requests`                    | NOC Request permission | Appends a NOC Request row to Google Sheets |

---

## 🗄️ MongoDB Models

### `KCodeAuthMeta` (new)

Stores **only authentication metadata** for KCode users. **Does not store passwords.**

```js
{
  kcode:                String,   // KJ1001 — unique, uppercase
  firstLoginCompleted:  Boolean,  // false = must change password
  passwordChangedAt:    Date,     // timestamp of last password change
  createdAt:            Date,
  updatedAt:            Date
}
```

> Google Sheet remains the source of truth for KCode, Password, Status, Name, and Role.  
> MongoDB `KCodeAuthMeta` only tracks whether the first-login flow has been completed.

---

## ☁️ MongoDB Atlas Deployment

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database Cluster.
3. Under **Database Access**, create a user with readWrite permissions.
4. Under **Network Access**, add `0.0.0.0/0` (or your server IP).
5. Copy the connection string into `server/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/johnson_lifts_dashboard?retryWrites=true&w=majority
   ```
6. Restart the backend.

---

## 🛡️ Security Considerations

- **Passwords** from the Google Sheet are **never** logged, sent to the client, stored in JWTs, or included in error messages.
- **Plain-text passwords in Google Sheets are a security risk.** This is a deliberate business requirement so that administrators can manage user passwords directly in the Sheet. Access to the Sheet should be strictly limited to authorised administrators.
- **Google service-account credentials** live only in `server/.env` — never commit this file. Add `.env` to `.gitignore`.
- The service account key grants write access to the Sheet — protect it accordingly.
- The **React frontend** never contacts Google Sheets or MongoDB directly.
- **Rate limiting** is applied to all auth endpoints: 10 attempts/15 min for KCode login, 20 attempts/15 min for password change/reset.
- **KCode validation** rejects any input containing spaces, dashes, or special characters before hitting the Google API.
- Duplicate KCodes in the Sheet cause a safe configuration error — login is blocked until the Sheet is corrected.

---

## 📦 Dependencies

```bash
# Backend
npm install googleapis   # Google Sheets API (already installed)

# No new frontend packages required
```
