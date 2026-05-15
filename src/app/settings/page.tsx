"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Trash2, Key, Shield, Database, RefreshCcw, Search, ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react";
import { getStorageItem, setStorageItem, clearAllData } from "@/lib/storage";
import { OpenAIModelInfo, AISettings } from "@/lib/types";
import clsx from "clsx";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

const FALLBACK_MODELS: OpenAIModelInfo[] = [
  "gpt-5.5", "gpt-5.5-pro", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", 
  "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini", "o4-mini", "o3"
].map(id => ({
  id, name: id, type: 'Text / Reasoning', isSuitableForAnalysis: true
}));

export default function SettingsPage() {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    enabled: true,
    apiKey: "",
    selectedModel: "gpt-4o-mini",
    connectionStatus: "disconnected",
  });
  
  const { toast } = useToast();
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmResetHistory, setConfirmResetHistory] = useState(false);
  
  const [models, setModels] = useState<OpenAIModelInfo[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelStatus, setModelStatus] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [isTestingKey, setIsTestingKey] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let storedAi = getStorageItem<AISettings | null>("richy_ai_settings", null);
    if (!storedAi) {
      // Migrate old settings
      const oldSettings = getStorageItem<any>("richy_settings", null);
      storedAi = {
        enabled: oldSettings?.aiEnabled ?? true,
        apiKey: oldSettings?.apiKey ?? "",
        selectedModel: oldSettings?.selectedModel ?? oldSettings?.model ?? "gpt-4o-mini",
        connectionStatus: "disconnected",
      };
      setStorageItem("richy_ai_settings", storedAi);
    }
    setAiSettings(storedAi);

    const storedModels = getStorageItem<OpenAIModelInfo[]>("richy_models", []);
    const storedLastUpdated = getStorageItem("richy_models_updated", "");
    
    if (storedModels.length > 0) {
      setModels(storedModels);
      setLastUpdated(storedLastUpdated);
    } else {
      setModels(FALLBACK_MODELS);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveAiSettings = (newSettings: Partial<AISettings>) => {
    const updated = { ...aiSettings, ...newSettings };
    setAiSettings(updated);
    setStorageItem("richy_ai_settings", updated);
  };

  const handleFetchModels = async (keyToUse: string = aiSettings.apiKey) => {
    if (!keyToUse && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      setModelStatus("Chưa có API key để tải danh sách model.");
      return null;
    }

    setIsFetchingModels(true);
    setModelStatus("Đang tải danh sách model...");

    try {
      const res = await fetch('/api/openai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToUse }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không tải được danh sách model. Vui lòng kiểm tra API key hoặc kết nối mạng.");
      }

      const fetchedModels: OpenAIModelInfo[] = data.models;
      setModels(fetchedModels);
      
      const now = new Date().toLocaleString('vi-VN');
      setLastUpdated(now);
      setStorageItem("richy_models", fetchedModels);
      setStorageItem("richy_models_updated", now);
      
      setModelStatus("Đã tải danh sách model thành công.");

      let newSelectedModel = aiSettings.selectedModel;
      // Choose default if current not in list
      if (!fetchedModels.find(m => m.id === aiSettings.selectedModel)) {
        const preferred = fetchedModels.find(m => m.id === "gpt-5.4-mini") 
          || fetchedModels.find(m => m.id === "gpt-4o-mini") 
          || fetchedModels.find(m => m.isSuitableForAnalysis);
        
        if (preferred) {
          newSelectedModel = preferred.id;
          saveAiSettings({ selectedModel: preferred.id });
        }
      }
      return { models: fetchedModels, selectedModel: newSelectedModel };
    } catch (err: any) {
      setModelStatus(err.message);
      if (models.length === 0) setModels(FALLBACK_MODELS);
      return null;
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    saveAiSettings({ connectionStatus: "checking" });
    setModelStatus("Đang kiểm tra kết nối...");

    try {
      const res = await fetch('/api/test-openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiSettings.apiKey }),
      });

      const data = await res.json();
      const now = new Date().toLocaleString('vi-VN');

      if (data.ok) {
        setModelStatus(data.message);
        
        // Fetch models to update dropdown
        const fetchRes = await handleFetchModels(aiSettings.apiKey);
        
        saveAiSettings({ 
          connectionStatus: "connected",
          enabled: true, // Auto enable AI on success
          lastCheckedAt: now,
          modelCount: data.modelCount,
          selectedModel: fetchRes?.selectedModel || data.recommendedModel || aiSettings.selectedModel
        });
        toast({ message: "Kiểm tra API key thành công.", type: "success" });
      } else {
        setModelStatus(data.message);
        saveAiSettings({ 
          connectionStatus: "error",
          lastCheckedAt: now 
        });
        toast({ message: data.message, type: "error" });
      }
    } catch (err: any) {
      setModelStatus("Không thể kết nối OpenAI. Vui lòng kiểm tra mạng.");
      saveAiSettings({ 
        connectionStatus: "error",
        lastCheckedAt: new Date().toLocaleString('vi-VN') 
      });
      toast({ message: "Lỗi kết nối mạng.", type: "error" });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleClearData = () => {
    setConfirmClearData(true);
  };

  const executeClearData = () => {
    clearAllData();
    toast({ message: "Đã xóa toàn bộ dữ liệu.", type: "success" });
    setConfirmClearData(false);
    setTimeout(() => { window.location.href = "/"; }, 500);
  };

  const handleResetHistory = () => {
    setConfirmResetHistory(true);
  };

  const executeResetHistory = () => {
    setStorageItem("richy_history", []);
    toast({ message: "Đã xóa lịch sử phân tích.", type: "success" });
    setConfirmResetHistory(false);
  };

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.type]) acc[model.type] = [];
    acc[model.type].push(model);
    return acc;
  }, {} as Record<string, OpenAIModelInfo[]>);

  const selectedModelInfo = models.find(m => m.id === aiSettings.selectedModel);

  return (
    <div className="p-4 space-y-6 pb-6">
      <div className="flex items-center gap-2">
        <Settings className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-100">Cài đặt</h1>
      </div>

      <div className="space-y-4">
        {/* AI Settings */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-5">
          <div className="flex items-center justify-between border-b border-card-border pb-3">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Key size={16} className="text-blue-400" />
              Cấu hình AI
            </h2>
            <span className={clsx(
              "text-[10px] px-2 py-1 rounded-full font-bold",
              aiSettings.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-400"
            )}>
              {aiSettings.enabled ? "AI đang bật" : "AI đang tắt"}
            </span>
          </div>

          {/* Debug panel */}
          <div className="grid grid-cols-2 gap-2 text-[10px] bg-gray-800/30 p-2 rounded-lg text-gray-400">
            <div className="flex justify-between"><span>Trạng thái:</span> <span className={aiSettings.enabled ? "text-emerald-400" : "text-gray-500"}>{aiSettings.enabled ? "Bật" : "Tắt"}</span></div>
            <div className="flex justify-between"><span>Kết nối:</span> 
              <span className={
                aiSettings.connectionStatus === "connected" ? "text-emerald-400" : 
                aiSettings.connectionStatus === "error" ? "text-danger" : "text-warning"
              }>
                {aiSettings.connectionStatus === "connected" ? "Đã kết nối" : 
                 aiSettings.connectionStatus === "error" ? "Lỗi" : 
                 aiSettings.connectionStatus === "checking" ? "Đang kiểm tra" : "Chưa kết nối"}
              </span>
            </div>
            <div className="flex justify-between col-span-2"><span>Model đang chọn:</span> <span className="text-blue-400 font-mono">{aiSettings.selectedModel}</span></div>
            {aiSettings.lastCheckedAt && <div className="flex justify-between col-span-2"><span>Kiểm tra lần cuối:</span> <span>{aiSettings.lastCheckedAt}</span></div>}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Bật phân tích AI</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={aiSettings.enabled}
                onChange={(e) => {
                  saveAiSettings({ enabled: e.target.checked });
                }}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 font-medium">OpenAI API Key (Chỉ dùng test)</label>
            </div>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={aiSettings.apiKey}
                onChange={(e) => {
                  saveAiSettings({ apiKey: e.target.value, connectionStatus: "disconnected" });
                  setModelStatus("");
                }}
                placeholder="sk-••••••••" 
                className="flex-1 bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary text-gray-200"
              />
              <button
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 text-xs px-3 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center justify-center min-w-[120px]"
              >
                {isTestingKey ? <Loader2 size={14} className="animate-spin" /> : "Kiểm tra API key"}
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              API key được che đi dạng sk-•••••••• và chỉ lưu local. Sẽ gửi qua backend để tải model.
            </p>
            {modelStatus && (
              <p className={clsx(
                "text-[10px] p-2 rounded-lg",
                aiSettings.connectionStatus === "connected" ? "bg-emerald-500/10 text-emerald-400" :
                aiSettings.connectionStatus === "error" ? "bg-danger/10 text-danger" :
                "bg-blue-500/10 text-blue-400"
              )}>
                {modelStatus}
              </p>
            )}
          </div>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <div className="flex justify-between items-end">
              <label className="text-xs text-gray-400 font-medium">Model AI</label>
              <button 
                onClick={() => handleFetchModels(aiSettings.apiKey)}
                disabled={isFetchingModels}
                className="text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                {isFetchingModels ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                Tải danh sách
              </button>
            </div>
            
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-background border border-card-border hover:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-left flex justify-between items-center transition-colors"
            >
              <span className={clsx("truncate", !selectedModelInfo && "text-gray-500")}>
                {selectedModelInfo ? selectedModelInfo.name : "Chọn model OpenAI"}
              </span>
              <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
            </button>

            {selectedModelInfo && !selectedModelInfo.isSuitableForAnalysis && (
              <div className="flex items-start gap-1.5 mt-1 text-warning">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span className="text-[10px]">Model này không phù hợp cho phân tích dữ liệu dạng văn bản. Xin cẩn trọng.</span>
              </div>
            )}

            <p className="text-[10px] text-gray-500">
              Model nhỏ tiết kiệm chi phí. Model mạnh phân tích sâu nhưng tốn phí hơn.
            </p>

            {lastUpdated && (
              <p className="text-[10px] text-gray-600 flex justify-between">
                <span>Tổng số: {models.length} model</span>
                <span>Cập nhật: {lastUpdated}</span>
              </p>
            )}

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-card-border rounded-xl shadow-2xl overflow-hidden max-h-[300px] flex flex-col">
                <div className="p-2 border-b border-gray-800 shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="Tìm kiếm model..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {Object.entries(groupedModels).map(([group, groupModels]) => (
                    <div key={group} className="mb-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 sticky top-0 bg-gray-900">
                        {group}
                      </div>
                      {groupModels.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            saveAiSettings({ selectedModel: m.id });
                            setIsDropdownOpen(false);
                          }}
                          className={clsx(
                            "w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-gray-800 transition-colors",
                            aiSettings.selectedModel === m.id ? "bg-blue-500/10 text-blue-400 font-medium" : "text-gray-300"
                          )}
                        >
                          <span className="truncate pr-2">{m.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={clsx(
                              "text-[9px] px-1.5 py-0.5 rounded border",
                              m.isSuitableForAnalysis ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-gray-800 border-gray-700 text-gray-400"
                            )}>
                              {m.isSuitableForAnalysis ? "Phân tích được" : "Không phù hợp"}
                            </span>
                            {aiSettings.selectedModel === m.id && <Check size={14} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                  {filteredModels.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">Không tìm thấy model nào.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Data Management */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
            <Database size={16} className="text-danger" />
            Quản lý dữ liệu
          </h2>

          <button 
            onClick={handleResetHistory}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-background border border-card-border text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <RefreshCcw size={16} className="text-warning" />
              Reset lịch sử phân tích
            </span>
          </button>

          <button 
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger hover:bg-danger/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={16} />
              Xóa toàn bộ dữ liệu app
            </span>
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmClearData}
        title="Xóa toàn bộ dữ liệu?"
        description="Hành động này sẽ xóa nguồn dữ liệu, lịch sử phân tích và toàn bộ dữ liệu đã lưu trong app. Thao tác này không thể hoàn tác."
        confirmText="Xóa dữ liệu"
        cancelText="Hủy"
        variant="danger"
        onConfirm={executeClearData}
        onCancel={() => setConfirmClearData(false)}
      />

      <ConfirmModal
        open={confirmResetHistory}
        title="Xóa lịch sử phân tích?"
        description="Toàn bộ lịch sử kết quả phân tích AI và thống kê sẽ bị xóa vĩnh viễn."
        confirmText="Xóa lịch sử"
        cancelText="Hủy"
        variant="warning"
        onConfirm={executeResetHistory}
        onCancel={() => setConfirmResetHistory(false)}
      />
    </div>
  );
}
