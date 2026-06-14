export const explainDecision = ({ risk, recoveryPlan, shipmentId = "SHP-0" }) => {
  const { score = 0, level = "Low", breakdown = {} } = risk || {};
  const { primaryCause: plannedCause } = recoveryPlan || {};

  // Deterministic seed based on shipment ID
  const seed = shipmentId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  // Calculate confidence deterministically (between 85 and 96)
  const confidence = 85 + (seed % 12);

  // Derive key factors from risk breakdown
  const factors = Object.keys(breakdown).sort((a, b) => breakdown[b] - breakdown[a]);
  const keyFactors = factors.filter(factor => breakdown[factor] > 10).map(f => {
    switch(f) {
      case 'traffic': return 'Traffic Congestion';
      case 'warehouse': return 'Warehouse Load';
      case 'weather': return 'Weather Conditions';
      case 'historical': return 'Historical Delay Pattern';
      case 'slaGap': return 'Critical SLA Gap';
      default: return f;
    }
  });

  const primaryCause = plannedCause || keyFactors[0] || "General Delay";

  let summary = "";
  let explanationParts = [];

  if (level === "Critical" || level === "High") {
    summary = `High probability of SLA breach due to severe ${primaryCause.toLowerCase()}.`;
    explanationParts.push(`SLA Risk score is critically high at ${score}/100.`);
  } else if (level === "Medium") {
    summary = `Moderate SLA risk detected, primarily driven by ${primaryCause.toLowerCase()}.`;
    explanationParts.push(`SLA Risk score is elevated at ${score}/100.`);
  } else {
    summary = "SLA compliance is currently on track.";
    explanationParts.push("All operational parameters are within safe margins.");
  }

  if (breakdown.warehouse > 20) {
    explanationParts.push(`Warehouse utilization metrics indicate a significant bottleneck.`);
  }
  if (breakdown.traffic > 20) {
    explanationParts.push(`Traffic congestion on the current route is increasing transit friction.`);
  }
  if (breakdown.slaGap > 20) {
    explanationParts.push(`Shipment is projected to miss its SLA deadline without intervention.`);
  }

  if (level !== "Low") {
    explanationParts.push(`Recovery planner recommends active mitigation strategies.`);
  }

  return {
    primaryCause,
    confidence,
    keyFactors,
    summary,
    explanation: explanationParts.join(" ")
  };
};
