// ------------------------------
// DEFAULT WEIGHTS (can be tuned)
// ------------------------------
const DEFAULT_WEIGHTS = {
  traffic: 0.5,
  weather: 0.3,
  delay: 0.2,
};

// ------------------------------
// NORMALIZE INPUT (0–100)
// ------------------------------
const normalizeInput = (value) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

// ------------------------------
// DETERMINE RISK LEVEL
// ------------------------------
const getRiskLevel = (score) => {
  if (score <= 40) return "Low";
  if (score <= 70) return "Medium";
  return "High";
};

// ------------------------------
// RECOMMENDATION ENGINE
// ------------------------------
const getRecommendation = (score) => {
  if (score > 70) return "Reroute or delay shipment";
  if (score > 40) return "Monitor conditions";
  return "Safe to proceed";
};

// ------------------------------
// RISK REASON (Explainability 🔥)
// ------------------------------
const getRiskReason = (traffic, weather, delay) => {
  if (traffic > 70) return "High traffic congestion detected";
  if (weather > 70) return "Severe weather conditions detected";
  if (delay > 70) return "High historical delay probability";
  return "Moderate operating conditions";
};

// ------------------------------
// MAIN RISK CALCULATION FUNCTION
// ------------------------------
export const calculateRisk = (
  { traffic = 0, weather = 0, delay = 0 } = {},
  weights = DEFAULT_WEIGHTS
) => {
  // Normalize inputs
  const t = normalizeInput(traffic);
  const w = normalizeInput(weather);
  const d = normalizeInput(delay);

  // Ensure weights are valid
  const totalWeight = weights.traffic + weights.weather + weights.delay;

  const normalizedWeights =
    totalWeight === 1
      ? weights
      : {
          traffic: weights.traffic / totalWeight,
          weather: weights.weather / totalWeight,
          delay: weights.delay / totalWeight,
        };

  // Calculate score
  const score = parseFloat(
    (
      normalizedWeights.traffic * t +
      normalizedWeights.weather * w +
      normalizedWeights.delay * d
    ).toFixed(2)
  );

  // Build response
  return {
    score,
    level: getRiskLevel(score),
    recommendation: getRecommendation(score),

    // 🔥 Explainability
    reason: getRiskReason(t, w, d),

    // 🔍 Transparency (very important)
    breakdown: {
      traffic: parseFloat((normalizedWeights.traffic * t).toFixed(2)),
      weather: parseFloat((normalizedWeights.weather * w).toFixed(2)),
      delay: parseFloat((normalizedWeights.delay * d).toFixed(2)),
    },

    // Extra metadata (pro touch)
    inputs: {
      traffic: t,
      weather: w,
      delay: d,
    },
  };
};