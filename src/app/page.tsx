"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Activity, CalendarDays, MapPin, Database, Award, CheckCircle2, LineChart, Hash } from "lucide-react";
import { getStorageItem } from "@/lib/storage";
import { AnalysisHistory, DataSource } from "@/lib/types";

export default function Home() {
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisHistory | null>(null);
  const [activeSource, setActiveSource] = useState<DataSource | null>(null);

  useEffect(() => {
    const history = getStorageItem<AnalysisHistory[]>("richy_history", []);
    if (history.length > 0) {
      setLatestAnalysis(history[0]);
    }
    
    const sources = getStorageItem<DataSource[]>("richy_sources", []);
    const active = sources.find(s => s.status === 'Đang hoạt động' || s.status === 'Cập nhật thành công');
    if (active) {
      setActiveSource(active);
    }
  }, []);

  return (
    <div className="p-4 space-y-6 pb-6">
      {/* Header Info */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          FRIDAY STUIDO
        </h1>
        <p className="text-sm text-gray-400">
          Công cụ phân tích xác suất xổ số tham khảo bằng dữ liệu thống kê.
        </p>
      </div>

      {/* Trạng thái dữ liệu */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-gray-200">
            <Database size={16} className="text-blue-400" />
            Trạng thái dữ liệu
          </h2>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {activeSource?.actualDays && activeSource.actualDays >= 30 ? "Đủ dữ liệu" : "Thiếu dữ liệu"}
          </span>
        </div>

        {activeSource ? (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-gray-500 flex items-center gap-1.5"><MapPin size={12}/> Tỉnh/Đài</span>
              <p className="font-medium text-gray-200">{activeSource.province}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-500 flex items-center gap-1.5"><CalendarDays size={12}/> Phạm vi</span>
              <p className="font-medium text-gray-200">{activeSource.actualDays}/{activeSource.requestedDays} ngày</p>
            </div>
            {latestAnalysis?.analysisFingerprint && (
              <div className="space-y-1 col-span-2">
                <span className="text-gray-500 flex items-center gap-1.5"><Hash size={12}/> Analysis ID</span>
                <p className="font-mono text-gray-400 text-[11px]">{latestAnalysis.analysisFingerprint}</p>
              </div>
            )}
            <div className="space-y-1 col-span-2">
              <span className="text-gray-500 flex items-center gap-1.5"><Activity size={12}/> Nguồn</span>
              <p className="font-medium text-gray-300 truncate">{activeSource.sourceUrl}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2">
            Chưa có nguồn dữ liệu. Hãy thêm nguồn để phân tích.
          </div>
        )}
      </div>

      {/* Kết quả phân tích gần nhất */}
      {latestAnalysis ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-300">Kết quả phân tích gần nhất</h2>
          
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-2">
              🔥 Top phân tích từ các giải
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500">Đuôi 2 số (Top 3)</p>
                <div className="flex gap-2">
                  {latestAnalysis.tailResults.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-3 py-1 rounded-lg text-sm">
                      {item.number}
                    </span>
                  ))}
                </div>
              </div>

              {latestAnalysis.patternAnalysis && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500">Đầu 2 số (Top 3)</p>
                    <div className="flex gap-2">
                      {latestAnalysis.patternAnalysis.topFirstTwo.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-lg text-sm">
                          {item.number}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500">Bộ 3 cuối (Top 3)</p>
                    <div className="flex gap-2">
                      {latestAnalysis.patternAnalysis.topLastThree.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="bg-warning/10 border border-warning/20 text-warning font-bold px-3 py-1 rounded-lg text-sm">
                          {item.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dãy 6 số tham khảo */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold">✨ Dãy 6 số tham khảo</h3>
            <div className="space-y-2">
              {latestAnalysis.sixDigitSuggestions.map((item, idx) => (
                <div key={idx} className="bg-background border border-card-border rounded-xl p-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/20">
                      {idx + 1}
                    </div>
                    <span className="text-lg font-mono tracking-widest text-gray-200">{item.number}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Award size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{item.score} đ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-500">
            <LineChart size={24} />
          </div>
          <h3 className="text-gray-300 font-medium">Chưa có dữ liệu phân tích</h3>
          <p className="text-xs text-gray-500">
            Dữ liệu phân tích sẽ hiển thị tại đây sau khi bạn thực hiện phân tích thống kê.
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="pt-2">
        <Link 
          href="/analysis"
          className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          {latestAnalysis ? "Phân tích lại" : "Phân tích ngay"}
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
