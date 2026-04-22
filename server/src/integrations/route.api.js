import axios from "axios";

/**
 * High-fidelity highway simulator for Indian corridors
 */
const simulateHighwayPath = (start, end) => {
  const [sLon, sLat] = start;
  const [eLon, eLat] = end;
  
  // Create a realistic 3-point highway arc
  const midLat = (sLat + eLat) / 2 + (Math.random() > 0.5 ? 0.02 : -0.02);
  const midLon = (sLon + eLon) / 2 + (Math.random() > 0.5 ? 0.02 : -0.02);

  return {
    isSimulated: true,
    distance: 215000,
    duration: 14400,
    geometry: {
      type: "LineString",
      coordinates: [[sLon, sLat], [midLon, midLat], [eLon, eLat]]
    },
    majorRoads: ["NH Corridor"],
    suggestedAltRoads: ["NH-Alt-A", "NH-Alt-B"]
  };
};

const fetchRoute = async (start, end, waypoints = null) => {
  const coords = waypoints ? [start, waypoints, end] : [start, end];
  const response = await axios({
    method: 'post',
    url: "https://api.openrouteservice.org/v2/directions/driving-car",
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

export const getRoute = async (start, end) => {
  // Guard for invalid coords
  if (!start?.[0] || !end?.[0]) return simulateHighwayPath(start, end);

  try {
    const mainRoute = await fetchRoute(start, end);

    let majorRoads = [];
    const segments = mainRoute.segments || [];
    if (segments.length > 0 && segments[0].steps) {
      majorRoads = [...new Set(segments[0].steps
        .filter(s => s.name && s.name !== '-' && s.distance > 1000)
        .map(s => s.name))];
    }

    // Generate waypoints for alternatives
    const dLon = end[0] - start[0];
    const dLat = end[1] - start[1];
    const midLon = start[0] + dLon/2;
    const midLat = start[1] + dLat/2;
    const norm = Math.sqrt(dLat*dLat + dLon*dLon);
    
    let alt1Geometry = null;
    let alt2Geometry = null;

    if (norm > 0) {
      const uLat = -dLon/norm;
      const uLon = dLat/norm;
      
      const wp1 = [midLon + uLon*0.2, midLat + uLat*0.2];
      const wp2 = [midLon - uLon*0.2, midLat - uLat*0.2];

      const [alt1, alt2] = await Promise.all([
        fetchRoute(start, end, wp1).catch(() => null),
        fetchRoute(start, end, wp2).catch(() => null)
      ]);
      
      if (alt1) alt1Geometry = alt1.geometry;
      if (alt2) alt2Geometry = alt2.geometry;
    }

    return {
      distance: mainRoute.summary.distance,
      duration: mainRoute.summary.duration,
      geometry: mainRoute.geometry,
      alt1Geometry,
      alt2Geometry,
      majorRoads: majorRoads.length > 0 ? majorRoads : ["NH Corridor"],
      suggestedAltRoads: ["NH-Alt-A", "NH-Alt-B"],
      isSimulated: false
    };
  } catch (error) {
    const errorBody = error.response?.data?.error || error.message;
    console.warn("[routeApi] Connection error, using tactical simulation:", errorBody);
    return simulateHighwayPath(start, end);
  }
};