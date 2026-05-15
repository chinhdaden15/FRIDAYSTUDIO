"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import clsx from "clsx";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  variant,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!isMounted || !open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Overlay click */}
      <div className="absolute inset-0" onClick={onCancel} />
      
      <div className="relative w-full max-w-sm bg-gray-900 border border-card-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className={clsx(
              "w-12 h-12 shrink-0 rounded-full flex items-center justify-center",
              variant === "danger" ? "bg-danger/10 text-danger" :
              variant === "warning" ? "bg-warning/10 text-warning" :
              "bg-blue-500/10 text-blue-400"
            )}>
              {variant === "danger" ? <Trash2 size={24} /> :
               variant === "warning" ? <AlertTriangle size={24} /> :
               <Info size={24} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">{title}</h2>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="p-4 bg-gray-800/50 flex gap-3 border-t border-card-border">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]",
              variant === "danger" ? "bg-danger" :
              variant === "warning" ? "bg-warning" :
              "bg-blue-600"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
