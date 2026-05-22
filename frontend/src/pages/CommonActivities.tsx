import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import polylineCodec from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import { getCommonActivities } from "../api/commonActivities";
import SportIcon from "../components/SportIcon";
import type { CommonActivity } from "../types/api";
import { heistColor } from "../utils/heistColor";
import "leaflet/dist/leaflet.css";

function FitAll({ allPositions }: { allPositions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (allPositions.length > 1) {
      map.fitBounds(allPositions as any, { padding: [40, 40] });
    }
  }, [map, allPositions]);
  return null;
}

function HeistsMap({
  items,
  highlighted,
  onSelect,
}: {
  items: CommonActivity[];
  highlighted: number | null;
  onSelect: (id: number) => void;
}) {
  const routes = useMemo(() =>
    items
      .filter((ca) => ca.polyline)
      .map((ca, i) => ({
        ca,
        positions: (() => { try { return polylineCodec.decode(ca.polyline!); } catch { return []; } })(),
        color: heistColor(ca.id),
      }))
      .filter((r) => r.positions.length >= 2),
    [items]
  );

  const allPositions = useMemo(
    () => routes.flatMap((r) => r.positions) as [number, number][],
    [routes]
  );

  const defaultCenter: [number, number] = [53.1671, 8.6493];

  if (routes.length === 0) return null;

  return (
    <div className="map-container" style={{ height: 380 }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routes.map(({ ca, positions, color }) => (
          <Polyline
            key={ca.id}
            positions={positions as any}
            pathOptions={{
              color,
              weight: highlighted === ca.id ? 7 : 4,
              opacity: highlighted === ca.id ? 1 : 0.75,
            }}
            eventHandlers={{ click: () => onSelect(ca.id) }}
          />
        ))}
        <FitAll allPositions={allPositions} />
      </MapContainer>
    </div>
  );
}

export default function CommonActivities() {
  const navigate = useNavigate();
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["commonActivities"],
    queryFn: getCommonActivities,
  });

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.run_count - a.run_count),
    [items]
  );

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 className="section-title" style={{ margin: 0 }}>Heists</h2>
        <Link to="/add-common-activity" className="btn-primary">+ Plan a Heist</Link>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No heists yet. Plan one to define a shared route the crew can attempt.</p>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
            <HeistsMap
              items={sorted}
              highlighted={highlighted}
              onSelect={(id) => navigate(`/common-activities/${id}`)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((ca, i) => (
              <Link
                key={ca.id}
                to={`/common-activities/${ca.id}`}
                className="card"
                style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}
                onMouseEnter={() => setHighlighted(ca.id)}
                onMouseLeave={() => setHighlighted(null)}
              >
                <span style={{ color: heistColor(ca.id), fontWeight: 700, fontSize: "1.1em", minWidth: 28 }}>
                  #{i + 1}
                </span>
                <SportIcon sport={ca.sport_type} size={24} color={heistColor(ca.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{ca.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    {ca.sport_type}
                    {ca.distance != null && ` · ${(ca.distance / 1000).toFixed(2)} km`}
                  </div>
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", textAlign: "right" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{ca.run_count}</span> runs
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
