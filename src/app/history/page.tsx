"use client";

import { useState, useEffect } from "react";
import { History, CalendarDays, MapPin, CheckCircle, Clock } from "lucide-react";
import clsx from "clsx";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { AnalysisHistory } from "@/lib/types";

export default function HistoryPage() {
  const [histories, setHistories] = useState<AnalysisHistory[]>([]);

  useEffect(() => {
    setHistories(getStorageItem<AnalysisHistory[]>("richy_history", []));
  }, []);

  const handleUpdateStatus = (id: string, newStatus: any) => {
    const updated = histories.map(h => 
      h.id === id ? { ...h, status: newStatus } : h
    );
    setHistories(updated);
    setStorageItem("richy_history", updated);
  };

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <History className="text-emerald-400" />
          Lịch sử phân tích
        </h1>
      </div>

      <div className="space-y-4">
        {histories.length === 0 ? (
          <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center space-y-3">
            <History size={32} className="mx-auto text-gray-600" />
            <p className="text-gray-400 text-sm">Chưa có lịch sử phân tích.</p>
          </div>
        ) : (
          histories.map(history => (
            <div key={history.id} className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-200 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-400" />
                    {history.province}
                  </h3>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      {new Date(history.createdAt).toLocaleString('vi-VN')}
                    </p>
                    {history.analysisFingerprint && (
                      <p className="text-[10px] text-gray-600 font-mono flex items-center gap-1.5">
                        <span className="w-3" /> ID: {history.analysisFingerprint}
                      </p>
                    )}
                  </div>
                </div>
                
                <select
                  value={history.status}
                  onChange={(e) => handleUpdateStatus(history.id, e.target.value)}
                  className={clsx(
                    "text-[10px] px-2 py-1 rounded-md border font-medium outline-none",
                    history.status === 'Chờ kết quả' ? "bg-warning/10 text-warning border-warning/20" :
                    history.status === 'Có số trùng' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    history.status === 'Không có số trùng' ? "bg-gray-800 text-gray-400 border-gray-700" :
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}
                >
                  <option value="Chờ kết quả">⏳ Chờ kết quả</option>
                  <option value="Đã đối chiếu">👁️ Đã đối chiếu</option>
                  <option value="Có số trùng">🎯 Có số trùng</option>
                  <option value="Không có số trùng">✖️ Không trùng</option>
                </select>
              </div>

              {/* Data Summary */}
              <div className="bg-background rounded-xl p-3 border border-card-border space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Đuôi 2 số nổi bật</p>
                  <div className="flex gap-2">
                    {history.tailResults.slice(0, 4).map((t, idx) => (
                      <span key={idx} className="text-sm font-bold text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {t.number}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Dãy 6 số đề xuất</p>
                  <div className="grid grid-cols-2 gap-2">
                    {history.sixDigitSuggestions.slice(0, 2).map((s, idx) => (
                      <span key={idx} className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 truncate">
                        {s.number}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {history.aiSummary && (
                <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-xl line-clamp-2">
                  <strong className="text-gray-300">AI:</strong> {history.aiSummary.summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
