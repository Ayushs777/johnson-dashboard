import React from "react";
import { Clock3 } from "lucide-react";

const AdvanceRequest = () => (
  <section className="rounded-lg border border-slate-200 bg-white p-6">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
        <Clock3 className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900">Advance Request</h1>
        <p className="mt-1 text-sm text-slate-600">
          Available to EREC / OPR, Testing, and ESPD departments.
        </p>
      </div>
    </div>
    <p className="mt-5 text-sm text-slate-600">
      The advance request form has not been connected yet.
    </p>
  </section>
);

export default AdvanceRequest;
