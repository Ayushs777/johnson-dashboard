import React from "react";

const ModulePlaceholder = ({ title }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6">
    <h1 className="text-xl font-bold text-slate-900">{title}</h1>
    <p className="mt-2 text-sm text-slate-600">
      This module is not implemented yet.
    </p>
  </section>
);

export default ModulePlaceholder;
