import React, { useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { nocRequestService } from "../services/nocRequestService";

const inputClassName =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const NocRequest = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || "",
    jobNo: "",
    jobName: "",
    currentStatus: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await nocRequestService.submit(form);
      setFeedback({ type: "success", message: response.message });
      setForm({
        email: user?.email || "",
        jobNo: "",
        jobName: "",
        currentStatus: "",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to submit your NOC Request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              EREC / OPR
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              NOC Request
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Enter the job details below. Your request will be recorded in the NOC
          Request Google Sheet.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Email Address
            <input
              className={inputClassName}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={updateField}
              placeholder="name@company.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Job No
            <input
              className={inputClassName}
              type="text"
              name="jobNo"
              maxLength={100}
              value={form.jobNo}
              onChange={updateField}
              placeholder="e.g. L-A1234"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Job Name
            <input
              className={inputClassName}
              type="text"
              name="jobName"
              maxLength={200}
              value={form.jobName}
              onChange={updateField}
              placeholder="Enter the job or customer name"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Current Status
            <input
              className={inputClassName}
              type="text"
              name="currentStatus"
              maxLength={100}
              value={form.currentStatus}
              onChange={updateField}
              placeholder="Enter the current job status"
              required
            />
          </label>
        </div>

        <p className="text-xs text-slate-500">
          Submission timestamp is added automatically.
        </p>

        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" && (
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default NocRequest;
