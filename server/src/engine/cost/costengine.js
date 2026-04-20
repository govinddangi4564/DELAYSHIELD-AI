/**
 * costEngine.js
 * Advanced cost analysis engine for DelayShield AI.
 */

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

const PRICING = {
  fuelPerKm: 8,
  driverPerHour: 100,
};

const MIN_SAVINGS_THRESHOLD = 50;

// ─────────────────────────────────────────────
// MULTIPLIERS
// ─────────────────────────────────────────────

const PRIORITY_MULTIPLIER = {
  High: 2.0,
  Medium: 1.5,
  Low: 1.0,
};

const RISK_MULTIPLIER = {
  High: 1.5,
  Medium: 1.2,
  Low: 1.0,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const toKm = (meters) => meters / 1000;
const toHours = (seconds) => seconds / 3600;

const safeNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const resolveMultiplier = (map, key) => map[key] ?? 1.0;

// ─────────────────────────────────────────────
// COST CALCULATIONS
// ─────────────────────────────────────────────

const calcNoActionCost = (delay, priorityMultiplier, riskMultiplier) => {
  const baseCost = delay * 10;
  const noActionCost = baseCost * priorityMultiplier * riskMultiplier;
  return { baseCost, noActionCost };
};

const calcRerouteCost = (routeData) => {
  if (
    !routeData ||
    typeof routeData !== "object" ||
    routeData.distance == null ||
    routeData.duration == null
  ) {
    return null;
  }

  const distanceKm = toKm(safeNumber(routeData.distance));
  const durationHours = toHours(safeNumber(routeData.duration));

  const fuelCost = distanceKm * PRICING.fuelPerKm;
  const timeCost = durationHours * PRICING.driverPerHour;
  const rerouteCost = fuelCost + timeCost;

  return { fuelCost, timeCost, rerouteCost };
};

// ─────────────────────────────────────────────
// RECOMMENDATION
// ─────────────────────────────────────────────

const getRecommendation = (savings, riskLevel) => {
  if (riskLevel === "High" && savings > 0) return "REROUTE";

  if (savings !== null && savings > MIN_SAVINGS_THRESHOLD) {
    return "REROUTE";
  }

  return "MONITOR";
};

// ─────────────────────────────────────────────
// CONFIDENCE
// ─────────────────────────────────────────────

const getConfidence = ({ routeData, delay }) => {
  if (routeData && delay > 0) return "High";
  if (routeData || delay > 0) return "Medium";
  return "Low";
};

// ─────────────────────────────────────────────
// CORE FUNCTION
// ─────────────────────────────────────────────

export const calculateCostImpact = ({
  delay = 0,
  priority = "Low",
  riskLevel = "Low",
  routeData = null,
  aiRouteSuggestion = null,
} = {}) => {

  // Normalize inputs
  const normalizedDelay = safeNumber(delay);
  const priorityMultiplier = resolveMultiplier(PRIORITY_MULTIPLIER, priority);
  const riskMultiplier = resolveMultiplier(RISK_MULTIPLIER, riskLevel);

  // No action cost
  const { baseCost, noActionCost } = calcNoActionCost(
    normalizedDelay,
    priorityMultiplier,
    riskMultiplier
  );

  // Reroute cost
  const rerouteResult = calcRerouteCost(routeData);

  // Savings
  const savings =
    rerouteResult !== null
      ? noActionCost - rerouteResult.rerouteCost
      : null;

  // Recommendation
  const recommendation = getRecommendation(savings, riskLevel);

  // Confidence
  const confidence = getConfidence({
    routeData,
    delay: normalizedDelay,
  });

  // Breakdown
  const breakdown = {
    baseCost: Math.round(baseCost),
    priorityMultiplier,
    riskMultiplier,
    ...(rerouteResult && {
      fuelCost: Math.round(rerouteResult.fuelCost),
      timeCost: Math.round(rerouteResult.timeCost),
    }),
  };

  // Final response
  return {
    noActionCost: Math.round(noActionCost),
    rerouteCost:
      rerouteResult !== null
        ? Math.round(rerouteResult.rerouteCost)
        : null,
    savings: savings !== null ? Math.round(savings) : null,
    currency: "INR",
    recommendation,
    confidence,
    ...(aiRouteSuggestion && { suggestedRoute: aiRouteSuggestion }),
    breakdown,
  };
};