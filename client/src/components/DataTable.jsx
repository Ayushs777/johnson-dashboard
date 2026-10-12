import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  totalItems = 0,
  page = 1,
  limit = 20,
  onPageChange,
  onSearchChange,
  onFilterChange,
  filterOptions = [],
  activeFilter = 'All',
  onRefresh,
  onView,
  onEdit,
  onDelete,
  onExportCSV,
  title,
  subtitle,
  actions,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(searchTerm);
  };

  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  // Client-side sort if no server-side sorting specified
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          {title && <h2 className="text-xl font-bold text-slate-900 font-display">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Filters */}
          {filterOptions.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange && onFilterChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeFilter === opt.value
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        {loading ? (
          <LoadingSpinner text="Fetching operational data..." />
        ) : sortedData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-base font-semibold text-slate-600">No records found</p>
            <p className="text-xs mt-1">Try adjusting search parameters or active filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-6 py-3.5 ${col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.title}
                      {col.sortable && sortColumn === col.key && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                  </th>
                ))}
                {(onView || onEdit || onDelete) && (
                  <th className="px-6 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedData.map((row, idx) => (
                <tr key={row._id || idx} className="hover:bg-slate-50/60 transition">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-slate-800">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}

                  {(onView || onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            title="Edit Record"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (userRole === 'Admin' || userRole === 'Manager') && (
                          <button
                            onClick={() => onDelete(row)}
                            title="Delete Record"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange && onPageChange(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange && onPageChange(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
