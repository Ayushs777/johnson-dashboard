import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'sky', trend, trendText, onClick }) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200 ${
        onClick ? 'cursor-pointer hover:border-sky-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.sky}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-100 text-emerald-800'
                : trend === 'down'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            ) : null}
            {trendText}
          </span>
        )}
      </div>

      {trendText && !trend && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{trendText}</p>
      )}
    </div>
  );
};

export default StatCard;
