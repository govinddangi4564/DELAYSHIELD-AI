/**
 * In-memory storage for DelayShield AI shipment histories.
 */

// Seeding with diverse past decisions for demo visibility
export const shipmentHistory = [
  {
    shipmentId: "SHP001",
    route: "NH52 via Dewas-Bhopal Corridor",
    decision: "Reroute",
    riskScore: 78,
    costImpact: "+$850",
    timestamp: "2026-04-20T10:30:00Z"
  },
  {
    shipmentId: "SHP002",
    route: "NH48 Delhi-Jaipur Expressway",
    decision: "Monitor",
    riskScore: 42,
    costImpact: "$0",
    timestamp: "2026-04-20T14:15:00Z"
  },
  {
    shipmentId: "SHP003",
    route: "Mumbai-Pune Expressway (NH4)",
    decision: "Reroute",
    riskScore: 92,
    costImpact: "+$1200",
    timestamp: "2026-04-21T09:00:00Z"
  },
  {
    shipmentId: "SHP004",
    route: "NH16 Chennai-Bangalore Hwy",
    decision: "Continue",
    riskScore: 15,
    costImpact: "-$450",
    timestamp: "2026-04-21T11:45:00Z"
  },
  {
    shipmentId: "SHP005",
    route: "NH8 Ahmedabad-Surat Section",
    decision: "Monitor",
    riskScore: 55,
    costImpact: "$0",
    timestamp: "2026-04-21T15:20:00Z"
  }
];
