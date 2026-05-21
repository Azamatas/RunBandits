import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSegment, getSegmentLeaderboard, getMySegmentEfforts } from "../api/segments";
import MapView from "../components/MapView";
import { fmtDuration as fmt } from "../utils/time";

export default function SegmentDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: segment, isLoading, isError } = useQuery({
    queryKey: ["segment", id],
    queryFn: () => getSegment(id!),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["segmentLeaderboard", id],
    queryFn: () => getSegmentLeaderboard(id!),
  });

  const { data: myEfforts = [] } = useQuery({
    queryKey: ["mySegmentEfforts", id],
    queryFn: () => getMySegmentEfforts(id!),
  });

  if (isLoading) return <div className="page"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  if (isError || !segment) return <div className="page"><p>Segment not found.</p></div>;

  const MEDAL_BG = ["#fef08a", "#e5e7eb", "#fed7aa"];
  const MEDAL_COLOR = ["#a16207", "#6b7280", "#c2410c"];

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0 }}>{segment.name}</h2>
        {segment.distance != null && (
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {(segment.distance / 1000).toFixed(2)} km
          </p>
        )}
      </div>

      {segment.polyline && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
          <MapView polyline={segment.polyline} height={320} />
        </div>
      )}

      <h3 className="section-title">Leaderboard</h3>
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
        {leaderboard.length === 0 ? (
          <p style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
            No efforts yet on this segment.
          </p>
        ) : (
          leaderboard.map((entry, i) => (
            <div
              key={entry.athlete_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderBottom: i < leaderboard.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: MEDAL_BG[i] ?? "var(--gray-100)",
                color: MEDAL_COLOR[i] ?? "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", fontWeight: 800, flexShrink: 0,
              }}>
                {entry.rank}
              </span>
              <Link
                to={`/users/${entry.athlete_id}`}
                style={{ flex: 1, fontWeight: 500, color: "inherit", textDecoration: "none" }}
              >
                {entry.athlete_name}
              </Link>
              {entry.activity_id ? (
                <Link
                  to={`/activities/${entry.activity_id}`}
                  style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--accent)", textDecoration: "none" }}
                >
                  {fmt(entry.best_time)}
                </Link>
              ) : (
                <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(entry.best_time)}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {myEfforts.length > 0 && (
        <>
          <h3 className="section-title">Your Efforts</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {myEfforts.map((effort, i) => (
              <div
                key={effort.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  borderBottom: i < myEfforts.length - 1 ? "1px solid var(--border)" : "none",
                  fontSize: "var(--text-sm)",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  {effort.started_at ? new Date(effort.started_at).toLocaleDateString() : "—"}
                </span>
                <Link
                  to={`/activities/${effort.activity_id}`}
                  style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--accent)", textDecoration: "none" }}
                >
                  {fmt(effort.elapsed_time)}
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
