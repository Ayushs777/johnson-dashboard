const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");
const installationRoutes = require("./routes/installationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const workOrderRoutes = require("./routes/workOrderRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const employeeDetailsRoutes = require("./routes/employeeDetailsRoutes");
const nocRequestRoutes = require("./routes/nocRequestRoutes");
const { createFutureModuleRouter } = require("./routes/futureModuleRoutes");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl) or matching allowed origin
      if (!origin || origin === allowedOrigin || origin.includes("localhost")) {
        callback(null, true);
      } else {
        callback(null, true); // flexible in local dev
      }
    },
    credentials: true,
  }),
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General auth rate limiter (100 req / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for KCode login (10 attempts / 15 min per IP)
const kcodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message:
      "Too many KCode login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for ECode login (10 attempts / 15 min per IP)
const ecodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message:
      "Too many ECode login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password-change / admin-reset endpoints (20 attempts / 15 min)
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message:
      "Too many password-change attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use("/api/auth/kcode-login", kcodeLimiter); // strict limit for KCode auth
app.use("/api/auth/ecode-login", ecodeLimiter); // strict limit for ECode auth
app.use("/api/auth/kcode-change-password", changePasswordLimiter);
app.use("/api/auth/admin/reset-kcode-password", changePasswordLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/installations", installationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/employee-details", employeeDetailsRoutes);
app.use(
  "/api/quality-reports",
  createFutureModuleRouter("qualityReports", "Quality Reports"),
);
app.use("/api/noc-requests", nocRequestRoutes);
app.use(
  "/api/work-order-requests",
  createFutureModuleRouter("workOrderRequest", "Work Order Requests"),
);
app.use(
  "/api/customer-work-details",
  createFutureModuleRouter("customerWorkDetails", "Customer Work Details"),
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Johnson Lifts & Escalators API Server is running smoothly.",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for undefined routes
app.use((req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const seedDatabase = require("./seed/seedAdmin");

// Start Express server immediately — don't block on MongoDB
// MongoDB is only needed for Admin login. KCode/ECode login uses Google Sheets.
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`  Johnson Lifts & Escalators Portal Backend Running   `);
  console.log(`  Port: ${PORT}                                       `);
  console.log(`  API Base: http://localhost:${PORT}/api              `);
  console.log(`  Client Origin: ${allowedOrigin}                     `);
  console.log(`=======================================================`);

  // Attempt MongoDB connection in background (non-blocking)
  try {
    const dbConn = await connectDB();
    if (dbConn) {
      await seedDatabase();
    } else {
      console.warn(
        "[Server] MongoDB unavailable — Admin login disabled. KCode/ECode login via Google Sheets is fully operational.",
      );
    }
  } catch (err) {
    console.warn("[Server] MongoDB setup failed:", err.message);
    console.warn(
      "[Server] KCode/ECode login via Google Sheets remains fully operational.",
    );
  }
});

// Handle port-in-use gracefully (e.g. during rapid nodemon restarts)
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[Server] Port ${PORT} is already in use. Retrying in 2 seconds...`,
    );
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 2000);
  } else {
    throw err;
  }
});
