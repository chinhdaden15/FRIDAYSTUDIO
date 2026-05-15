"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([]);

  const toast = useCallback(({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={clsx(
              "pointer-events-auto flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-5 fade-in duration-300",
              t.type === 'success' ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400" :
              t.type === 'error' ? "bg-danger/10 border-danger/20 text-danger backdrop-blur-md" :
              t.type === 'warning' ? "bg-warning/10 border-warning/20 text-warning backdrop-blur-md" :
              "bg-gray-800/90 border-gray-700 text-gray-200 backdrop-blur-md"
            )}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle size={18} />}
              {t.type === 'error' && <XCircle size={18} />}
              {t.type === 'warning' && <AlertTriangle size={18} />}
              {t.type === 'info' && <Info size={18} />}
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
