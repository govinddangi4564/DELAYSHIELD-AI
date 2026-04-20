/**
 * simulateTraffic.js (ADVANCED VERSION)
 * Realistic traffic simulator for DelayShield AI
 */

// ─────────────────────────────────────────────
// TIME WINDOWS
// ─────────────────────────────────────────────

const TIME_WINDOWS = [
  { label: "Evening Peak", from: 17, to: 21, range: [70, 90] },
  { label: "Morning Peak", from: 8, to: 11, range: [60, 80] },
  { label: "Afternoon", from: 12, to: 16, range: [40, 60] },
  { label: "Early Morning", from: 6, to: 7, range: [30, 50] },
  { label: "Night", from: 22, to: 24, range: [10, 30] },
  { label: "Late Night", from: 0, to: 5, range: [10, 30] },
];

// ─────────────────────────────────────────────
// INTENSITY
// ─────────────────────────────────────────────

const INTENSITY_OFFSET = {
  low: -20,
  medium: 0,
  high: +20,
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const clamp = (value) => Math.min(100, Math.max(0, value));

const resolveTimeWindow = (hour) => {
  return (
    TIME_WINDOWS.find(({ from, to }) => hour >= from && hour < to) || {
      label: "Default",
      range: [35, 55],
    }
  );
};

// 🟣 Day Factor (NEW)
const getDayFactor = () => {
  const day = new Date().getDay(); // 0 = Sunday

  if (day === 0 || day === 6) {
    return -10; // Weekend → less traffic
  }

  return +10; // Weekday → more traffic
};

// 🟣 City Factor (NEW)
const getCityFactor = (city = "default") => {
  const map = {
    Mumbai: +15,
    Delhi: +12,
    Bangalore: +10,
    Bhopal: +5,
    default: 0,
  };

  return map[city] ?? 0;
};

// 🟣 Traffic Spike
const trafficEventSpike = () => {
  if (Math.random() < 0.1) {
    return randomInt(15, 25);
  }
  return 0;
};

// ─────────────────────────────────────────────
// CORE FUNCTION
// ─────────────────────────────────────────────

/**
 * @param {"low" | "medium" | "high"} intensity
 * @param {number} weatherScore (0–100)
 * @param {string} city
 * @param {boolean} debug
 */

export const simulateTraffic = (
  intensity = "medium",
  weatherScore = 0,
  city = "default",
  debug = false
) => {
  const hour = new Date().getHours();

  // Step 1: Time window
  const { range, label } = resolveTimeWindow(hour);
  const [baseMin, baseMax] = range;

  // Step 2: Factors
  const intensityOffset = INTENSITY_OFFSET[intensity] ?? 0;
  const dayFactor = getDayFactor();
  const cityFactor = getCityFactor(city);

  // Weather impact (scaled)
  const weatherImpact = Math.floor(weatherScore * 0.3);

  // Step 3: Adjusted range
  const shiftedMin = baseMin + intensityOffset + dayFactor + cityFactor;
  const shiftedMax = baseMax + intensityOffset + dayFactor + cityFactor;

  // Step 4: Base value
  const base = randomInt(shiftedMin, shiftedMax);

  // Step 5: Variation
  const variation = randomInt(-15, 15);

  // Step 6: Event spike
  const spike = trafficEventSpike();

  // Step 7: Final value
  const final = clamp(base + variation + spike + weatherImpact);

  // Debug mode
  if (debug) {
    return {
      final,
      breakdown: {
        timeWindow: label,
        base,
        variation,
        spike,
        weatherImpact,
        dayFactor,
        cityFactor,
        intensityOffset,
        hour,
      },
    };
  }

  return final;
};