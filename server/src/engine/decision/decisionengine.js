// ------------------------------
// CONSTANT MAPS
// ------------------------------
const ACTION_MAP = {
  Low: "PROCEED",
  Medium: "MONITOR",
  High: "REROUTE",
};

const PRIORITY_MAP = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
};

const ADVISORY_MAP = {
  Low: "Conditions are stable. Proceed normally.",
  Medium: "Moderate risk detected. Monitor conditions closely.",
  High: "High risk detected. Consider rerouting or delaying.",
};

// ------------------------------
// VALIDATION
// ------------------------------
const isValidRiskResult = (risk) => {
  return (
    risk &&
    typeof risk.score === "number" &&
    ["Low", "Medium", "High"].includes(risk.level)
  );
};

// ------------------------------
// SAFE VALUE HELPER
// ------------------------------
const getSafeValue = (map, key, fallback = "UNKNOWN") =>
  map[key] || fallback;

// ------------------------------
// MAIN DECISION ENGINE
// ------------------------------
export const makeDecision = (riskResult) => {
  if (!isValidRiskResult(riskResult)) {
    throw new Error(
      "Invalid riskResult: expected { score: number, level: 'Low' | 'Medium' | 'High' }"
    );
  }

  const { score, level, breakdown } = riskResult;

  let action = getSafeValue(ACTION_MAP, level);
  let priority = getSafeValue(PRIORITY_MAP, level);
  let advisory = getSafeValue(ADVISORY_MAP, level);

  // 🔥 Smart overrides (AI-like behavior)

  // Extreme condition
  if (level === "High" && score > 85) {
    action = "IMMEDIATE_HALT";
    advisory = "Extreme risk detected. Stop all operations immediately.";
  }

  // Weather-based override
  if (breakdown?.weather > 40) {
    action = "DELAY_DUE_TO_WEATHER";
    advisory = "Severe weather impact detected. Delay recommended.";
  }

  return {
    action,
    priority,
    advisory,
    score,
    level,

    // Explainability
    reason: `Decision based on ${level} risk (${score})`,

    timestamp: new Date().toISOString(),
  };
};