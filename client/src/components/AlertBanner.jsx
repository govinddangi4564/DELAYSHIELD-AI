import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

const AlertBanner = ({ severity, message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss or reset visibility when the message starts moving
  useEffect(() => {
    setIsVisible(true);
  }, [message, severity]);

  if (!isVisible) return null;

  const styles = {
    High: {
      bg: 'bg-red-600',
      border: 'border-red-700',
      text: 'text-white',
      icon: <AlertCircle size={20} className="text-white animate-pulse" />,
      label: 'Critical Alert',
    },
    Medium: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      text: 'text-white',
      icon: <AlertTriangle size={20} className="text-white" />,
      label: 'Attention Required',
    },
    Low: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-700',
      text: 'text-white',
      icon: <CheckCircle size={20} className="text-white" />,
      label: 'System Status',
    },
  };

  const current = styles[severity] || styles.Low;

  return (
    <div 
      className={`${current.bg} ${current.text} px-6 py-3 flex items-center justify-between border-b ${current.border} shadow-lg animate-in slide-in-from-top duration-500`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {current.icon}
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <span className="font-black text-[10px] uppercase tracking-[0.2em] bg-black/20 px-2 py-0.5 rounded">
            {current.label}
          </span>
          <p className="text-sm font-bold tracking-tight">
            {message}
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => {
          setIsVisible(false);
          if (onDismiss) onDismiss();
        }}
        className="p-1 hover:bg-black/10 rounded-full transition-colors active:scale-95"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default AlertBanner;
