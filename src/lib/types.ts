export interface PrizeGroup {
  name: string;
  numbers: string[];
}

export interface LotteryResult {
  date: string;
  region: string;
  province: string;
  specialPrize: string;
  prizes: PrizeGroup[];
  allPrizeNumbers: string[];
}

export interface NormalizedLotteryData {
  sourceUrl: string;
  region: string;
  province: string;
  requestedDays: number;
  actualDays: number;
  dataType: "real" | "mock";
  dataFingerprint: string;
  results: LotteryResult[];
}

export interface TailNumberAnalysis {
  number: string;
  score: number;
  frequency: number;
  recentFrequency: number;
  delay: number;
  averageCycle: number;
  trendScore: number;
  cycleScore: number;
  reason: string;
}

export interface PositionDigitScore {
  position: number;
  digit: number;
  score: number;
  frequency: number;
  recentFrequency: number;
  delay: number;
  averageCycle: number;
  trendScore: number;
  cycleScore: number;
  linkScore: number;
  reason: string;
}

export interface SixDigitSuggestion {
  number: string;
  score: number;
  positionScore: number;
  lastTwoScore: number;
  firstTwoScore: number;
  lastThreeScore: number;
  globalDigitScore: number;
  linkScore: number;
  reason: string;
}

export interface GlobalNumberStats {
  digitFrequency: Record<string, number>;
  firstTwoFrequency: Record<string, number>;
  lastTwoFrequency: Record<string, number>;
  lastThreeFrequency: Record<string, number>;
  numberLengthStats: Record<number, number>;
  coOccurrencePairs: Record<string, number>;
}

export interface FullPrizePatternAnalysis {
  topDigits: { number: string; count: number }[];
  topFirstTwo: { number: string; count: number }[];
  topLastTwo: { number: string; count: number }[];
  topLastThree: { number: string; count: number }[];
  coldDigits: { number: string; count: number }[];
  delayedPairs: { number: string; delay: number }[];
  recentHotPatterns: string[];
}

export interface AnalysisHistory {
  id: string;
  createdAt: string;
  sourceUrl: string;
  province: string;
  stationCode?: string;
  days: number;
  actualDays: number;
  dataFingerprint?: string;
  analysisFingerprint?: string;
  tailResults: TailNumberAnalysis[];
  sixDigitSuggestions: SixDigitSuggestion[];
  globalStats?: GlobalNumberStats;
  patternAnalysis?: FullPrizePatternAnalysis;
  aiSummary?: {
    summary: string;
    tailAnalysis: string;
    sixDigitAnalysis: string;
    riskNote: string;
  };
  status: 'Chờ kết quả' | 'Đã đối chiếu' | 'Có số trùng' | 'Không có số trùng';
}

export interface DataSource {
  id: string;
  name: string;
  region: string;
  province: string;
  stationValue?: string;
  stationCode?: string;
  stationAliases?: string[];
  sourceUrl: string;
  status: 'Đang hoạt động' | 'Chưa cập nhật' | 'Link không hợp lệ' | 'Không đọc được dữ liệu' | 'Dữ liệu chưa đủ' | 'Cập nhật thành công';
  lastUpdated: string;
  requestedDays: number;
  actualDays: number;
  dataFingerprint?: string;
  analysisFingerprint?: string;
}

export interface OpenAIModelInfo {
  id: string;
  name: string;
  type: 'Khuyến nghị' | 'Text / Reasoning' | 'Vision' | 'Audio' | 'Embedding' | 'Image' | 'Khác';
  isSuitableForAnalysis: boolean;
}

export interface AISettings {
  enabled: boolean;
  apiKey: string;
  selectedModel: string;
  connectionStatus: "connected" | "disconnected" | "error" | "checking";
  lastCheckedAt?: string;
  modelCount?: number;
}

export interface MusicSettings {
  enabled: boolean;
  volume: number;
  source: string;
  userHasChosen: boolean;
}

