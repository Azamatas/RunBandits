import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import polylineCodec from "@mapbox/polyline";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const ROUTE_DRAFT_KEY = "route_builder_draft";

type LatLng = [number, number];

const DEFAULT_CENTER: LatLng = [53.1671, 8.6493];

interface RouteBuilderProps {
  onChange: (encodedPolyline: string) => void;
  onDistance?: (km: number) => void;
  onDuration?: (totalMinutes: number) => void;
  paceMinPerKm?: number | null;
  initialPolyline?: string;
  hideTimes?: boolean;
  draftKey?: string;
}

const DEFAULT_PACE_MIN_PER_KM = 5;

function paceTimeFor(km: number, paceMinPerKm: number | null | undefined): string {
  if (km <= 0) return "";
  const pace = paceMinPerKm && paceMinPerKm > 0 ? paceMinPerKm : DEFAULT_PACE_MIN_PER_KM;
  return String(Math.round(km * pace * 10) / 10);
}

function haversineKm([lat1, lon1]: LatLng, [lat2, lon2]: LatLng): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pathKm(points: LatLng[], closed: boolean): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineKm(points[i - 1], points[i]);
  if (closed && points.length >= 2) d += haversineKm(points[points.length - 1], points[0]);
  return d;
}

function legKm(points: LatLng[], i: number): number {
  const j = (i + 1) % points.length;
  return haversineKm(points[i], points[j]);
}

const iconCache = new Map<string, L.DivIcon>();
function dotIcon(color: string, ring: boolean = false) {
  const key = `${color}|${ring ? "r" : ""}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const size = 14;
  const ringStyle = ring
    ? "box-shadow:0 0 0 4px rgba(22,163,74,0.28),0 1px 4px rgba(0,0,0,0.4);"
    : "box-shadow:0 1px 4px rgba(0,0,0,0.4);";
  const icon = L.divIcon({
    className: "rb-marker",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid #fff;${ringStyle}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  iconCache.set(key, icon);
  return icon;
}

function ClickHandler({ onAdd }: { onAdd: (pt: LatLng) => void }) {
  useMapEvents({ click: (e) => onAdd([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Recenter({ center, trigger }: { center: LatLng; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

function fmtTime(totalMinutes: number): string {
  const m = Math.floor(totalMinutes);
  const s = Math.round((totalMinutes - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const ACCENT = "var(--accent, #fc4c02)";
const ACCENT_HEX = "#fc4c02";
const START_COLOR = "#16a34a";

const MID_ICON = L.divIcon({
  className: "rb-midpoint",
  html: `<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;"><div style="width:7px;height:7px;background:#fff;border-radius:50%;border:2px solid ${ACCENT_HEX};box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MidpointDragger({
  position,
  onInsert,
  onMove,
}: {
  position: LatLng;
  onInsert: (pt: LatLng) => void;
  onMove: (pt: LatLng) => void;
}) {
  const map = useMap();
  return (
    <Marker
      position={position}
      icon={MID_ICON}
      eventHandlers={{
        mousedown: (e) => {
          L.DomEvent.stop(e);
          map.dragging.disable();
          onInsert(position);
          const handleMove = (me: L.LeafletMouseEvent) => onMove([me.latlng.lat, me.latlng.lng]);
          const handleUp = () => {
            map.off("mousemove", handleMove);
            map.off("mouseup", handleUp);
            map.dragging.enable();
          };
          map.on("mousemove", handleMove);
          map.on("mouseup", handleUp);
        },
      }}
    />
  );
}

function LineDragger({
  positions,
  onInsert,
  onMove,
}: {
  positions: [LatLng, LatLng];
  onInsert: (pt: LatLng) => void;
  onMove: (pt: LatLng) => void;
}) {
  const map = useMap();
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: ACCENT, weight: 5, opacity: 0.85 }}
      bubblingMouseEvents={false}
      eventHandlers={{
        mousedown: (e) => {
          L.DomEvent.stop(e);
          map.dragging.disable();
          // Insert immediately so the lines start following the cursor right away.
          onInsert([e.latlng.lat, e.latlng.lng]);
          const handleMove = (me: L.LeafletMouseEvent) => onMove([me.latlng.lat, me.latlng.lng]);
          const handleUp = () => {
            map.off("mousemove", handleMove);
            map.off("mouseup", handleUp);
            map.dragging.enable();
          };
          map.on("mousemove", handleMove);
          map.on("mouseup", handleUp);
        },
        mouseover: (e) => e.target.setStyle({ weight: 7, opacity: 1 }),
        mouseout: (e) => e.target.setStyle({ weight: 5, opacity: 0.85 }),
      }}
    />
  );
}

export default function RouteBuilder({ onChange, onDistance, onDuration, paceMinPerKm, initialPolyline, hideTimes, draftKey = ROUTE_DRAFT_KEY }: RouteBuilderProps) {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [legTimes, setLegTimes] = useState<string[]>([]);
  const [closed, setClosed] = useState(false);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const stateRef = useRef({ points: [] as LatLng[], legTimes: [] as string[], closed: false });

  useEffect(() => {
    if (initialPolyline || localStorage.getItem(draftKey)) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        if (stateRef.current.points.length === 0) {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setRecenterTrigger((t) => t + 1);
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialPolyline) {
      try {
        const decoded = polylineCodec.decode(initialPolyline) as LatLng[];
        if (decoded.length >= 2) {
          const first = decoded[0];
          const last = decoded[decoded.length - 1];
          const isClosed = first[0] === last[0] && first[1] === last[1];
          const pts = isClosed ? decoded.slice(0, -1) : decoded;
          emit(pts, Array(isClosed ? pts.length : pts.length - 1).fill(""), isClosed);
          setCenter(pts[Math.floor(pts.length / 2)]);
          setRecenterTrigger((t) => t + 1);
        }
      } catch {}
    } else {
      try {
        const raw = localStorage.getItem(draftKey);
        if (!raw) return;
        const { points: pts, legTimes: times, closed: cl } = JSON.parse(raw) as {
          points: LatLng[];
          legTimes: string[];
          closed: boolean;
        };
        if (pts.length >= 1) {
          emit(pts, times, cl);
          setCenter(pts[Math.floor(pts.length / 2)]);
          setRecenterTrigger((t) => t + 1);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  function emit(nextPoints: LatLng[], nextTimes: string[], nextClosed: boolean) {
    stateRef.current = { points: nextPoints, legTimes: nextTimes, closed: nextClosed };
    setPoints(nextPoints);
    setLegTimes(nextTimes);
    setClosed(nextClosed);
    const encodable =
      nextClosed && nextPoints.length >= 2
        ? [...nextPoints, nextPoints[0]]
        : nextPoints;
    const encoded = encodable.length >= 2 ? polylineCodec.encode(encodable) : "";
    if (!initialPolyline) {
      // Persist draft for new routes so the user doesn't lose work on refresh.
      // Stored as JSON (not a polyline) so a single point is preserved too.
      // Not used in edit mode — the activity's own polyline is the source of truth.
      if (nextPoints.length > 0)
        localStorage.setItem(draftKey, JSON.stringify({ points: nextPoints, legTimes: nextTimes, closed: nextClosed }));
      else
        localStorage.removeItem(draftKey);
    }
    onChange(encoded);
    onDistance?.(nextPoints.length >= 2 ? pathKm(nextPoints, nextClosed) : 0);
    onDuration?.(nextTimes.reduce((s, t) => s + (parseFloat(t) || 0), 0));
  }

  function addPoint(pt: LatLng) {
    if (closed) {
      const newOpenTime = paceTimeFor(haversineKm(points[points.length - 1], pt), paceMinPerKm);
      const close = legTimes[legTimes.length - 1] ?? "";
      const opens = legTimes.slice(0, -1);
      emit([...points, pt], [...opens, newOpenTime, close], true);
    } else if (points.length === 0) {
      emit([pt], [], false);
    } else {
      const newLegTime = paceTimeFor(haversineKm(points[points.length - 1], pt), paceMinPerKm);
      emit([...points, pt], [...legTimes, newLegTime], false);
    }
  }

  function insertOnSegment(segIndex: number, pt: LatLng) {
    const nextPoints = [...points.slice(0, segIndex + 1), pt, ...points.slice(segIndex + 1)];
    const wrapTo = (segIndex + 1) % points.length;
    const km1 = haversineKm(points[segIndex], pt);
    const km2 = haversineKm(pt, points[wrapTo]);
    const oldT = parseFloat(legTimes[segIndex]) || 0;
    let s1 = "";
    let s2 = "";
    if (oldT > 0) {
      const oldKm = legKm(points, segIndex) || 1;
      const t1 = Math.round(((oldT * km1) / oldKm) * 10) / 10;
      const t2 = Math.round(((oldT * km2) / oldKm) * 10) / 10;
      s1 = t1 ? String(t1) : "";
      s2 = t2 ? String(t2) : "";
    } else {
      s1 = paceTimeFor(km1, paceMinPerKm);
      s2 = paceTimeFor(km2, paceMinPerKm);
    }
    const nextTimes = [
      ...legTimes.slice(0, segIndex),
      s1,
      s2,
      ...legTimes.slice(segIndex + 1),
    ];
    emit(nextPoints, nextTimes, closed);
  }

  function movePoint(i: number, pt: LatLng) {
    const { points: p, legTimes: t, closed: c } = stateRef.current;
    const next = [...p];
    next[i] = pt;
    emit(next, t, c);
  }

  function deletePoint(i: number) {
    const nextPoints = points.filter((_, idx) => idx !== i);
    const nextClosed = closed && nextPoints.length >= 2;
    let nextTimes: string[] = legTimes;
    if (legTimes.length > 0) {
      if (i === 0) {
        nextTimes = legTimes.slice(1);
      } else if (i === points.length - 1) {
        nextTimes = closed
          ? [...legTimes.slice(0, -2), legTimes[legTimes.length - 1]]
          : legTimes.slice(0, -1);
      } else {
        nextTimes = [...legTimes.slice(0, i - 1), ...legTimes.slice(i)];
      }
    }
    const targetLen = nextClosed ? nextPoints.length : Math.max(0, nextPoints.length - 1);
    if (nextTimes.length > targetLen) nextTimes = nextTimes.slice(0, targetLen);
    emit(nextPoints, nextTimes, nextClosed);
  }

  function clear() {
    emit([], [], false);
  }

  function toggleClosed() {
    if (points.length < 2) return;
    if (closed) {
      emit(points, legTimes.slice(0, -1), false);
    } else {
      const closingKm = haversineKm(points[points.length - 1], points[0]);
      const t = paceTimeFor(closingKm, paceMinPerKm);
      emit(points, [...legTimes, t], true);
    }
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setRecenterTrigger((t) => t + 1);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: Infinity },
    );
  }

  function setLegTime(i: number, val: string) {
    const next = [...legTimes];
    next[i] = val;
    setLegTimes(next);
    onDuration?.(next.reduce((s, t) => s + (parseFloat(t) || 0), 0));
  }

  const openEdgeCount = Math.max(0, points.length - 1);
  const edgeCount = closed ? points.length : openEdgeCount;
  const totalMin = legTimes.reduce((s, t) => s + (parseFloat(t) || 0), 0);
  const canCloseCycle = points.length >= 2 && !closed;

  // Popup content wrapper that stops native click propagation so Leaflet's
  // map click doesn't fire and add a stray point.
  const stopClicks: React.HTMLAttributes<HTMLDivElement> = {
    onClick: (e) => e.stopPropagation(),
    onMouseDown: (e) => e.stopPropagation(),
    onMouseUp: (e) => e.stopPropagation(),
  };



  return (
    <div>
      <div className="map-container" style={{ height: 480, position: "relative" }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          doubleClickZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onAdd={addPoint} />
          <Recenter center={center} trigger={recenterTrigger} />

          {Array.from({ length: openEdgeCount }, (_, i) => (
            <LineDragger
              key={`seg-${i}`}
              positions={[points[i], points[i + 1]]}
              onInsert={(pt) => insertOnSegment(i, pt)}
              onMove={(pt) => movePoint(i + 1, pt)}
            />
          ))}

          {closed && points.length >= 2 && (
            <LineDragger
              positions={[points[points.length - 1], points[0]]}
              onInsert={(pt) => insertOnSegment(points.length - 1, pt)}
              onMove={(pt) => movePoint(points.length, pt)}
            />
          )}

          {points.length >= 2 && Array.from({ length: edgeCount }, (_, i) => {
            const j = (i + 1) % points.length;
            const mid: LatLng = [(points[i][0] + points[j][0]) / 2, (points[i][1] + points[j][1]) / 2];
            return (
              <MidpointDragger
                key={`mid-${i}-${mid[0].toFixed(5)}-${mid[1].toFixed(5)}`}
                position={mid}
                onInsert={(pt) => insertOnSegment(i, pt)}
                onMove={(pt) => movePoint(i + 1, pt)}
              />
            );
          })}

          {points.map((pt, i) => {
            const isStart = i === 0;
            const startClosesCycle = isStart && canCloseCycle;
            const color = isStart ? START_COLOR : ACCENT;
            return (
              <Marker
                key={`pt-${i}`}
                position={pt}
                draggable
                icon={dotIcon(color, startClosesCycle)}
                eventHandlers={{
                  click: startClosesCycle ? () => toggleClosed() : undefined,
                  drag: (e) => {
                    const ll = e.target.getLatLng();
                    movePoint(i, [ll.lat, ll.lng]);
                  },
                  dragend: (e) => {
                    const ll = e.target.getLatLng();
                    movePoint(i, [ll.lat, ll.lng]);
                  },
                }}
              >
                {!startClosesCycle && (
                  <Popup closeButton={false} autoPan={false}>
                    <div {...stopClicks} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {isStart ? "Start point" : `Point ${i + 1}`}
                      </span>
                      <span style={{ fontSize: 12, color: "#52525b" }}>
                        Drag the pin to move it.
                      </span>
                      {isStart && closed && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleClosed(); }}
                          style={{ padding: "5px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #d4d4d8", background: "#fff", color: "#3f3f46", cursor: "pointer", fontWeight: 600 }}
                        >
                          Open the loop
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deletePoint(i); }}
                        style={{ padding: "5px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #e11d48", background: "#fff", color: "#e11d48", cursor: "pointer", fontWeight: 600 }}
                      >
                        Delete this point
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>

        {points.length === 0 && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 500, background: "rgba(255,255,255,0.96)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", fontSize: 13, color: "#3f3f46", pointerEvents: "none", textAlign: "center", fontWeight: 500 }}>
            Tap anywhere on the map to drop your first point.
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); locateMe(); }}
          aria-label="Center on my location"
          title="Center on my location"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 500, width: 38, height: 38, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn-secondary" onClick={clear} disabled={points.length === 0}>
          Clear route
        </button>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginLeft: "auto", textAlign: "right" }}>
          {points.length === 0
            ? "Click on the map to add the first point"
            : points.length === 1
            ? "1 point — click again to add the next"
            : closed
            ? `${pathKm(points, true).toFixed(2)} km · closed loop · drag to move, click a line to insert`
            : `${pathKm(points, false).toFixed(2)} km · ${points.length} points · click the green pin to close the loop`}
        </span>
      </div>

      {edgeCount > 0 && !hideTimes && (
        <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "3.5rem 1fr 1fr 1fr",
            padding: "6px 12px",
            background: "var(--gray-50)",
            borderBottom: "1px solid var(--border)",
            fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            <span>Edge</span>
            <span>Distance</span>
            <span>Time (min)</span>
            <span>Pace</span>
          </div>
          {Array.from({ length: edgeCount }, (_, i) => {
            const km = legKm(points, i);
            const min = parseFloat(legTimes[i]) || 0;
            const pace = min > 0 && km > 0 ? fmtTime(min / km) : "—";
            const toIdx = (i + 1) % points.length;
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "3.5rem 1fr 1fr 1fr",
                padding: "6px 12px", alignItems: "center",
                borderBottom: i < edgeCount - 1 ? "1px solid var(--gray-100)" : "none",
                fontSize: "var(--text-sm)",
              }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}→{toIdx + 1}</span>
                <span>{km.toFixed(2)} km</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={legTimes[i] ?? ""}
                  onChange={(e) => setLegTime(i, e.target.value)}
                  placeholder="—"
                  style={{ width: 72, padding: "4px 8px", fontSize: "var(--text-sm)" }}
                />
                <span style={{ color: "var(--text-muted)" }}>{pace} /km</span>
              </div>
            );
          })}
          {(edgeCount > 1) && (
            <div style={{
              display: "grid", gridTemplateColumns: "3.5rem 1fr 1fr 1fr",
              padding: "6px 12px",
              background: "var(--gray-50)",
              borderTop: "1px solid var(--border)",
              fontSize: "var(--text-sm)", fontWeight: 700,
            }}>
              <span />
              <span>{pathKm(points, closed).toFixed(2)} km</span>
              <span>{totalMin > 0 ? fmtTime(totalMin) : "—"}</span>
              <span style={{ color: "var(--text-muted)" }}>
                {totalMin > 0 && pathKm(points, closed) > 0 ? `${fmtTime(totalMin / pathKm(points, closed))} /km` : "—"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
