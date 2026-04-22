export const explainDecision = ({ risk, decision, cost, shipmentId = "SHP-0" }) => {
  const { score = 0, level = "Low", breakdown = {} } = risk || {};
  const { action = "CONTINUE" } = decision || {};
  const { savings = 0 } = cost || {};

  // Deterministic seed based on shipment ID
  const seed = shipmentId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  const vocab = {
    traffic: [
      "Heavy congestion detected on primary arterial roads.",
      "Significant traffic density is impacting transit velocity.",
      "Regional gridlock observed near major highway interchanges.",
      "Slow-moving traffic clusters are hindering the scheduled flow.",
      "Traffic telemetry indicates a 40% increase in regional congestion.",
      "Arterial bottlenecks identified on the upcoming highway segment.",
      "Urban density is causing a projected 20-minute transit friction.",
      "Vehicle density has exceeded baseline safety parameters for this route."
    ],
    weather: [
      "Adverse atmospheric conditions are reducing operational safety.",
      "Challenging weather patterns are affecting road surface friction.",
      "Visibility-limiting conditions are present on the current corridor.",
      "Unstable weather fronts are increasing the risk of transit delay.",
      "Precipitation patterns suggest a high risk of hydroplaning.",
      "Severe crosswinds detected on elevated highway sections.",
      "Atmospheric instability is impacting the projected transit window.",
      "Localized weather events are causing a strategic slowdown."
    ],
    delay: [
      "Historical data indicates a trend of recurring delays in this sector.",
      "Real-time tracking suggests a deviation from the scheduled ETA.",
      "Unforeseen transit friction is causing a schedule slip.",
      "Temporal anomalies in the route data indicate potential lateness.",
      "Historical predictive models suggest a high risk of sector delay.",
      "Transit cadence has dropped below the critical 60km/h threshold.",
      "Logistics heartbeat monitoring shows a schedule deviation.",
      "Previous transit logs for this hour indicate frequent bottlenecks."
    ],
    stable: [
      "Route conditions are currently within optimal safety parameters.",
      "Operating environment is stable with high transit certainty.",
      "Current trajectory is clear of significant operational friction.",
      "Stable conditions confirmed across all primary telemetry nodes.",
      "No critical anomalies detected in the current transit window.",
      "Baseline performance metrics are being maintained successfully.",
      "Trajectory confirmed as the most efficient path for current priority.",
      "Security and safety sensors report a clean operating environment."
    ]
  };

  const getPhrase = (pool, offset = 0) => {
    return pool[(seed + offset) % pool.length];
  };

  const factors = Object.keys(breakdown).sort((a, b) => breakdown[b] - breakdown[a]);
  const keyFactors = factors.filter(factor => breakdown[factor] > 20);

  let explanationParts = [];

  if (level === "High") {
    explanationParts.push(`CRITICAL ALERT: ${getPhrase(vocab[keyFactors[0] || 'delay'])}`);
    explanationParts.push(`With a safety score of ${score}, immediate tactical intervention is required to protect the cargo.`);
  } else if (level === "Medium") {
    explanationParts.push(getPhrase(vocab[keyFactors[0] || 'traffic'], 1));
    explanationParts.push("Situational conditions are moderate; strategic monitoring is advised to maintain schedule integrity.");
  } else {
    explanationParts.push(getPhrase(vocab.stable, 2));
    explanationParts.push("The system continues to track potential anomalies in the background.");
  }

  if (action === "REROUTE" && savings > 0) {
    explanationParts.push(`Transitioning to an alternate path is projected to optimize cost by roughly INR ${savings}.`);
  }

  const summaryPool = {
    REROUTE: [
      `Tactical Reroute: Bypassing ${keyFactors[0] || 'congestion'}`, 
      `Route Optimization: Evading ${keyFactors[0] || 'risk'}`,
      `Strategic Re-entry: Optimized path found`,
      `Path Deviation: Mitigating ${keyFactors[0] || 'friction'}`
    ],
    MONITOR: [
      `Vigilance Mode: ${keyFactors[0] || 'Telemetry'} analysis active`, 
      `Observation: Tracking ${keyFactors[0] || 'fluctuations'}`,
      `Telemetry Check: Monitoring ${keyFactors[0] || 'cadence'}`,
      `Surveillance: Active risk tracking`
    ],
    CONTINUE: [
      "Standard Transit: Baseline operations", 
      "Normal Flow: Conditions stable",
      "Nominal Operations: On track",
      "Trajectory Locked: No deviation"
    ]
  };

  const sp = summaryPool[action] || summaryPool.CONTINUE;
  const summary = sp[seed % sp.length];

  return {
    explanation: explanationParts.join(" "),
    keyFactors,
    summary
  };
};
