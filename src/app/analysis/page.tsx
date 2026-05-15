"use client";

import { useState, useEffect } from "react";
import { Database, Zap, Save, AlertTriangle, BarChart2, ServerCrash } from "lucide-react";
import clsx from "clsx";
import { getStorageItem, setStorageItem } from "@/lib/storage";
import { 
  DataSource, 
  TailNumberAnalysis, 
  SixDigitSuggestion, 
  AnalysisHistory,
  GlobalNumberStats,
  FullPrizePatternAnalysis
} from "@/lib/types";
import { 
  normalizeLotteryData,
  calculateGlobalNumberStats,
  calculateTailAnalysis, 
  calculateSpecialPrizePositionAnalysis,
  calculateFullPrizePatternAnalysis,
  generateSixDigitSuggestions,
  generateAnalysisFingerprint
} from "@/lib/analysis";
import { LOTTERY_STATIONS, REGION_OPTIONS, LotteryRegion } from "@/data/lotteryStations";
import { useToast } from "@/components/ToastProvider";

const DAYS_OPTIONS = [30, 60, 90, 180];

export default function AnalysisPage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [region, setRegion] = useState<LotteryRegion>("mien-nam");
  const [province, setProvince] = useState("");
  const [days, setDays] = useState(90);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"tail" | "six">("tail");

  const [tailResults, setTailResults] = useState<TailNumberAnalysis[]>([]);
  const [sixDigitResults, setSixDigitResults] = useState<SixDigitSuggestion[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalNumberStats | null>(null);
  const [patternAnalysis, setPatternAnalysis] = useState<FullPrizePatternAnalysis | null>(null);
  const [fingerprints, setFingerprints] = useState<{data: string, analysis: string} | null>(null);

  const [aiSummary, setAiSummary] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const sources = getStorageItem<DataSource[]>("richy_sources", []);
    if (sources.length > 0) {
      const active = sources.find(s => s.status === 'Đang hoạt động' || s.status === 'Cập nhật thành công') || sources[0];
      setSourceUrl(active.sourceUrl);
      if (['mien-bac', 'mien-trung', 'mien-nam'].includes(active.region)) {
        setRegion(active.region as LotteryRegion);
      }
      if (active.stationValue) {
        setProvince(active.stationValue);
      } else {
        setProvince("");
      }
      setDays(active.requestedDays || 90);
    }
  }, []);

  const handleSaveSource = () => {
    if (!province) {
      setError("Vui lòng chọn tỉnh/đài trước khi phân tích.");
      return;
    }
    if (!sourceUrl.startsWith("http")) {
      setError("Link không hợp lệ.");
      return;
    }

    const station = LOTTERY_STATIONS[region].find(s => s.value === province);
    const regionLabel = REGION_OPTIONS.find(r => r.value === region)?.label || region;

    const sources = getStorageItem<DataSource[]>("richy_sources", []);
    const newSource: DataSource = {
      id: Date.now().toString(),
      name: `${station?.label || province} - ${regionLabel}`,
      region,
      province: station?.label || province,
      stationValue: province,
      stationCode: station?.code,
      stationAliases: station?.aliases,
      sourceUrl,
      status: "Chưa cập nhật",
      lastUpdated: new Date().toISOString(),
      requestedDays: days,
      actualDays: 0
    };
    
    const existingIndex = sources.findIndex(s => s.sourceUrl === sourceUrl);
    if (existingIndex >= 0) {
      sources[existingIndex] = { ...sources[existingIndex], ...newSource };
    } else {
      sources.push(newSource);
    }
    setStorageItem("richy_sources", sources);
    setError(null);
    setWarning("Đã lưu nguồn dữ liệu.");
    setTimeout(() => setWarning(null), 3000);
  };

  const handleFetchData = async () => {
    if (!province) {
      setError("Vui lòng chọn tỉnh/đài trước khi phân tích.");
      return;
    }
    if (!sourceUrl.startsWith("http")) {
      setError("Link không hợp lệ. Vui lòng nhập đúng định dạng http/https.");
      return;
    }
    setError(null);
    setWarning(null);
    setIsLoadingData(true);

    const station = LOTTERY_STATIONS[region].find(s => s.value === province);
    const regionLabel = REGION_OPTIONS.find(r => r.value === region)?.label || region;

    try {
      const res = await fetch("/api/fetch-lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sourceUrl, 
          region: regionLabel, 
          province: station?.label || province,
          stationCode: station?.code,
          days 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không đọc được dữ liệu");
      }

      // 1. Normalize
      const normalizedData = normalizeLotteryData(data);
      const analysisFp = generateAnalysisFingerprint(normalizedData);
      const actual = normalizedData.actualDays;

      // Warnings
      if (actual < 30) {
        setWarning(`Dữ liệu dưới 30 ngày (${actual} ngày), chưa đủ mạnh để phân tích ổn định.`);
      } else if (actual < 90 && actual < days) {
        setWarning(`Nguồn này lấy được ít dữ liệu hơn yêu cầu (${actual}/${days}). Có thể dùng phân tích cơ bản nhưng nên có thêm lịch sử.`);
      } else if (actual >= 90) {
        setWarning(`Dữ liệu đủ tốt để phân tích thống kê tham khảo (${actual} ngày).`);
      }

      // 2. Calculate
      const gStats = calculateGlobalNumberStats(normalizedData.results);
      const tStats = calculateTailAnalysis(normalizedData.results);
      const posScores = calculateSpecialPrizePositionAnalysis(normalizedData.results);
      const pAnalysis = calculateFullPrizePatternAnalysis(gStats, tStats);
      const sixSuggestions = generateSixDigitSuggestions(posScores, gStats, tStats);

      setTailResults(tStats);
      setSixDigitResults(sixSuggestions);
      setGlobalStats(gStats);
      setPatternAnalysis(pAnalysis);
      setFingerprints({ data: normalizedData.dataFingerprint, analysis: analysisFp });
      setAiSummary(null); 

      // 3. Update source status
      const sources = getStorageItem<DataSource[]>("richy_sources", []);
      const srcIndex = sources.findIndex(s => s.sourceUrl === sourceUrl);
      if (srcIndex >= 0) {
        sources[srcIndex].status = "Cập nhật thành công";
        sources[srcIndex].actualDays = actual;
        sources[srcIndex].dataFingerprint = normalizedData.dataFingerprint;
        sources[srcIndex].analysisFingerprint = analysisFp;
        sources[srcIndex].lastUpdated = new Date().toISOString();
        setStorageItem("richy_sources", sources);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAnalyzeAI = async () => {
    if (tailResults.length === 0 || sixDigitResults.length === 0) {
      setError("Vui lòng cập nhật dữ liệu trước khi phân tích AI.");
      return;
    }
    setError(null);
    setIsAnalyzingAI(true);

    try {
      const settings = getStorageItem("richy_ai_settings", { 
        enabled: true, 
        apiKey: "", 
        selectedModel: "",
        connectionStatus: "disconnected" 
      });

      if (!settings.enabled) {
        toast({ message: "AI đang bị tắt trong cài đặt.", type: "error" });
        return;
      }

      if (!settings.apiKey && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        toast({ message: "Chưa có API key.", type: "error" });
        return;
      }

      if (!settings.selectedModel) {
        toast({ message: "Chưa chọn model AI.", type: "error" });
        return;
      }

      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailData: tailResults.slice(0, 5),
          sixDigitData: sixDigitResults,
          days,
          apiKey: settings.apiKey,
          model: settings.selectedModel
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("key") || data.error?.includes("Unauthorized")) {
            toast({ message: "API key không hợp lệ.", type: "error" });
        }
        throw new Error(data.error || "Lỗi AI");
      }

      toast({ message: "Phân tích AI hoàn tất.", type: "success" });
      setAiSummary(data);

      const history = getStorageItem<AnalysisHistory[]>("richy_history", []);
      const station = LOTTERY_STATIONS[region].find(s => s.value === province);
      const newHistory: AnalysisHistory = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        sourceUrl,
        province: station?.label || province,
        stationCode: station?.code,
        days,
        actualDays: days,
        dataFingerprint: fingerprints?.data,
        analysisFingerprint: fingerprints?.analysis,
        tailResults,
        sixDigitSuggestions: sixDigitResults,
        globalStats: globalStats || undefined,
        patternAnalysis: patternAnalysis || undefined,
        aiSummary: data,
        status: "Chờ kết quả"
      };
      history.unshift(newHistory);
      setStorageItem("richy_history", history);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <BarChart2 className="text-blue-400" />
          Phân tích dữ liệu
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Link web xổ số</label>
          <input 
            type="url" 
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="https://..." 
            className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Khu vực</label>
            <select 
              value={region}
              onChange={e => {
                setRegion(e.target.value as LotteryRegion);
                setProvince(""); 
              }}
              className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-200"
            >
              {REGION_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Tỉnh / Đài</label>
            <select 
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-200"
            >
              <option value="" disabled hidden>Chọn tỉnh/đài</option>
              {LOTTERY_STATIONS[region].map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Phạm vi thời gian</label>
          <div className="flex gap-2">
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={clsx(
                  "flex-1 py-2 rounded-xl text-xs font-medium transition-colors border",
                  days === d 
                    ? "bg-primary/20 border-primary/50 text-blue-400" 
                    : "bg-background border-card-border text-gray-400 hover:text-gray-200"
                )}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={handleSaveSource}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-3 rounded-xl text-sm transition-colors"
          >
            <Save size={16} /> Lưu nguồn
          </button>
          <button 
            onClick={handleFetchData}
            disabled={isLoadingData}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {isLoadingData ? <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Database size={16} />}
            Cập nhật
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 flex items-start gap-3 text-sm">
          <ServerCrash size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {warning && (
        <div className="bg-warning/10 border border-warning/20 text-warning rounded-xl p-3 flex items-start gap-3 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>{warning}</p>
        </div>
      )}

      {fingerprints && (
        <div className="text-[10px] text-gray-500 text-center font-mono">
          ID phân tích: {fingerprints.analysis}
        </div>
      )}

      {/* Results Section */}
      {tailResults.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tail")}
              className={clsx(
                "flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2",
                activeTab === "tail" ? "text-blue-400 border-blue-400 bg-blue-400/5" : "text-gray-500 border-transparent hover:text-gray-300"
              )}
            >
              Đuôi 2 số
            </button>
            <button
              onClick={() => setActiveTab("six")}
              className={clsx(
                "flex-1 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2",
                activeTab === "six" ? "text-emerald-400 border-emerald-400 bg-emerald-400/5" : "text-gray-500 border-transparent hover:text-gray-300"
              )}
            >
              Dãy 6 số
            </button>
          </div>

          <div className="bg-card-bg border border-card-border rounded-b-2xl rounded-tr-2xl p-4 shadow-lg min-h-[300px]">
            {activeTab === "tail" ? (
              <div className="space-y-4">
                <p className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded-lg italic">
                  Phân tích từ toàn bộ các giải trong dữ liệu lịch sử, không chỉ giải đặc biệt.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {tailResults.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="bg-background border border-card-border rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-2xl font-bold text-gray-200">{item.number}</span>
                        <span className={clsx("text-xs px-2 py-1 rounded-md font-bold", item.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : item.score >= 60 ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-400")}>
                          {item.score} đ
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 line-clamp-2">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg italic">
                  Dãy 6 số được tạo từ mô hình vị trí giải đặc biệt kết hợp thống kê toàn bộ các giải.
                </p>
                {sixDigitResults.map((item, idx) => (
                  <div key={idx} className="bg-background border border-card-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-mono tracking-widest text-emerald-400 font-bold">{item.number}</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-bold">
                        {item.score} điểm
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-400 mt-2 p-2 bg-gray-800/30 rounded-lg">
                      <div className="flex justify-between"><span>Vị trí:</span> <span className="text-gray-200">{item.positionScore}/100</span></div>
                      <div className="flex justify-between"><span>Đuôi 2 số:</span> <span className="text-gray-200">{item.lastTwoScore}/100</span></div>
                      <div className="flex justify-between"><span>Đầu 2 số:</span> <span className="text-gray-200">{item.firstTwoScore}/100</span></div>
                      <div className="flex justify-between"><span>Bộ 3 cuối:</span> <span className="text-gray-200">{item.lastThreeScore}/100</span></div>
                      <div className="flex justify-between"><span>Toàn cục:</span> <span className="text-gray-200">{item.globalDigitScore}/100</span></div>
                      <div className="flex justify-between"><span>Liên kết:</span> <span className="text-gray-200">{item.linkScore}/100</span></div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed border-t border-card-border pt-2">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            {!aiSummary ? (
              <button 
                onClick={handleAnalyzeAI}
                disabled={isAnalyzingAI}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isAnalyzingAI ? <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" /> : <Zap size={20} />}
                Phân tích bằng AI
              </button>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                  <Zap size={18} /> Nhận xét từ AI
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{aiSummary.summary}</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400"><strong className="text-gray-300">Đuôi 2 số:</strong> {aiSummary.tailAnalysis}</p>
                  <p className="text-xs text-gray-400"><strong className="text-gray-300">Dãy 6 số:</strong> {aiSummary.sixDigitAnalysis}</p>
                </div>
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-xs text-warning mt-2">
                  {aiSummary.riskNote}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
