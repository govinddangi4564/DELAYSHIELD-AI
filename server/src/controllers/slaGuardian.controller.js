import { analyzeShipmentSLA } from '../engine/sla/slaGuardianEngine.js';

// Mock telemetry data generator for demonstration
const generateMockTelemetry = (shipmentId, override = {}) => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 60 * 60 * 1000); // SLA in 1 hour
  const eta = new Date(now.getTime() + 150 * 60 * 1000); // ETA in 2.5 hours (90 mins late)

  return {
    shipmentId: shipmentId || `SHP-${Math.floor(Math.random() * 90000) + 10000}`,
    origin: "Mumbai Warehouse A",
    destination: "Delhi Fulfillment Center",
    traffic: Math.floor(Math.random() * 60) + 40, // 40-100
    weather: Math.floor(Math.random() * 40), // 0-40
    warehouse: Math.floor(Math.random() * 60) + 40, // 40-100
    historicalDelay: Math.floor(Math.random() * 50) + 20, // 20-70
    currentETA: eta.toISOString(),
    slaDeadline: deadline.toISOString(),
    ...override
  };
};

export const getHighRiskShipments = async (req, res) => {
  try {
    // Generate 3 mock high-risk shipments
    const shipments = [
      generateMockTelemetry('SHP-33559', { warehouse: 95, traffic: 60 }),
      generateMockTelemetry('SHP-41872', { traffic: 85, weather: 20 }),
      generateMockTelemetry('SHP-29104', { historicalDelay: 80, traffic: 50 })
    ];

    const results = await Promise.all(shipments.map(analyzeShipmentSLA));

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("[SLA Controller Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShipmentSLA = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const telemetry = generateMockTelemetry(shipmentId);
    const result = await analyzeShipmentSLA(telemetry);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[SLA Controller Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const analyzeCustomSLA = async (req, res) => {
  try {
    const { shipmentId, origin, destination, traffic, weather, warehouse, historicalDelay, currentETA, slaDeadline } = req.body;
    
    // Fallback to mock data if any field is missing
    const telemetry = generateMockTelemetry(shipmentId, {
      origin,
      destination,
      traffic,
      weather,
      warehouse,
      historicalDelay,
      currentETA,
      slaDeadline
    });

    const result = await analyzeShipmentSLA(telemetry);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[SLA Controller Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
