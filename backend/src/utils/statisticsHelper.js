import * as ss from "simple-statistics";

export function calculateStatistics(customerName, intervals) {
  // Basic metrics
  const count = intervals.length;
  const sum = intervals.reduce((a, b) => a + b, 0);
  const mean = count > 0 ? sum / count : 0;

  // Sort intervals for percentile calculations
  const sorted = [...intervals].sort((a, b) => a - b);

  // Calculate median
  const median =
    count > 0
      ? count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)]
      : 0;

  // Calculate mode (most common interval)
  const frequency = {};
  intervals.forEach((val) => {
    frequency[val] = (frequency[val] || 0) + 1;
  });

  let mode = 0;
  let maxFrequency = 0;
  Object.entries(frequency).forEach(([val, freq]) => {
    if (freq > maxFrequency) {
      maxFrequency = freq;
      mode = parseInt(val);
    }
  });

  // Calculate standard deviation
  const standardDeviation = count > 1 ? ss.standardDeviation(intervals) : 0;

  // Calculate coefficient of variation
  const coefficientVariation = mean > 0 ? standardDeviation / mean : 0;

  // Calculate quartiles and IQR
  const q1 = count >= 4 ? ss.quantile(sorted, 0.25) : sorted[0] || 0;
  const q3 =
    count >= 4 ? ss.quantile(sorted, 0.75) : sorted[sorted.length - 1] || 0;
  const iqr = q3 - q1;

  // Identify short intervals (potentially same order)
  const shortIntervals = intervals.filter((i) => i <= 3);
  const shortIntervalCount = shortIntervals.length;
  const shortIntervalPercentage =
    count > 0 ? (shortIntervalCount / count) * 100 : 0;

  // Calculate statistics excluding short intervals
  const longIntervals = intervals.filter((i) => i > 3);
  const longCount = longIntervals.length;
  const longSum = longIntervals.reduce((a, b) => a + b, 0);
  const longMean = longCount > 0 ? longSum / longCount : 0;
  const longStdDev = longCount > 1 ? ss.standardDeviation(longIntervals) : 0;

  // Calculate runs of similar intervals
  const runs = [];
  let currentRun = 1;

  for (let i = 1; i < intervals.length; i++) {
    const diff = Math.abs(intervals[i] - intervals[i - 1]);
    if (diff <= 3) {
      currentRun++;
    } else {
      runs.push(currentRun);
      currentRun = 1;
    }
  }

  if (currentRun > 0) {
    runs.push(currentRun);
  }

  const maxSimilarIntervalRun = runs.length > 0 ? Math.max(...runs) : 0;
  const avgRunLength =
    runs.length > 0 ? runs.reduce((a, b) => a + b) / runs.length : 0;

  // Calculate regularity score (inverse of coefficient of variation)
  const regularityScore = 1 / (coefficientVariation + 0.1);

  // Calculate prediction reliability
  const predictionReliability =
    count > 3 ? regularityScore * Math.log10(count + 1) : 0;

  // Last order date is assumed to be processed separately

  return {
    customerName,
    meanInterval: mean,
    medianInterval: median,
    modeInterval: mode,
    standardDeviation,
    coefficientVariation,
    count: count,
    totalDays: sum,
    q1,
    q3,
    iqr,
    shortIntervalCount,
    shortIntervalPercentage,
    longIntervalCount: longCount,
    longIntervalMean: longMean,
    longIntervalStdDev: longStdDev,
    maxSimilarIntervalRun,
    avgRunLength,
    regularityScore,
    predictionReliability,
  };
}

export function categorizeDealer(analysis, allDealers = null) {
  // Basic categorization
  let basicCategory = "";

  // Frequency categorization
  if (analysis.meanInterval <= 10) {
    basicCategory = "High Frequency";
  } else if (analysis.meanInterval <= 30) {
    basicCategory = "Medium Frequency";
  } else {
    basicCategory = "Low Frequency";
  }

  // Regularity categorization
  if (analysis.coefficientVariation <= 0.5) {
    basicCategory += " Regular";
  } else {
    basicCategory += " Irregular";
  }

  // For refined categorization, we need all dealers' data to determine quartiles
  // If not provided, return just the basic category
  if (!allDealers) {
    return { basicCategory, refinedCategory: null };
  }

  // Further refinement will be done at the analytics engine level
  // where we have access to all dealers for quartile calculation

  return { basicCategory, refinedCategory: null };
}
