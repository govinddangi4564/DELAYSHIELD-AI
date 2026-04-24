import axios from "axios";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

const isValidCoord = (coord) =>
  Array.isArray(coord)
  && coord.length >= 2
  && Number.isFinite(Number(coord[0]))
  && Number.isFinite(Number(coord[1]));

const normalizeCoord = (coord) => [Number(coord[0]), Number(coord[1])];

const cleanRoadName = (value) => String(value || '').trim();

const dedupeRoadNames = (names = [], limit = 6) => {
  const seen = new Set();
  const result = [];

  names.forEach((name) => {
    const cleaned = cleanRoadName(name);
    if (!cleaned || cleaned === '-') return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });

  return result.slice(0, limit);
};

const lineDistanceMeters = (start, end) => {
  const [sLon, sLat] = start;
  const [eLon, eLat] = end;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(eLat - sLat);
  const dLon = toRad(eLon - sLon);
  const lat1 = toRad(sLat);
  const lat2 = toRad(eLat);

  const a = (Math.sin(dLat / 2) ** 2)
    + (Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon / 2) ** 2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const interpolateLine = (start, end, segments = 18) => {
  const [sLon, sLat] = start;
  const [eLon, eLat] = end;
  const coordinates = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    coordinates.push([
      sLon + ((eLon - sLon) * t),
      sLat + ((eLat - sLat) * t),
    ]);
  }

  return coordinates;
};

/**
 * Deterministic fallback when external routing providers are unavailable.
 */
const simulateHighwayPath = (start, end) => {
  const safeStart = isValidCoord(start) ? normalizeCoord(start) : [0, 0];
  const safeEnd = isValidCoord(end) ? normalizeCoord(end) : [0, 0];
  const distance = lineDistanceMeters(safeStart, safeEnd);
  const duration = distance / 12.5;

  return {
    isSimulated: true,
    source: "fallback-straight-line",
    distance,
    duration,
    geometry: {
      type: "LineString",
      coordinates: interpolateLine(safeStart, safeEnd)
    },
    majorRoads: ["NH Corridor"],
    suggestedAltRoads: ["NH-Alt-A", "NH-Alt-B"]
  };
};

const fetchRoute = async (start, end, waypoints = null) => {
  const coords = waypoints ? [start, waypoints, end] : [start, end];
  const response = await axios({
    method: 'post',
    url: ORS_URL,
    data: {
      coordinates: coords,
      preference: 'fastest',
      units: 'm',
      radiuses: waypoints ? [5000, 5000, 5000] : [5000, 5000]
    },
    headers: {
      'Accept': 'application/json, application/geo+json',
      'Authorization': process.env.ROUTE_API_KEY,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  });
  return response.data.routes[0];
};

const fetchOsrmRoute = async (start, end) => {
  const [sLon, sLat] = start;
  const [eLon, eLat] = end;
  const url = `${OSRM_URL}/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
  const response = await axios.get(url, { timeout: 5000 });
  const routes = response.data?.routes || [];
  return routes;
};

const extractRoadNames = (mainRoute) => {
  const segments = mainRoute?.segments || [];
  const names = segments.flatMap((segment) => (segment?.steps || [])
    .filter((step) => Number(step?.distance) >= 800 && cleanRoadName(step?.name) !== '-')
    .map((step) => step.name));

  return dedupeRoadNames(names);
};

const extractOsrmRoadNames = (route) => {
  const names = (route?.legs || []).flatMap((leg) => (leg?.steps || [])
    .filter((step) => Number(step?.distance) >= 800 && cleanRoadName(step?.name) !== '-')
    .map((step) => step.name));

  return dedupeRoadNames(names);
};

export const getRoute = async (start, end) => {
  // Guard for invalid coords
  if (!isValidCoord(start) || !isValidCoord(end)) return simulateHighwayPath(start, end);

  const normalizedStart = normalizeCoord(start);
  const normalizedEnd = normalizeCoord(end);
  let majorRoads = [];

  try {
    const mainRoute = await fetchRoute(normalizedStart, normalizedEnd);

    majorRoads = extractRoadNames(mainRoute);

    // Generate waypoints for alternatives
    const dLon = normalizedEnd[0] - normalizedStart[0];
    const dLat = normalizedEnd[1] - normalizedStart[1];
    const midLon = normalizedStart[0] + dLon / 2;
    const midLat = normalizedStart[1] + dLat / 2;
    const norm = Math.sqrt(dLat * dLat + dLon * dLon);

    let alt1Geometry = null;
    let alt2Geometry = null;
    let alt1RoadName = null;
    let alt2RoadName = null;

    if (norm > 0) {
      const uLat = -dLon / norm;
      const uLon = dLat / norm;

      const wp1 = [midLon + uLon * 0.2, midLat + uLat * 0.2];
      const wp2 = [midLon - uLon * 0.2, midLat - uLat * 0.2];

      const [alt1, alt2] = await Promise.all([
        fetchRoute(normalizedStart, normalizedEnd, wp1).catch(() => null),
        fetchRoute(normalizedStart, normalizedEnd, wp2).catch(() => null)
      ]);

      if (alt1) {
        alt1Geometry = alt1.geometry;
        alt1RoadName = extractRoadNames(alt1)[0] || null;
      }

      if (alt2) {
        alt2Geometry = alt2.geometry;
        alt2RoadName = extractRoadNames(alt2)[0] || null;
      }
    }

    const suggestedAltRoads = [
      alt1RoadName,
      alt2RoadName,
      majorRoads[1],
      majorRoads[2],
      'NH Alternate Corridor',
      'Regional Bypass',
    ].filter(Boolean).slice(0, 2);

    return {
      distance: mainRoute.summary.distance,
      duration: mainRoute.summary.duration,
      geometry: mainRoute.geometry,
      alt1Geometry,
      alt2Geometry,
      source: "openrouteservice",
      majorRoads: majorRoads.length > 0 ? majorRoads : ["NH Corridor"],
      suggestedAltRoads,
      isSimulated: false
    };
  } catch (orsError) {
    const errorBody = orsError.response?.data?.error || orsError.message;
    console.warn("[routeApi] ORS failed, trying OSRM fallback:", errorBody);

    try {
      const osrmRoutes = await fetchOsrmRoute(normalizedStart, normalizedEnd);
      const main = osrmRoutes[0];
      const alt1 = osrmRoutes[1];
      const alt2 = osrmRoutes[2];

      if (!main?.geometry?.coordinates?.length) {
        return simulateHighwayPath(normalizedStart, normalizedEnd);
      }

      const osrmMainRoads = extractOsrmRoadNames(main);
      majorRoads = osrmMainRoads.length > 0
        ? osrmMainRoads
        : (majorRoads.length > 0 ? majorRoads : ["Primary Road Corridor"]);

      const altRoad1 = extractOsrmRoadNames(alt1)[0];
      const altRoad2 = extractOsrmRoadNames(alt2)[0];
      const suggestedAltRoads = [
        altRoad1,
        altRoad2,
        majorRoads[1],
        majorRoads[2],
        "Bypass Corridor A",
        "Bypass Corridor B",
      ].filter(Boolean).slice(0, 2);

      return {
        distance: main.distance,
        duration: main.duration,
        geometry: main.geometry,
        alt1Geometry: alt1?.geometry || null,
        alt2Geometry: alt2?.geometry || null,
        source: "osrm",
        majorRoads,
        suggestedAltRoads,
        isSimulated: false
      };
    } catch (osrmError) {
      const osrmErrorBody = osrmError.response?.data?.message || osrmError.message;
      console.warn("[routeApi] OSRM failed, using deterministic fallback:", osrmErrorBody);
      return simulateHighwayPath(normalizedStart, normalizedEnd);
    }
  }
};