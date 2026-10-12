import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Shield, Server, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

const Settings = () => {
  const [dbStatus, setDbStatus] = useState('Checking database status...');
  const [dbOk, setDbOk] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const checkBackendHealth = async () => {
    try {
      setChecking(true);
      const res = await api.get('/health');
      if (res.data && res.data.success) {
        setDbStatus('Node.js API & Express Backend operational');
        setDbOk(true);
      } else {
        setDbStatus('Backend API responding with warning');
        setDbOk(false);
      }
    } catch (err) {
      console.error(err);
      setDbStatus('Backend server unavailable (Check Node server port 5000)');
      setDbOk(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-sky-600" />
              System Architecture & Portal Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production environment status and database diagnostics
            </p>
          </div>

          <button
            onClick={checkBackendHealth}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Run System Diagnostics
          </button>
        </div>

        {/* Database Diagnostic Card */}
        <div className={`p-5 rounded-2xl border ${dbOk ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-amber-50/50 border-amber-200 text-amber-900'}`}>
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-sm">MongoDB Atlas & Node.js API Connection</div>
              <p className="text-xs leading-relaxed">{dbStatus}</p>
            </div>
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Backend Server</span>
            <p className="font-bold text-slate-900 text-xs">Node.js + Express.js REST API</p>
            <p className="text-xs text-slate-500">Base URL: http://localhost:5000/api</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Database Engine</span>
            <p className="font-bold text-slate-900 text-xs">MongoDB Atlas / Mongoose ODM</p>
            <p className="text-xs text-slate-500">Database: johnson_lifts_dashboard</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Security Architecture</span>
            <p className="font-bold text-slate-900 text-xs">JWT + bcrypt (10 Salt Rounds)</p>
            <p className="text-xs text-slate-500">Rate Limiter & Helmet Middleware Active</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Frontend Environment</span>
            <p className="font-bold text-slate-900 text-xs">React 18 + Vite + Tailwind CSS</p>
            <p className="text-xs text-slate-500">Client Origin: http://localhost:5173</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
