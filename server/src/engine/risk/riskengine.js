// ------------------------------
// NEW WEIGHTS
// ------------------------------
const DEFAULT_WEIGHTS = {
  traffic: 0.25,
  weather: 0.15,
  warehouse: 0.25,
  historicalDelay: 0.10,
  slaGap: 0.25,
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
  if (score <= 85) return "High";
  return "Critical";
};

// ------------------------------
// SLA GAP CALCULATION
// ------------------------------
const calculateSLAGap = (currentETA, slaDeadline) => {
  if (!currentETA || !slaDeadline) return 0;
  
  try {
    const eta = new Date(currentETA);
    const deadline = new Date(slaDeadline);
    
    // Difference in milliseconds
    const diffMs = eta.getTime() - deadline.getTime();
    
    // Difference in minutes
    const diffMins = diffMs / (1000 * 60);
    
    if (diffMins <= 0) return 0; // On time or early
    
    // Normalize to a 0-100 scale. 
    // E.g., if it's 100+ mins late, risk is 100.
    return Math.min(100, diffMins); 
  } catch (error) {
    return 0;
  }
};

// ------------------------------
// MAIN RISK CALCULATION FUNCTION
// ------------------------------
export const calculateRisk = (
  { traffic = 0, weather = 0, warehouse = 0, historicalDelay = 0, currentETA, slaDeadline } = {},
  weights = DEFAULT_WEIGHTS
) => {
  // Normalize inputs
  const t = normalizeInput(traffic);
  const w = normalizeInput(weather);
  const wh = normalizeInput(warehouse);
  const h = normalizeInput(historicalDelay);
  
  const rawSlaGap = calculateSLAGap(currentETA, slaDeadline);
  const sg = normalizeInput(rawSlaGap);

  // Calculate score
  const score = parseFloat(
    (
      weights.traffic * t +
      weights.weather * w +
      weights.warehouse * wh +
      weights.historicalDelay * h +
      weights.slaGap * sg
    ).toFixed(2)
  );

  const level = getRiskLevel(score);

  // Build response
  return {
    score: Math.round(score),
    level,
    breachProbability: parseFloat((score / 100).toFixed(2)),

    breakdown: {
      traffic: parseFloat((weights.traffic * t).toFixed(2)),
      weather: parseFloat((weights.weather * w).toFixed(2)),
      warehouse: parseFloat((weights.warehouse * wh).toFixed(2)),
      historical: parseFloat((weights.historicalDelay * h).toFixed(2)),
      slaGap: parseFloat((weights.slaGap * sg).toFixed(2)),
    }
  };
};