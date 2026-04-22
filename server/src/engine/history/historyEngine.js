/**
 * historyEngine.js
 * Tracks shipment decisions and suggestions.
 */
import { shipmentHistory } from "../../data/history.js";

// Ensure a standard format when adding history
export const addHistory = (record) => {
  const newRecord = {
    shipmentId: record.shipmentId || `SHP-${Date.now()}`,
    route: record.route || "Unknown Route",
    decision: record.decision || "UNKNOWN",
    riskScore: record.riskScore || 0,
    costImpact: record.costImpact || "$0",
    timestamp: new Date().toISOString(),
  };
  
  shipmentHistory.push(newRecord);
  return newRecord;
};

export const getHistory = () => {
  return shipmentHistory;
};

export const getHistoryByShipment = (id) => {
  return shipmentHistory.filter(record => record.shipmentId === id);
};
