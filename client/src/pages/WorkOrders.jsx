import React, { useEffect, useState } from 'react';
import { ClipboardList, Search, FileDown, Eye, Filter, AlertCircle } from 'lucide-react';
import { workOrderService } from '../services/workOrderService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  
  const { role, user } = useAuth();
  const isAdminOrManager = ['Admin', 'Manager'].includes(role);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setLoading(true);
        // We do not need to pass kcodeFilter if we just want the default behavior
        // (default behavior: backend uses JWT kcode for employees, returns all for managers)
        const data = await workOrderService.getWorkOrders();
        if (data.success) {
          setWorkOrders(data.workOrders);
        } else {
          setError(data.message || 'Failed to fetch work orders');
        }
      } catch (err) {
        console.error('Error fetching work orders:', err);
        setError('Error loading work orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  const filteredOrders = workOrders.filter(wo => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (wo.jobNo && wo.jobNo.toLowerCase().includes(term)) ||
      (wo.fileName && wo.fileName.toLowerCase().includes(term)) ||
      (wo.type && wo.type.toLowerCase().includes(term)) ||
      (wo.engineerName && wo.engineerName.toLowerCase().includes(term)) ||
      (wo.scCode && wo.scCode.toLowerCase().includes(term))
    );
  });

  const handleDownload = async (wo) => {
    if (downloadingId || viewingId) return; // Prevent multiple clicks
    
    try {
      setDownloadError(null);
      setDownloadingId(wo.id);
      await workOrderService.downloadWorkOrderPdf(wo.id, wo.fileName);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setDownloadError(
        err.response?.data?.message || err.message || 'Unable to download PDF at this time.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (wo) => {
    if (viewingId || downloadingId) return; // Prevent multiple clicks

    try {
      setDownloadError(null);
      setViewingId(wo.id);
      await workOrderService.viewWorkOrderPdf(wo.id);
    } catch (err) {
      console.error('Failed to view PDF:', err);
      setDownloadError(
        err.response?.data?.message || err.message || 'Unable to view PDF at this time.'
      );
    } finally {
      setViewingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Work Orders..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
            <ClipboardList className="w-6 h-6 text-sky-600" />
            Work Orders
            <span className="ml-2 px-3 py-1 bg-sky-100 text-sky-800 border border-sky-200 text-xs font-extrabold rounded-full shadow-sm">
              Total Jobs: {workOrders.length}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdminOrManager 
              ? `Manage and track all ${workOrders.length} employee work orders.` 
              : `View and track your ${workOrders.length} assigned work orders.`}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {downloadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {downloadError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
            placeholder="Search by ID, Customer, Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Job No
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Engineer Name
                </th>
                {isAdminOrManager && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    S/c Code
                  </th>
                )}
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={order.id || index} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {order.jobNo || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 break-all max-w-xs">
                      {order.fileName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {order.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {order.engineerName || '-'}
                    </td>
                    {isAdminOrManager && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600">
                        {order.scCode || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleView(order)}
                          disabled={viewingId === order.id || downloadingId === order.id || !order.fileUrl}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            viewingId === order.id
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                              : !order.fileUrl
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title="View PDF in new tab"
                        >
                          <Eye className={`w-4 h-4 ${viewingId === order.id ? 'animate-pulse' : ''}`} />
                          {viewingId === order.id ? 'Opening...' : 'View PDF'}
                        </button>
                        <button 
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order.id || viewingId === order.id || !order.fileUrl}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            downloadingId === order.id
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                              : !order.fileUrl
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                              : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                          }`}
                          title="Download PDF file"
                        >
                          <FileDown className={`w-4 h-4 ${downloadingId === order.id ? 'animate-pulse' : ''}`} />
                          {downloadingId === order.id ? 'Downloading...' : 'Download PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdminOrManager ? 6 : 5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No work orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
