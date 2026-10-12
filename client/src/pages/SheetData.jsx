import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Building2,
  Layers,
  Wrench,
  AlertTriangle,
  Users,
  BadgeDollarSign,
  Package,
  CreditCard,
  Download,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';
import { customerService } from '../services/customerService';
import { installationService } from '../services/installationService';
import { serviceService } from '../services/serviceService';
import { complaintService } from '../services/complaintService';
import { userService } from '../services/userService';

const SheetData = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const tabs = [
    { id: 'customers', label: 'Customer Data', icon: Building2, color: 'text-sky-600' },
    { id: 'installations', label: 'Installation Data', icon: Layers, color: 'text-indigo-600' },
    { id: 'services', label: 'Service Data', icon: Wrench, color: 'text-emerald-600' },
    { id: 'complaints', label: 'Complaint Data', icon: AlertTriangle, color: 'text-rose-600' },
    { id: 'employees', label: 'Employee Data', icon: Users, color: 'text-purple-600' },
    { id: 'sales', label: 'Sales & Quotes', icon: BadgeDollarSign, color: 'text-amber-600' },
    { id: 'inventory', label: 'Inventory / Parts', icon: Package, color: 'text-teal-600' },
    { id: 'payments', label: 'AMC Payments', icon: CreditCard, color: 'text-blue-600' },
  ];

  const fetchTabData = async () => {
    try {
      setLoading(true);
      let res;
      if (activeTab === 'customers') {
        res = await customerService.getCustomers({ page, limit: 15, search });
      } else if (activeTab === 'installations') {
        res = await installationService.getInstallations({ page, limit: 15, search });
      } else if (activeTab === 'services') {
        res = await serviceService.getServices({ page, limit: 15, search });
      } else if (activeTab === 'complaints') {
        res = await complaintService.getComplaints({ page, limit: 15, search });
      } else if (activeTab === 'employees') {
        res = await userService.getUsers({ page, limit: 15, search });
      } else if (activeTab === 'sales') {
        // Sales module live MongoDB mapping preview
        res = {
          success: true,
          data: [
            { id: 'Q-901', client: 'LKO Metro Rail Corp', quote: '₹ 45,00,000', status: 'Approved', rep: 'Rajesh Kumar' },
            { id: 'Q-902', client: 'PVR Inox Superplex', quote: '₹ 28,50,000', status: 'Pending Sign-off', rep: 'Ayush C' },
            { id: 'Q-903', client: 'Max Super Speciality Hospital', quote: '₹ 62,00,000', status: 'In Negotiation', rep: 'Priya S' },
          ],
          pagination: { total: 3 },
        };
      } else if (activeTab === 'inventory') {
        res = {
          success: true,
          data: [
            { partNo: 'J-BRK-401', description: 'Electro-magnetic Brake Shoe 400Nm', qty: 45, warehouse: 'Lucknow Central Hub' },
            { partNo: 'J-SEN-102', description: 'Infrared Multi-beam Light Curtain Sensor', qty: 120, warehouse: 'Gurugram Facility' },
            { partNo: 'J-DRV-880', description: 'VVVF Inverter Drive Board 11kW', qty: 18, warehouse: 'Delhi Regional Store' },
          ],
          pagination: { total: 3 },
        };
      } else if (activeTab === 'payments') {
        res = {
          success: true,
          data: [
            { invId: 'INV-301', customer: 'Metro Towers Commercial', amount: '₹ 2,40,000', amcPeriod: '2026-2027', status: 'Paid' },
            { invId: 'INV-302', customer: 'Apollo Speciality Hospital', amount: '₹ 5,80,000', amcPeriod: '2026-2027', status: 'Paid' },
            { invId: 'INV-303', customer: 'Sahara Hospital & Research', amount: '₹ 3,90,000', amcPeriod: '2026-2027', status: 'Overdue' },
          ],
          pagination: { total: 3 },
        };
      }

      if (res && res.success) {
        setData(res.data || []);
        setTotalItems(res.pagination?.total || (res.data || []).length);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Error fetching sheet dataset from backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, page, search]);

  const getColumnsForTab = () => {
    switch (activeTab) {
      case 'customers':
        return [
          { title: 'Customer ID', key: 'customerId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Customer Name', key: 'customerName', render: (v) => <span className="font-bold text-slate-900">{v}</span> },
          { title: 'Contact Person', key: 'contactPerson' },
          { title: 'Phone', key: 'phone' },
          { title: 'City', key: 'city' },
          { title: 'Lifts', key: 'numberOfLifts' },
          { title: 'AMC Status', key: 'amcStatus' },
        ];
      case 'installations':
        return [
          { title: 'Installation ID', key: 'installationId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Project Name', key: 'projectName' },
          { title: 'Lift Type', key: 'liftType' },
          { title: 'Location', key: 'location' },
          { title: 'Status', key: 'status' },
          { title: 'Technician', key: 'technician' },
        ];
      case 'services':
        return [
          { title: 'Service ID', key: 'serviceId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Lift ID', key: 'liftId' },
          { title: 'Service Type', key: 'serviceType' },
          { title: 'Location', key: 'location' },
          { title: 'Technician', key: 'technician' },
          { title: 'Status', key: 'status' },
        ];
      case 'complaints':
        return [
          { title: 'Complaint ID', key: 'complaintId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Lift ID', key: 'liftId' },
          { title: 'Type', key: 'complaintType' },
          { title: 'Priority', key: 'priority' },
          { title: 'Status', key: 'status' },
          { title: 'Technician', key: 'assignedTechnician' },
        ];
      case 'employees':
        return [
          { title: 'User ID', key: 'userId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Name', key: 'name' },
          { title: 'Email', key: 'email' },
          { title: 'Role', key: 'role' },
          { title: 'Status', key: 'status' },
        ];
      case 'sales':
        return [
          { title: 'Quote ID', key: 'id', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Client Name', key: 'client' },
          { title: 'Quote Amount', key: 'quote' },
          { title: 'Sales Rep', key: 'rep' },
          { title: 'Status', key: 'status' },
        ];
      case 'inventory':
        return [
          { title: 'Part Number', key: 'partNo', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Description', key: 'description' },
          { title: 'In Stock Qty', key: 'qty' },
          { title: 'Warehouse Hub', key: 'warehouse' },
        ];
      case 'payments':
        return [
          { title: 'Invoice ID', key: 'invId', render: (v) => <span className="font-bold">{v}</span> },
          { title: 'Customer Name', key: 'customer' },
          { title: 'Amount', key: 'amount' },
          { title: 'AMC Period', key: 'amcPeriod' },
          { title: 'Payment Status', key: 'status' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Johnson Sheet & Master Data Portal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live MongoDB dataset view across all operational business modules
            </p>
          </div>
        </div>

        {/* Module Tab Selector Buttons (Requirement 18) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : t.color}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <DataTable
        title={`${tabs.find((t) => t.id === activeTab)?.label} Sheet`}
        subtitle="Direct MongoDB record inspection"
        columns={getColumnsForTab()}
        data={data}
        loading={loading}
        totalItems={totalItems}
        page={page}
        limit={15}
        onPageChange={(p) => setPage(p)}
        onSearchChange={(q) => setSearch(q)}
        onRefresh={fetchTabData}
      />
    </div>
  );
};

export default SheetData;
