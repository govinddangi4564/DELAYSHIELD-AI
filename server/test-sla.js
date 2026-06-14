const url = 'http://localhost:5000/api/sla/analyze';

const now = new Date();
const deadline = new Date(now.getTime() + 60 * 60 * 1000); // SLA in 1 hour
const onTimeETA = new Date(now.getTime() + 45 * 60 * 1000); // 45 mins (On time)
const lateETA = new Date(now.getTime() + 150 * 60 * 1000); // 2.5 hours (90 mins late)
const criticalETA = new Date(now.getTime() + 300 * 60 * 1000); // 5 hours (4 hours late)

const scenarios = [
  {
    name: "Healthy Scenario",
    payload: {
      shipmentId: "SHP-HEALTHY",
      traffic: 20,
      weather: 10,
      warehouse: 30,
      historicalDelay: 10,
      currentETA: onTimeETA.toISOString(),
      slaDeadline: deadline.toISOString()
    }
  },
  {
    name: "Traffic Congestion",
    payload: {
      shipmentId: "SHP-TRAFFIC",
      traffic: 95,
      weather: 30,
      warehouse: 40,
      historicalDelay: 60,
      currentETA: lateETA.toISOString(),
      slaDeadline: deadline.toISOString()
    }
  },
  {
    name: "Warehouse Congestion",
    payload: {
      shipmentId: "SHP-WAREHOUSE",
      traffic: 40,
      weather: 10,
      warehouse: 95,
      historicalDelay: 20,
      currentETA: lateETA.toISOString(),
      slaDeadline: deadline.toISOString()
    }
  },
  {
    name: "Critical Failure (Everything High)",
    payload: {
      shipmentId: "SHP-CRITICAL",
      traffic: 100,
      weather: 80,
      warehouse: 100,
      historicalDelay: 100,
      currentETA: criticalETA.toISOString(),
      slaDeadline: deadline.toISOString()
    }
  }
];

async function run() {
  for (const s of scenarios) {
    console.log(`\n==============================================`);
    console.log(`SCENARIO: ${s.name}`);
    console.log(`==============================================`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s.payload)
      });
      const data = await res.json();
      console.log(JSON.stringify(data.data, null, 2));
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}

run();
