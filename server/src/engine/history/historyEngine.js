import { shipmentHistory } from '../../data/history.js'

export const addHistory = (record) => {
  const newRecord = {
    shipmentId: record.shipmentId || `SHP-${Date.now()}`,
    userId: record.userId ?? null,
    route: record.route || 'Unknown Route',
    decision: record.decision || 'UNKNOWN',
    riskScore: record.riskScore || 0,
    costImpact: record.costImpact || 'INR 0',
    timestamp: new Date().toISOString(),
  }

  shipmentHistory.push(newRecord)
  return newRecord
}

export const getHistory = (userId = null) => {
  if (userId === null || userId === undefined) return shipmentHistory
  return shipmentHistory.filter((record) => record.userId === userId)
}

export const getHistoryByShipment = (shipmentId, userId = null) => {
  return shipmentHistory.filter((record) =>
    record.shipmentId === shipmentId && (userId === null || record.userId === userId)
  )
}
