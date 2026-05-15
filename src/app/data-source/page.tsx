"use client";

import { useState, useEffect } from "react";
import { Database, Trash2, Edit2, RefreshCw, AlertCircle } from "lucide-react";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { DataSource } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

export default function DataSourcePage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const { toast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = () => {
    setSources(getStorageItem<DataSource[]>("richy_sources", []));
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = () => {
    if (confirmDeleteId) {
      const newSources = sources.filter(s => s.id !== confirmDeleteId);
      setStorageItem("richy_sources", newSources);
      setSources(newSources);
      toast({ message: "Đã xóa nguồn dữ liệu.", type: "success" });
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Database className="text-blue-400" />
          Nguồn dữ liệu
        </h1>
      </div>

      <div className="space-y-4">
        {sources.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center space-y-3">
            <Database size={32} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-sm">Chưa có nguồn dữ liệu nào.</p>
            <p className="text-xs text-gray-500">Hãy thêm nguồn ở tab Phân tích.</p>
          </div>
        ) : (
          sources.map(source => (
            <div key={source.id} className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-200">{source.name}</h3>
                  <p className="text-xs text-gray-400 truncate max-w-[200px] mt-1">{source.sourceUrl}</p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-gray-800 rounded text-gray-300">
                  {source.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 bg-background rounded-xl p-3 border border-card-border">
                <div className="space-y-1">
                  <p>Yêu cầu: <span className="text-gray-200">{source.requestedDays} ngày</span></p>
                  <p>Thực tế: <span className="text-blue-400 font-medium">{source.actualDays} ngày</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p>Cập nhật: <span className="text-gray-200">{new Date(source.lastUpdated).toLocaleDateString('vi-VN')}</span></p>
                </div>
              </div>

              {source.actualDays > 0 && source.actualDays < 30 && (
                <div className="flex items-start gap-2 text-warning bg-warning/10 p-2 rounded-lg text-[11px]">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>Nguồn này hiện chỉ có {source.actualDays} ngày dữ liệu, chưa đủ dữ liệu lịch sử để phân tích ổn định.</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-card-border">
                <button 
                  onClick={() => handleDelete(source.id)}
                  className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Xóa nguồn dữ liệu?"
        description="Hành động này sẽ xóa nguồn dữ liệu. Bạn không thể hoàn tác."
        confirmText="Xóa dữ liệu"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
