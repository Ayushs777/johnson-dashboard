import React from "react";
import { ExternalLink, History, Timer } from "lucide-react";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdUrY7EqirDiwL7orsKt-bvMpG1Gn_-h2jQAySz0m641rNmQQ/viewform";

const ExtraWorkRequest = () => (
  <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          EREC / OPR
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Extra Work Request
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit an extra work request with its supporting PDF documents.
        </p>
      </div>
      <a
        href={FORM_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ExternalLink className="h-4 w-4" />
        Open form separately
      </a>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <History className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Request history</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Submission history and completed-request counts are not connected yet.
          Connect the form response spreadsheet to show verified records here.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Timer className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Completion time</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Request completion times will appear once response and completion
          status data are available.
        </p>
      </div>
    </div>

    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <iframe
        title="Extra work request form"
        src={`${FORM_URL}?embedded=true`}
        className="block h-[1100px] w-full border-0"
        loading="lazy"
      />
    </div>
  </section>
);

export default ExtraWorkRequest;
