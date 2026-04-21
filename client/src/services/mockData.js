export const MOCK_SHIPMENTS = [
  {
    id: 'SHP-10042',
    origin: { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    destination: { name: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
    status: 'In Transit',
    currentLocation: { lat: 41.5, lng: -72.5 },
    etas: { original: '14:30 EST', updated: '16:45 EST' },
    riskFactors: {
      traffic: 65,
      weather: 20,
      delay: 15
    },
    riskScore: 'High',
    currentCost: 1200,
    potentialLoss: 450,
  },
  {
    id: 'SHP-88391',
    origin: { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
    destination: { name: 'Detroit, MI', lat: 42.3314, lng: -83.0458 },
    status: 'In Transit',
    currentLocation: { lat: 41.9, lng: -85.5 },
    etas: { original: '10:00 CST', updated: '10:15 CST' },
    riskFactors: {
      traffic: 10,
      weather: 80,
      delay: 10
    },
    riskScore: 'Medium',
    currentCost: 800,
    potentialLoss: 120,
  }
];

export const MOCK_AI_INSIGHTS = {
  'SHP-10042': {
    summary: "A 20% increase in traffic will push the system into a high-risk zone, requiring proactive rerouting.",
    dominantFactor: "Traffic contributes 65% of total risk, making it the primary cause of delay.",
    explanation: "The Gemini AI engine analyzed real-time traffic feeds, historical delay patterns, and current fuel cost indices. Based on this data, it determined that rerouting via I-90 W offers the optimal balance between delivery speed and cost efficiency. Staying on the current route poses a high probability of SLA breach.",
    keyFactors: ['Traffic', 'Delay', 'SLA', 'Reroute'],
    actions: [
      {
        type: 'Reroute',
        description: 'Reroute via I-90 W (Faster Route)',
        tradeOff: 'Reduces delay by 45 mins but increases fuel cost by 15%.',
        costImpact: '+ $180',
        recommended: true
      },
      {
        type: 'Delay',
        description: 'Delay shipment until peak traffic clears.',
        tradeOff: 'Saves fuel cost, but risks SLA violation for high-priority delivery.',
        costImpact: '- $0',
        recommended: false
      }
    ]
  },
  'SHP-88391': {
    summary: "Severe weather ahead poses moderate risk. Shipment may experience minor delays near Detroit.",
    dominantFactor: "Weather contributes 80% of total risk due to incoming storm system.",
    explanation: "Meteorological data fed into the AI model indicates a storm system approaching the Detroit corridor. While traffic congestion remains low, the weather factor dominates this shipment's risk profile. A brief delay of 15 minutes is expected and within SLA tolerance. No rerouting is currently recommended.",
    keyFactors: ['Weather', 'Risk', 'Delay', 'Cost'],
    actions: [
      {
        type: 'Monitor',
        description: 'Continue on current route and monitor weather updates every 15 minutes.',
        tradeOff: 'Low cost impact but requires active monitoring to catch any escalation.',
        costImpact: '- $0',
        recommended: true
      },
      {
        type: 'Reroute',
        description: 'Take southern bypass to avoid storm zone entirely.',
        tradeOff: 'Adds 30 minutes to route but guarantees on-time delivery.',
        costImpact: '+ $95',
        recommended: false
      }
    ]
  }
};

export const MOCK_ROUTE_HISTORY = [
  {
    id: 'SHP-10042',
    route: 'New York, NY → Boston, MA via I-90 W',
    decision: 'Reroute',
    riskLevel: 'High',
    timestamp: '2026-04-20T14:32:00Z',
    costImpact: '+$180',
  },
  {
    id: 'SHP-88391',
    route: 'Chicago, IL → Detroit, MI (Direct)',
    decision: 'Monitor',
    riskLevel: 'Medium',
    timestamp: '2026-04-20T10:15:00Z',
    costImpact: '$0',
  },
  {
    id: 'SHP-55120',
    route: 'Dallas, TX → Houston, TX via I-45 S',
    decision: 'Continue',
    riskLevel: 'Low',
    timestamp: '2026-04-19T22:10:00Z',
    costImpact: '$0',
  },
  {
    id: 'SHP-10042',
    route: 'New York, NY → Boston, MA (Original)',
    decision: 'Delay',
    riskLevel: 'High',
    timestamp: '2026-04-19T08:45:00Z',
    costImpact: '-$60',
  },
  {
    id: 'SHP-77210',
    route: 'Los Angeles, CA → San Francisco, CA via US-101',
    decision: 'Reroute',
    riskLevel: 'Medium',
    timestamp: '2026-04-18T16:20:00Z',
    costImpact: '+$95',
  },
  {
    id: 'SHP-33045',
    route: 'Miami, FL → Orlando, FL via FL Turnpike',
    decision: 'Continue',
    riskLevel: 'Low',
    timestamp: '2026-04-18T09:00:00Z',
    costImpact: '$0',
  },
];

export const simulateScenarios = async (scenarios) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  return scenarios.map(scenario => {
    const trf = parseInt(scenario.traffic, 10) || 0;
    const dly = parseInt(scenario.delay, 10) || 0;
    
    const rawRisk = (trf * 0.4) + (dly * 0.6);
    const risk = Math.min(100, Math.round(rawRisk));
    
    const baseCost = 800;
    const cost = Math.round(baseCost + (trf * 2.5) + (dly * 8.0));
    
    let decision = 'Continue';
    if (risk > 75) decision = 'Reroute';
    else if (risk > 50) decision = 'Delay';
    else if (risk > 30) decision = 'Monitor';

    return {
      name: `Scenario ${scenario.id}`,
      id: scenario.id,
      risk,
      cost,
      decision,
      traffic: trf,
      delay: dly
    };
  });
};

export const simulateAdvancedScenarios = async (payload) => {
  const { baseInput, scenarios } = payload;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const calculateMetrics = (trf, dly) => {
    const rawRisk = (trf * 0.4) + (dly * 0.6);
    const risk = Math.min(100, Math.round(rawRisk));
    const baseCost = 800;
    const cost = Math.round(baseCost + (trf * 2.5) + (dly * 8.0));
    
    let decision = 'Continue';
    let riskLevel = 'Low';
    if (risk > 75) { decision = 'Reroute'; riskLevel = 'Critical'; }
    else if (risk > 50) { decision = 'Delay'; riskLevel = 'High'; }
    else if (risk > 30) { decision = 'Monitor'; riskLevel = 'Medium'; }

    return { risk, cost, decision, riskLevel, traffic: trf, delay: dly };
  };

  const baseMetrics = calculateMetrics(parseInt(baseInput.traffic, 10), parseInt(baseInput.delay, 10));

  const results = scenarios.map(scenario => {
    const simMetrics = calculateMetrics(parseInt(scenario.traffic, 10), parseInt(scenario.delay, 10));
    
    const riskChange = simMetrics.risk - baseMetrics.risk;
    const costChange = simMetrics.cost - baseMetrics.cost;
    const decisionChange = baseMetrics.decision !== simMetrics.decision ? `${baseMetrics.decision} → ${simMetrics.decision}` : simMetrics.decision;
    
    // Simple impact score (0-100), higher is worse change
    let impactScore = Math.min(100, Math.max(0, 50 + (riskChange * 0.5) + (costChange / 10)));
    
    return {
      id: scenario.id,
      name: `Scenario ${scenario.id}`,
      original: { ...baseMetrics },
      simulated: { ...simMetrics },
      difference: {
        riskChange,
        costChange,
        decisionChange
      },
      impactScore: Math.round(impactScore)
    };
  });

  return results;
};

