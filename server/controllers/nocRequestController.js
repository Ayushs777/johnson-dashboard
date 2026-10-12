"use strict";

const { appendNocRequest } = require("../services/googleSheetsService");

const submitNocRequest = async (req, res) => {
  const body = req.body || {};
  const email = String(body.email || "").trim();
  const jobNo = String(body.jobNo || "").trim();
  const jobName = String(body.jobName || "").trim();
  const currentStatus = String(body.currentStatus || "").trim();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !jobNo ||
    jobNo.length > 100 ||
    !jobName ||
    jobName.length > 200 ||
    !currentStatus ||
    currentStatus.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email, job number, job name, and current status.",
    });
  }

  try {
    await appendNocRequest({ email, jobNo, jobName, currentStatus });
    return res.status(201).json({
      success: true,
      message: "NOC Request submitted successfully.",
    });
  } catch (err) {
    console.error("[NOC Request] Submission failed:", err.message);
    return res.status(503).json({
      success: false,
      message:
        err.message === "NOC Request Google Sheet is not configured."
          ? "NOC Request submissions are not configured. Contact the administrator."
          : err.message,
    });
  }
};

module.exports = { submitNocRequest };
