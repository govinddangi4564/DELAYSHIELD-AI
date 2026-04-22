/**
 * alertEngine.js
 * Proactive Alert System for DelayShield AI.
 * Unifies AI Insights, Risk Engine, and Decision Outcomes.
 */

export const generateAlert = ({ risk = {}, decision = {}, aiInsights = null }) => {
  const { score = 0, level = "Low" } = risk;
  const action = decision.action || "MONITOR";
  
  // 1. AI-Driven "Deep Insight" Alert (Highest Priority)
  if (aiInsights && aiInsights.summary && (score > 40 || action !== "CONTINUE")) {
    return {
      alert: true,
      type: "AI_INSIGHT",
      message: aiInsights.summary,
      severity: level,
      action: action,
      timestamp: new Date().toISOString()
    };
  }

  // 2. High Risk / Reroute Protocol
  if (score > 70 || action === "REROUTE") {
    return {
      alert: true,
      type: "CRITICAL",
      message: "Tactical Reroute required due to high operational risk factors.",
      severity: "High",
      action: "REROUTE",
      timestamp: new Date().toISOString()
    };
  }
  
  // 3. Moderate Monitoring Alert
  if (score > 40 || action === "MONITOR") {
    return {
      alert: true,
      type: "MONITORING",
      message: "Enhanced surveillance active. Moderate risk detected in next transit sector.",
      severity: "Medium",
      action: "MONITOR",
      timestamp: new Date().toISOString()
    };
  }

  // 4. Baseline Operational Status
  return {
    alert: false,
    type: "NORMAL",
    message: "Operational conditions are stable. Tactical surveillance active.",
    severity: "Low",
    action: "CONTINUE",
    timestamp: new Date().toISOString()
  };
};
