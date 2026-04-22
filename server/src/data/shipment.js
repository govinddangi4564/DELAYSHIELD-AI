/**
 * shipment.js
 * In-memory storage for DelayShield AI shipments.
 */

export const shipments = [
  {
    id: "SHP001",
    origin: { name: "Indore", lat: 22.7196, lon: 75.8577 },
    destination: { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
    traffic: 85,
    weather: 32,
    delay: 45,
    priority: "High",
    status: "Delayed",
    riskScore: 78
  },
  {
    id: "SHP002",
    origin: { name: "Delhi", lat: 28.6139, lon: 77.2090 },
    destination: { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
    traffic: 42,
    weather: 25,
    delay: 10,
    priority: "Medium",
    status: "On Time",
    riskScore: 35
  },
  {
    id: "SHP003",
    origin: { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    destination: { name: "Pune", lat: 18.5204, lon: 73.8567 },
    traffic: 92,
    weather: 18,
    delay: 60,
    priority: "Critical",
    status: "High Risk",
    riskScore: 94
  },
  {
    id: "SHP004",
    origin: { name: "Chennai", lat: 13.0827, lon: 80.2707 },
    destination: { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
    traffic: 15,
    weather: 28,
    delay: 0,
    priority: "Low",
    status: "On Time",
    riskScore: 12
  },
  {
    id: "SHP005",
    origin: { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
    destination: { name: "Surat", lat: 21.1702, lon: 72.8311 },
    traffic: 55,
    weather: 35,
    delay: 20,
    priority: "Medium",
    status: "Monitoring",
    riskScore: 52
  },
  {
    id: "SHP006",
    origin: { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
    destination: { name: "Haldia", lat: 22.0667, lon: 88.0667 },
    traffic: 70,
    weather: 40,
    delay: 35,
    priority: "High",
    status: "Risk Detected",
    riskScore: 72
  }
];