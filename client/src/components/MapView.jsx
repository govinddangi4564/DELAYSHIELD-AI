import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import { MapPin, Route, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const decodePolyline = (encoded) => {
  if (!encoded) return [];

  if (typeof encoded === 'object' && encoded.coordinates) {
    return encoded.coordinates.map((coord) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  }

  if (Array.isArray(encoded)) {
    return encoded.map((coord) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  }

  if (typeof encoded !== 'string') return [];

  const poly = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return poly;
};

const getTrafficColor = (traffic) => {
  if (traffic >= 80) return { fill: '#ef4444', stroke: '#dc2626' };
  if (traffic >= 60) return { fill: '#f59e0b', stroke: '#d97706' };
  if (traffic >= 40) return { fill: '#3b82f6', stroke: '#2563eb' };
  return { fill: '#10b981', stroke: '#059669' };
};

const geometrySignature = (geometry) => JSON.stringify(geometry?.coordinates ?? []);

const buildOsrmUrl = (coordinates) => {
  const coords = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
  return `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=false`;
};

const fetchOsrmRoute = async (coordinates, signal) => {
  const response = await fetch(buildOsrmUrl(coordinates), { signal });
  if (!response.ok) throw new Error('OSRM route request failed');
  const payload = await response.json();
  return payload.routes ?? [];
};

const buildAlternateWaypoints = (start, end) => {
  const [startLng, startLat] = [start.lng, start.lat];
  const [endLng, endLat] = [end.lng, end.lat];
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;
  const norm = Math.sqrt(dLat * dLat + dLng * dLng);

  if (norm === 0) return [];

  const unitPerpLat = -dLng / norm;
  const unitPerpLng = dLat / norm;
  const midLat = startLat + dLat / 2;
  const midLng = startLng + dLng / 2;
  const offset = Math.min(Math.max(norm * 0.22, 0.18), 0.55);

  return [
    [midLng + unitPerpLng * offset, midLat + unitPerpLat * offset],
    [midLng - unitPerpLng * offset, midLat - unitPerpLat * offset],
  ];
};

const mapCoordinatesFromGeoJson = (geometry) => {
  const coordinates = geometry?.coordinates ?? [];
  return coordinates.map((coord) => ({
    lat: coord[1],
    lng: coord[0],
  }));
};

const distanceBetween = (a, b) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return (dLat * dLat) + (dLng * dLng);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getSegmentBearing = (start, end) => {
  if (!start || !end) return 0;

  const latDelta = end.lat - start.lat;
  const lngDelta = end.lng - start.lng;

  if (latDelta === 0 && lngDelta === 0) return 0;

  return Math.atan2(latDelta, lngDelta) * (180 / Math.PI);
};

const normalizeAngle = (angle) => {
  let normalized = angle;

  while (normalized <= -180) normalized += 360;
  while (normalized > 180) normalized -= 360;

  return normalized;
};

const smoothBearing = (previous, next, factor = 0.18) => {
  if (!Number.isFinite(previous)) return next;
  if (!Number.isFinite(next)) return previous;

  const delta = normalizeAngle(next - previous);
  return previous + delta * factor;
};

const findNearestPointIndex = (points, target) => {
  if (!points.length || !target) return 0;

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const currentDistance = distanceBetween(point, target);
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const createPinIcon = (color, glyph) =>
  L.divIcon({
    className: 'leaflet-custom-pin',
    html: `
      <div style="position:relative;width:28px;height:40px;display:flex;align-items:flex-start;justify-content:center;">
        <div style="width:28px;height:28px;border-radius:9999px;background:${color};border:3px solid rgba(255,255,255,0.92);box-shadow:0 10px 25px rgba(15,23,42,0.28);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:900;">
          ${glyph}
        </div>
        <div style="position:absolute;bottom:1px;width:2px;height:14px;background:${color};border-radius:9999px;"></div>
      </div>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 38],
    popupAnchor: [0, -30],
  });

const createTrackerIcon = (motion = {}) => {
  const bearing = Number.isFinite(motion.bearing) ? motion.bearing : 0;
  const rad = (bearing * Math.PI) / 180;
  const facingScale = Math.cos(rad) >= 0 ? 1 : -1;
  const roadTilt = clamp(Math.sin(rad) * 3.5, -3.5, 3.5);
  const cabSwing = clamp(Math.cos(rad) * 1.2, -1.2, 1.2);
  const windowShift = facingScale > 0 ? 0.9 : -0.9;

  return L.divIcon({
    className: 'leaflet-tracker-pin',
    html: `
      <div style="position:relative;width:72px;height:52px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;bottom:7px;width:42px;height:10px;border-radius:9999px;background:rgba(15,23,42,0.18);filter:blur(4px);"></div>
        <div style="position:relative;width:56px;height:40px;transform:scaleX(${facingScale}) rotate(${roadTilt}deg);transform-origin:center center;">
          <div style="position:relative;width:56px;height:40px;animation:truck-bob 1.1s ease-in-out infinite;">
            <svg width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="truckCargo" x1="3" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#93C5FD"/>
                  <stop offset="0.55" stop-color="#3B82F6"/>
                  <stop offset="1" stop-color="#1D4ED8"/>
                </linearGradient>
                <linearGradient id="truckCargoInner" x1="6" y1="10" x2="29" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#BFDBFE"/>
                  <stop offset="1" stop-color="#60A5FA"/>
                </linearGradient>
                <linearGradient id="truckCabBlue" x1="33" y1="10" x2="50" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#60A5FA"/>
                  <stop offset="0.5" stop-color="#2563EB"/>
                  <stop offset="1" stop-color="#1E40AF"/>
                </linearGradient>
                <linearGradient id="truckGlassTop" x1="38" y1="11" x2="48" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#E0F2FE"/>
                  <stop offset="1" stop-color="#7DD3FC"/>
                </linearGradient>
                <linearGradient id="truckOrangeAccent" x1="2" y1="6" x2="50" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#FBBF24"/>
                  <stop offset="1" stop-color="#F97316"/>
                </linearGradient>
              </defs>
              <path d="M6 13C6 10.79 7.79 9 10 9H31C33.21 9 35 10.79 35 13V23H40.2C41.39 23 42.5 23.6 43.16 24.6L46.08 29.05C46.4 29.53 46.56 30.09 46.56 30.67V31.4C46.56 32.84 45.4 34 43.96 34H42.44C41.84 36 40.02 37.4 37.88 37.4C35.74 37.4 33.92 36 33.32 34H19.28C18.68 36 16.86 37.4 14.72 37.4C12.58 37.4 10.76 36 10.16 34H8.6C7.16 34 6 32.84 6 31.4V13Z" fill="url(#truckOrangeAccent)"/>
              <rect x="8.6" y="11.4" width="23.4" height="14.8" rx="2.6" fill="url(#truckCargo)"/>
              <rect x="10.5" y="13.1" width="19.6" height="11.4" rx="1.8" fill="#1E3A8A" opacity="0.22"/>
              <rect x="10.2" y="12.7" width="20.2" height="12.2" rx="1.9" fill="url(#truckCargoInner)" opacity="0.42"/>
              <g style="transform:translate(${cabSwing}px, 0px);transform-origin:40px 22px;">
                <path d="M35 15C35 12.79 36.79 11 39 11H41.88C43.14 11 44.29 11.71 44.85 12.84L47.26 17.72C47.53 18.26 47.66 18.86 47.66 19.47V28.58C47.66 30.47 46.13 32 44.24 32H39C36.79 32 35 30.21 35 28V15Z" fill="url(#truckCabBlue)"/>
                <path d="M37.6 14.2H41.26C42.08 14.2 42.83 14.66 43.2 15.39L44.57 18.14C44.81 18.63 44.45 19.2 43.91 19.2H37.6V14.2Z" fill="url(#truckGlassTop)"/>
                <path d="M38.25 14.8H43.8" stroke="rgba(255,255,255,0.55)" stroke-width="1.1" stroke-linecap="round" style="transform:translate(${windowShift}px, 0px);transform-origin:40px 17px;"/>
              </g>
              <path d="M37.6 20.8H45V24.2H37.6V20.8Z" fill="#1D4ED8" opacity="0.35"/>
              <path d="M12.1 14.6H28.4" stroke="rgba(255,255,255,0.45)" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M12.1 17.8H28.4" stroke="rgba(255,255,255,0.2)" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M35 17.5H32.8V28.4H35" stroke="#F59E0B" stroke-width="1.2" stroke-linecap="round"/>
              <circle cx="14.72" cy="33.3" r="3.7" fill="#0F172A" style="transform-origin:14.72px 33.3px;animation:truck-wheel-spin .9s linear infinite;"/>
              <circle cx="37.88" cy="33.3" r="3.7" fill="#0F172A" style="transform-origin:37.88px 33.3px;animation:truck-wheel-spin .9s linear infinite;"/>
              <circle cx="14.72" cy="33.3" r="1.5" fill="#CBD5E1"/>
              <circle cx="37.88" cy="33.3" r="1.5" fill="#CBD5E1"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [72, 52],
    iconAnchor: [36, 26],
    popupAnchor: [0, -26],
  });
};

const createRouteLabelIcon = (background, text) =>
  L.divIcon({
    className: 'leaflet-route-label',
    html: `
      <div style="padding:3px 10px;border-radius:9999px;background:${background};color:white;font-size:10px;font-weight:800;border:1.5px solid rgba(255,255,255,0.95);box-shadow:0 8px 18px rgba(15,23,42,0.2);white-space:nowrap;">
        ${text}
      </div>
    `,
    iconSize: [70, 24],
    iconAnchor: [35, 12],
  });

function FitBounds({ shipment }) {
  const map = useMap();

  useEffect(() => {
    if (!shipment) return;

    const bounds = L.latLngBounds(
      [shipment.origin.lat, shipment.origin.lng],
      [shipment.destination.lat, shipment.destination.lng],
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, shipment]);

  return null;
}

function RefreshMapSize() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

const MapView = ({ shipment, route, cityTrafficData = [] }) => {
  const [showMain, setShowMain] = useState(true);
  const [showAlt, setShowAlt] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [animatedPos, setAnimatedPos] = useState(null);
  const [realRoadData, setRealRoadData] = useState(null);
  const bearingRef = useRef(0);
  const needsRoadFallback = Boolean(shipment) && (!route?.geometry || route?.isSimulated);
  const isRoadGeometryReady = !needsRoadFallback || Boolean(realRoadData?.geometry);

  useEffect(() => {
    if (!shipment) {
      setRealRoadData(null);
      return undefined;
    }

    if (!needsRoadFallback) {
      setRealRoadData(null);
      return undefined;
    }

    const controller = new AbortController();

    const fetchRoadGeometry = async () => {
      try {
        const start = shipment.origin;
        const end = shipment.destination;
        const routes = await fetchOsrmRoute([
          [start.lng, start.lat],
          [end.lng, end.lat],
        ], controller.signal);
        const primary = routes[0];

        if (!primary?.geometry) return;

        const alternates = [];
        const seen = new Set([geometrySignature(primary.geometry)]);

        routes.slice(1).forEach((candidate) => {
          const signature = geometrySignature(candidate.geometry);
          if (candidate?.geometry && !seen.has(signature) && alternates.length < 2) {
            seen.add(signature);
            alternates.push(candidate.geometry);
          }
        });

        if (alternates.length < 2) {
          const waypointCandidates = buildAlternateWaypoints(start, end);

          for (const waypoint of waypointCandidates) {
            if (alternates.length >= 2) break;

            try {
              const variantRoutes = await fetchOsrmRoute([
                [start.lng, start.lat],
                waypoint,
                [end.lng, end.lat],
              ], controller.signal);

              const variant = variantRoutes[0];
              const signature = geometrySignature(variant?.geometry);
              if (variant?.geometry && !seen.has(signature)) {
                seen.add(signature);
                alternates.push(variant.geometry);
              }
            } catch (variantError) {
              if (variantError.name !== 'AbortError') {
                console.warn('Leaflet alternate route fetch failed:', variantError);
              }
            }
          }
        }

        setRealRoadData({
          geometry: primary.geometry,
          alt1Geometry: alternates[0] ?? null,
          alt2Geometry: alternates[1] ?? null,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Leaflet fallback route fetch failed:', error);
        }
      }
    };

    fetchRoadGeometry();

    return () => controller.abort();
  }, [shipment, route?.geometry, route?.isSimulated]);

  const decodedMainPath = useMemo(() => {
    const geometrySource = realRoadData?.geometry ?? route?.geometry;
    if (geometrySource) {
      return decodePolyline(geometrySource);
    }
    return null;
  }, [realRoadData?.geometry, route?.geometry]);

  useEffect(() => {
    if (!shipment) {
      setAnimatedPos(null);
      bearingRef.current = 0;
      return undefined;
    }

    let animId;
    let progress = 0;

    const startLoc = shipment.currentLocation;
    const endLoc = shipment.destination;

    const tick = () => {
      progress += 0.0007;
      if (progress > 1) progress = 0;

      if (decodedMainPath && decodedMainPath.length > 0) {
        const totalPoints = decodedMainPath.length;
        const index = Math.floor(progress * (totalPoints - 1));
        const nextIndex = Math.min(index + 1, totalPoints - 1);
        const segmentProgress = (progress * (totalPoints - 1)) - index;
        const p1 = decodedMainPath[index];
        const lookAheadIndex = Math.min(index + 6, totalPoints - 1);
        const p2 = decodedMainPath[nextIndex];
        const headingTarget = decodedMainPath[lookAheadIndex] ?? p2;

        if (p1 && p2) {
          const nextBearing = getSegmentBearing(p1, headingTarget);
          bearingRef.current = smoothBearing(bearingRef.current, nextBearing);

          setAnimatedPos({
            lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
            lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
            bearing: bearingRef.current,
          });
        }
      } else if (!needsRoadFallback && startLoc && endLoc) {
        bearingRef.current = smoothBearing(bearingRef.current, getSegmentBearing(startLoc, endLoc), 0.12);
        setAnimatedPos({
          lat: startLoc.lat + (endLoc.lat - startLoc.lat) * progress,
          lng: startLoc.lng + (endLoc.lng - startLoc.lng) * progress,
          bearing: bearingRef.current,
        });
      } else {
        setAnimatedPos(null);
      }

      animId = window.requestAnimationFrame(tick);
    };

    animId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animId);
  }, [shipment, decodedMainPath, needsRoadFallback]);

  const altRoutes = useMemo(() => {
    if (!shipment) return null;

    const alt1 = (realRoadData?.alt1Geometry ?? route?.alt1Geometry)
      ? decodePolyline(realRoadData?.alt1Geometry ?? route?.alt1Geometry)
      : [];

    const alt2 = (realRoadData?.alt2Geometry ?? route?.alt2Geometry)
      ? decodePolyline(realRoadData?.alt2Geometry ?? route?.alt2Geometry)
      : [];

    return { alt1, alt2 };
  }, [shipment, route, realRoadData]);

  if (!shipment) {
    return (
      <div className="w-full h-full glass-panel flex flex-col items-center justify-center min-h-[400px]">
        <MapPin size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold">Select a shipment to begin live tracking.</p>
      </div>
    );
  }

  const positionsMainCompleted = decodedMainPath
    ? decodedMainPath.slice(0, Math.max(findNearestPointIndex(decodedMainPath, shipment.currentLocation), 1))
    : [];

  const positionsMainRemaining = decodedMainPath
    ? decodedMainPath.slice(Math.max(findNearestPointIndex(decodedMainPath, shipment.currentLocation), 0))
    : [];

  const mainLabelPosition = positionsMainRemaining[Math.floor(positionsMainRemaining.length / 2)];
  const alt1LabelPosition = altRoutes?.alt1?.[1];
  const alt2LabelPosition = altRoutes?.alt2?.[1];

  return (
    <div className="w-full h-full glass-panel overflow-hidden min-h-[500px] relative rounded-2xl border border-slate-200 shadow-lg">
      <MapContainer
        center={[shipment.currentLocation.lat, shipment.currentLocation.lng]}
        zoom={6}
        scrollWheelZoom
        className="w-full h-full"
        zoomControl={false}
      >
        <RefreshMapSize />
        <FitBounds shipment={shipment} />
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_LAYER_URL} />

        <Marker
          position={[shipment.origin.lat, shipment.origin.lng]}
          icon={createPinIcon('#059669', 'O')}
        >
          <Popup>
            <div className="text-slate-800">
              <strong>Origin: {shipment.origin.name}</strong><br />
              <span className="text-xs text-slate-500">Departed</span>
            </div>
          </Popup>
        </Marker>

        <Marker
          position={[shipment.destination.lat, shipment.destination.lng]}
          icon={createPinIcon('#dc2626', 'D')}
        >
          <Popup>
            <div className="text-slate-800">
              <strong>Destination: {shipment.destination.name}</strong><br />
              <span className="text-xs text-slate-500">ETA: {shipment.etas?.updated}</span>
            </div>
          </Popup>
        </Marker>

        {animatedPos?.lat != null && animatedPos?.lng != null && (
          <Marker
            position={[animatedPos.lat, animatedPos.lng]}
            icon={createTrackerIcon(animatedPos)}
          >
            <Popup>
              <div className="text-slate-800 font-bold">
                <span className="text-blue-600">Live Tracker</span><br />
                <span className="text-xs text-slate-600 font-normal">Status: {shipment.status}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {showMain && positionsMainCompleted.length > 0 && (
          <Polyline
            positions={positionsMainCompleted.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.9 }}
          >
            <Popup>
              <div className="text-slate-800">
                <strong className="text-emerald-700">Completed Route</strong><br />
                Successfully traveled.<br />
                {route?.majorRoads?.length > 0 && (
                  <span className="text-xs text-slate-500">Via {route.majorRoads.join(', ')}</span>
                )}
              </div>
            </Popup>
          </Polyline>
        )}

        {showMain && positionsMainRemaining.length > 0 && (
          <>
            <Polyline
              positions={positionsMainRemaining.map((point) => [point.lat, point.lng])}
              pathOptions={{ color: '#60a5fa', weight: 12, opacity: 0.35 }}
            />
            <Polyline
              positions={positionsMainRemaining.map((point) => [point.lat, point.lng])}
              pathOptions={{ color: '#1d4ed8', weight: 5, opacity: 1 }}
            >
              <Popup>
                <div className="text-slate-800">
                  <strong className="text-blue-700">AI Primary Path</strong><br />
                  Optimal trajectory.<br />
                  {route?.majorRoads?.length > 0 && (
                    <span className="text-xs font-semibold text-slate-600">Route: {route.majorRoads.join(', ')}</span>
                  )}
                </div>
              </Popup>
            </Polyline>
            {route?.majorRoads?.length > 0 && mainLabelPosition && (
              <Marker
                position={[mainLabelPosition.lat, mainLabelPosition.lng]}
                icon={createRouteLabelIcon('#1d4ed8', route.majorRoads[0]?.split(',')[0] || 'Route')}
              />
            )}
          </>
        )}

        {showAlt && altRoutes && (
          <>
            {altRoutes.alt1.length > 1 && (
              <Polyline
                positions={altRoutes.alt1.map((point) => [point.lat, point.lng])}
                pathOptions={{ color: '#fbbf24', weight: 5, opacity: 0.9 }}
              >
                <Popup>
                  <div className="text-slate-800">
                    <strong>Alternate Route 1</strong><br />
                    Traffic bypass.<br />
                    <span className="text-xs text-slate-500">Via {route?.suggestedAltRoads?.[0] || 'Alt Route 1'}</span>
                  </div>
                </Popup>
              </Polyline>
            )}
            {alt1LabelPosition && (
              <Marker
                position={[alt1LabelPosition.lat, alt1LabelPosition.lng]}
                icon={createRouteLabelIcon('#b45309', route?.suggestedAltRoads?.[0] || 'Alt 1')}
              />
            )}

            {altRoutes.alt2.length > 1 && (
              <Polyline
                positions={altRoutes.alt2.map((point) => [point.lat, point.lng])}
                pathOptions={{ color: '#f97316', weight: 4, opacity: 0.8 }}
              >
                <Popup>
                  <div className="text-slate-800">
                    <strong>Alternate Route 2</strong><br />
                    Weather storm bypass.<br />
                    <span className="text-xs text-slate-500">Via {route?.suggestedAltRoads?.[1] || 'Alt Route 2'}</span>
                  </div>
                </Popup>
              </Polyline>
            )}
            {alt2LabelPosition && (
              <Marker
                position={[alt2LabelPosition.lat, alt2LabelPosition.lng]}
                icon={createRouteLabelIcon('#c2410c', route?.suggestedAltRoads?.[1] || 'Alt 2')}
              />
            )}
          </>
        )}

        {showTraffic && cityTrafficData.map((city, idx) => {
          if (!city.lat || !city.lon) return null;

          const colors = getTrafficColor(city.traffic);

          return (
            <Circle
              key={`traffic-${idx}`}
              center={[city.lat, city.lon]}
              radius={30000}
              pathOptions={{
                fillColor: colors.fill,
                fillOpacity: 0.35,
                color: colors.stroke,
                opacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-slate-800">
                  <strong>{city.name}</strong><br />
                  <span className="text-xs text-slate-500">Traffic: <strong>{city.traffic}</strong></span><br />
                  <span className="text-xs text-slate-400">{city.state}</span>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {!isRoadGeometryReady && (
        <div className="absolute inset-x-4 top-4 z-[998] rounded-2xl border border-blue-200 bg-white/92 px-4 py-3 text-sm font-semibold text-blue-700 shadow-lg backdrop-blur-md">
          Loading road route...
        </div>
      )}

      <div className="absolute top-4 right-4 z-[999] bg-white/90 backdrop-blur-md border border-slate-200 p-3 lg:p-4 rounded-xl shadow-xl flex flex-col max-w-xs transition-all duration-300">
        <div
          className={`flex items-center justify-between cursor-pointer gap-4 ${isPanelOpen ? 'border-b border-slate-200 pb-2 mb-4' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <div className="flex items-center gap-2">
            <Route size={18} className="text-indigo-500" />
            <h3 className="font-black text-slate-800 text-sm tracking-tight">AI Routing Intelligence</h3>
          </div>
          {isPanelOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
        </div>

        {isPanelOpen && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <button
                onClick={() => setShowMain(!showMain)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" /> Main Route</span>
                {showMain ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>

              <button
                onClick={() => setShowAlt(!showAlt)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-orange-500 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-500/50" /> Alternatives</span>
                {showAlt ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>

              <button
                onClick={() => setShowTraffic(!showTraffic)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-red-500 transition-colors"
              >
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400 shadow-sm shadow-red-500/50" /> City Traffic</span>
                {showTraffic ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
                <div className="w-6 h-1 mt-1 shrink-0 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }} />
                <p><strong className="text-slate-700">AI Primary Path:</strong> Fastest, lowest cost trajectory.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
                <div className="w-6 h-1 mt-1 shrink-0 bg-yellow-500 rounded" />
                <p><strong className="text-slate-700">Alt 1:</strong> Traffic bypass.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
                <div className="w-6 h-1 mt-1 shrink-0 bg-orange-500 rounded" />
                <p><strong className="text-slate-700">Alt 2:</strong> Weather/Storm bypass.</p>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
                <div className="w-3 h-3 mt-0.5 shrink-0 bg-red-400/40 rounded-full border border-red-500" />
                <p><strong className="text-slate-700">Traffic:</strong> City congestion zones (live API).</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MapView);
