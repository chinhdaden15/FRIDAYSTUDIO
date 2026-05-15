import { 
  LotteryResult, 
  NormalizedLotteryData, 
  GlobalNumberStats, 
  TailNumberAnalysis, 
  PositionDigitScore, 
  FullPrizePatternAnalysis, 
  SixDigitSuggestion 
} from "./types";

// Helper: Basic string hash to create fingerprints
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export const normalizeLotteryData = (rawData: any): NormalizedLotteryData => {
  const results: LotteryResult[] = [];
  
  (rawData.results || []).forEach((day: any) => {
    // Collect all numbers across all prizes
    const allPrizeNumbers: string[] = [];
    let specialPrize = day.specialPrize || "";
    const prizes: any[] = day.prizes || [];

    // Ensure special prize is strictly numbers
    specialPrize = specialPrize.replace(/\D/g, '');
    if (specialPrize) allPrizeNumbers.push(specialPrize);

    prizes.forEach((p: any) => {
      (p.numbers || []).forEach((num: string) => {
        const cleanNum = num.replace(/\D/g, '');
        if (cleanNum) allPrizeNumbers.push(cleanNum);
      });
    });

    // Fallback if prizes array is missing but allPrizeNumbers was in raw
    if (prizes.length === 0 && day.allPrizeNumbers) {
      day.allPrizeNumbers.forEach((num: string) => {
        const cleanNum = num.replace(/\D/g, '');
        if (cleanNum && cleanNum !== specialPrize) {
          allPrizeNumbers.push(cleanNum);
        }
      });
    }

    results.push({
      date: day.date,
      region: rawData.region,
      province: rawData.province,
      specialPrize,
      prizes,
      allPrizeNumbers: Array.from(new Set(allPrizeNumbers)) // unique per day
    });
  });

  // Fingerprint logic
  let fpString = `${rawData.province}|${rawData.requestedDays}|${rawData.actualDays}`;
  results.forEach(r => {
    fpString += `|${r.date}:${r.specialPrize}:${r.allPrizeNumbers.join(',')}`;
  });

  return {
    sourceUrl: rawData.sourceUrl,
    region: rawData.region,
    province: rawData.province,
    requestedDays: rawData.requestedDays,
    actualDays: rawData.actualDays,
    dataType: rawData.dataType || "real",
    dataFingerprint: generateHash(fpString),
    results
  };
};

export const generateAnalysisFingerprint = (normalizedData: NormalizedLotteryData): string => {
  let fpString = `${normalizedData.province}|${normalizedData.actualDays}`;
  normalizedData.results.forEach(r => {
    fpString += `|${r.date}:${r.specialPrize}:${r.allPrizeNumbers.join(',')}`;
  });
  return generateHash(fpString);
};

export const calculateGlobalNumberStats = (results: LotteryResult[]): GlobalNumberStats => {
  const digitFrequency: Record<string, number> = {};
  const firstTwoFrequency: Record<string, number> = {};
  const lastTwoFrequency: Record<string, number> = {};
  const lastThreeFrequency: Record<string, number> = {};
  const numberLengthStats: Record<number, number> = {};
  const coOccurrencePairs: Record<string, number> = {};

  // Initialize digit frequencies 0-9
  for (let i = 0; i <= 9; i++) digitFrequency[i.toString()] = 0;

  results.forEach(day => {
    const dailyLastTwos: string[] = [];

    day.allPrizeNumbers.forEach(num => {
      // Length
      numberLengthStats[num.length] = (numberLengthStats[num.length] || 0) + 1;

      // Digits
      for (const char of num) {
        digitFrequency[char] = (digitFrequency[char] || 0) + 1;
      }

      // Substrings
      if (num.length >= 2) {
        const first2 = num.substring(0, 2);
        const last2 = num.substring(num.length - 2);
        firstTwoFrequency[first2] = (firstTwoFrequency[first2] || 0) + 1;
        lastTwoFrequency[last2] = (lastTwoFrequency[last2] || 0) + 1;
        dailyLastTwos.push(last2);
      }
      if (num.length >= 3) {
        const last3 = num.substring(num.length - 3);
        lastThreeFrequency[last3] = (lastThreeFrequency[last3] || 0) + 1;
      }
    });

    // Co-occurrence of last-2 digits in the same day
    const uniqueTwos = Array.from(new Set(dailyLastTwos)).sort();
    for (let i = 0; i < uniqueTwos.length; i++) {
      for (let j = i + 1; j < uniqueTwos.length; j++) {
        const pair = `${uniqueTwos[i]}-${uniqueTwos[j]}`;
        coOccurrencePairs[pair] = (coOccurrencePairs[pair] || 0) + 1;
      }
    }
  });

  return {
    digitFrequency,
    firstTwoFrequency,
    lastTwoFrequency,
    lastThreeFrequency,
    numberLengthStats,
    coOccurrencePairs
  };
};

export const calculateTailAnalysis = (results: LotteryResult[]): TailNumberAnalysis[] => {
  if (results.length === 0) return [];
  
  const lastTwoOccurrences: Record<string, number[]> = {};
  for (let i = 0; i < 100; i++) {
    lastTwoOccurrences[i.toString().padStart(2, '0')] = [];
  }

  // index 0 is most recent
  results.forEach((day, index) => {
    day.allPrizeNumbers.forEach(num => {
      if (num.length >= 2) {
        const last2 = num.substring(num.length - 2);
        if (!lastTwoOccurrences[last2].includes(index)) {
          lastTwoOccurrences[last2].push(index);
        }
      }
    });
  });

  const analysis: TailNumberAnalysis[] = [];
  const totalDays = results.length;
  const recentDaysLimit = Math.min(14, totalDays);

  Object.entries(lastTwoOccurrences).forEach(([tail, indices]) => {
    const frequency = indices.length;
    const recentFrequency = indices.filter(i => i < recentDaysLimit).length;
    const delay = indices.length > 0 ? Math.min(...indices) : totalDays;
    
    // Calculate average cycle
    let avgCycle = totalDays;
    if (indices.length > 1) {
      let sum = 0;
      for (let i = 0; i < indices.length - 1; i++) {
        sum += Math.abs(indices[i] - indices[i+1]);
      }
      avgCycle = sum / (indices.length - 1);
    } else if (indices.length === 1) {
      avgCycle = totalDays / 2;
    }

    // Trend (recent freq compared to expected)
    const expectedRecent = (frequency / totalDays) * recentDaysLimit;
    const trendScore = frequency === 0 ? 0 : Math.min(100, (recentFrequency / (expectedRecent || 1)) * 50);
    
    // Cycle score (ideal if delay is close to avgCycle)
    const cycleScore = frequency === 0 ? 0 : Math.max(0, 100 - Math.abs(delay - avgCycle) * 10);

    // Formula: 35% freq, 25% trend, 20% delay, 10% cycle, 10% link (ignored for simplicity or mocked deterministically)
    const normalizedFreq = Math.min(100, (frequency / (totalDays * 0.3)) * 100);
    const delayScore = Math.max(0, 100 - delay * 5);
    const linkScore = 50; // generic deterministic

    const score = Math.round(
      (normalizedFreq * 0.35) + 
      (trendScore * 0.25) + 
      (delayScore * 0.20) + 
      (cycleScore * 0.10) + 
      (linkScore * 0.10)
    );

    let reason = "";
    if (score > 70) reason = `Tần suất tốt (${frequency} lần), nhịp xuất hiện đều đặn.`;
    else if (delay === 0) reason = `Vừa xuất hiện gần đây.`;
    else reason = `Độ trễ ${delay} ngày, chu kỳ trung bình ${avgCycle.toFixed(1)} ngày.`;

    analysis.push({
      number: tail,
      score,
      frequency,
      recentFrequency,
      delay,
      averageCycle: parseFloat(avgCycle.toFixed(2)),
      trendScore: Math.round(trendScore),
      cycleScore: Math.round(cycleScore),
      reason
    });
  });

  return analysis.sort((a, b) => b.score - a.score);
};

export const calculateSpecialPrizePositionAnalysis = (results: LotteryResult[]): PositionDigitScore[] => {
  const positionScores: PositionDigitScore[] = [];
  for (let pos = 1; pos <= 6; pos++) {
    for (let digit = 0; digit <= 9; digit++) {
      positionScores.push({
        position: pos,
        digit,
        score: 0,
        frequency: 0,
        recentFrequency: 0,
        delay: 999,
        averageCycle: 999,
        trendScore: 0,
        cycleScore: 0,
        linkScore: 50,
        reason: ""
      });
    }
  }

  const specialPrizes = results.map(r => r.specialPrize).filter(p => p && p.length === 6);
  const totalDays = specialPrizes.length;
  if (totalDays === 0) return positionScores;

  const occurrences: Record<string, number[]> = {};
  
  specialPrizes.forEach((prize, index) => {
    for (let i = 0; i < 6; i++) {
      const pos = i + 1;
      const digit = parseInt(prize[i], 10);
      if (isNaN(digit)) continue;

      const key = `${pos}-${digit}`;
      if (!occurrences[key]) occurrences[key] = [];
      occurrences[key].push(index); // 0 is most recent if results is sorted descending
    }
  });

  const recentLimit = Math.min(14, totalDays);

  positionScores.forEach(stat => {
    const key = `${stat.position}-${stat.digit}`;
    const indices = occurrences[key] || [];

    stat.frequency = indices.length;
    stat.recentFrequency = indices.filter(i => i < recentLimit).length;
    stat.delay = indices.length > 0 ? Math.min(...indices) : totalDays;

    if (indices.length > 1) {
      let sum = 0;
      for (let i = 0; i < indices.length - 1; i++) sum += Math.abs(indices[i] - indices[i+1]);
      stat.averageCycle = sum / (indices.length - 1);
    } else if (indices.length === 1) {
      stat.averageCycle = totalDays / 2;
    } else {
      stat.averageCycle = totalDays;
    }

    const expectedRecent = (stat.frequency / totalDays) * recentLimit;
    stat.trendScore = stat.frequency === 0 ? 0 : Math.min(100, (stat.recentFrequency / (expectedRecent || 1)) * 50);
    stat.cycleScore = stat.frequency === 0 ? 0 : Math.max(0, 100 - Math.abs(stat.delay - stat.averageCycle) * 10);

    const normFreq = Math.min(100, (stat.frequency / (totalDays * 0.15)) * 100); // expect ~10% freq
    const delayScore = Math.max(0, 100 - stat.delay * 5);

    // 35% freq, 25% trend, 20% delay, 10% cycle, 10% link
    stat.score = Math.round(
      (normFreq * 0.35) + 
      (stat.trendScore * 0.25) + 
      (delayScore * 0.20) + 
      (stat.cycleScore * 0.10) + 
      (stat.linkScore * 0.10)
    );

    stat.reason = `Tần suất: ${stat.frequency}, Trễ: ${stat.delay}`;
  });

  return positionScores.sort((a, b) => b.score - a.score);
};

export const calculateFullPrizePatternAnalysis = (globalStats: GlobalNumberStats, tailAnalysis: TailNumberAnalysis[]): FullPrizePatternAnalysis => {
  const toSortedArray = (record: Record<string, number>) => 
    Object.entries(record).map(([k, v]) => ({ number: k, count: v })).sort((a, b) => b.count - a.count);

  return {
    topDigits: toSortedArray(globalStats.digitFrequency).slice(0, 5),
    topFirstTwo: toSortedArray(globalStats.firstTwoFrequency).slice(0, 10),
    topLastTwo: tailAnalysis.map(t => ({ number: t.number, count: t.frequency })).slice(0, 10),
    topLastThree: toSortedArray(globalStats.lastThreeFrequency).slice(0, 10),
    coldDigits: toSortedArray(globalStats.digitFrequency).slice(-5).reverse(),
    delayedPairs: tailAnalysis.sort((a, b) => b.delay - a.delay).slice(0, 10).map(t => ({ number: t.number, delay: t.delay })),
    recentHotPatterns: tailAnalysis.filter(t => t.trendScore > 80).slice(0, 5).map(t => t.number)
  };
};

export const generateSixDigitSuggestions = (
  positionScores: PositionDigitScore[], 
  globalStats: GlobalNumberStats,
  tailAnalysis: TailNumberAnalysis[]
): SixDigitSuggestion[] => {
  
  // deterministic combination strategies using top choices
  // Array of rank index per position: [pos1, pos2, pos3, pos4, pos5, pos6]
  const strategies = [
    [0, 0, 0, 0, 0, 0], 
    [0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 1],
    [0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0],
    [1, 2, 1, 2, 1, 2],
    [0, 1, 2, 0, 1, 2],
    [2, 1, 0, 2, 1, 0]
  ];

  const posRankings: number[][] = [];
  for (let pos = 1; pos <= 6; pos++) {
    const sorted = positionScores.filter(p => p.position === pos).sort((a, b) => b.score - a.score);
    posRankings.push(sorted.map(s => s.digit));
  }

  const allCandidates: SixDigitSuggestion[] = [];

  const maxFreqDigit = Math.max(...Object.values(globalStats.digitFrequency), 1);
  const maxFreqF2 = Math.max(...Object.values(globalStats.firstTwoFrequency), 1);
  const maxFreqL3 = Math.max(...Object.values(globalStats.lastThreeFrequency), 1);

  strategies.forEach((strat) => {
    let numStr = "";
    let posScoreSum = 0;
    
    strat.forEach((rank, idx) => {
      // safe fallback if missing
      const digit = posRankings[idx][rank] ?? posRankings[idx][0] ?? 0;
      numStr += digit;
      const stat = positionScores.find(p => p.position === (idx + 1) && p.digit === digit);
      posScoreSum += stat ? stat.score : 0;
    });

    const positionScore = Math.round(posScoreSum / 6);
    
    // Evaluate parts against global/tail stats
    const last2 = numStr.substring(4);
    const first2 = numStr.substring(0, 2);
    const last3 = numStr.substring(3);

    const tailStat = tailAnalysis.find(t => t.number === last2);
    const lastTwoScore = tailStat ? tailStat.score : 0;

    const firstTwoScore = Math.round(((globalStats.firstTwoFrequency[first2] || 0) / maxFreqF2) * 100);
    const lastThreeScore = Math.round(((globalStats.lastThreeFrequency[last3] || 0) / maxFreqL3) * 100);
    
    // Global digit average
    let digitScoreSum = 0;
    for (const d of numStr) {
      digitScoreSum += ((globalStats.digitFrequency[d] || 0) / maxFreqDigit) * 100;
    }
    const globalDigitScore = Math.round(digitScoreSum / 6);

    const linkScore = 60 + ((parseInt(numStr, 10) % 40)); // simple deterministic link

    // Formula: 40% pos, 20% tail, 15% head, 10% last3, 10% global, 5% link
    const finalScore = Math.round(
      (positionScore * 0.40) +
      (lastTwoScore * 0.20) +
      (firstTwoScore * 0.15) +
      (lastThreeScore * 0.10) +
      (globalDigitScore * 0.10) +
      (linkScore * 0.05)
    );

    const reason = `Dãy ${numStr} tổng hợp từ top vị trí. Đuôi ${last2} có điểm ${lastTwoScore}, Đầu ${first2} có điểm ${firstTwoScore}. Thống kê đồng bộ từ toàn bộ các giải.`;

    allCandidates.push({
      number: numStr,
      score: finalScore,
      positionScore,
      lastTwoScore,
      firstTwoScore,
      lastThreeScore,
      globalDigitScore,
      linkScore,
      reason
    });
  });

  // Sort and remove duplicates
  allCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Ascending number string as deterministic tie-breaker
    return a.number.localeCompare(b.number);
  });

  const unique: SixDigitSuggestion[] = [];
  const seen = new Set<string>();

  for (const cand of allCandidates) {
    if (unique.length >= 5) break;
    if (!seen.has(cand.number)) {
      seen.add(cand.number);
      unique.push(cand);
    }
  }

  return unique;
};
