import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-600 text-white',
    info: 'bg-sky-600 text-white',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 animate-slide-up transform border border-white/20 text-sm font-medium ${bgColors[type] || bgColors.success}">
      <span>{icons[type] || icons.success}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white p-0.5 rounded focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
