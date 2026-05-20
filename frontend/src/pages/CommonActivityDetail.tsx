import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getCommonActivity,
  getCommonActivityActivities,
  getCommonActivityLeaderboard,
} from "../api/commonActivities";
import MapView from "../components/MapView";
import LeaderboardTable from "../components/LeaderboardTable";
import ActivityCard from "../components/ActivityCard";
import SportIcon from "../components/SportIcon";

export default function CommonActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const caId = id!;

  const { data: ca, isLoading, isError } = useQuery({
    queryKey: ["commonActivity", caId],
    queryFn: () => getCommonActivity(caId),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["commonActivityLeaderboard", caId],
    queryFn: () => getCommonActivityLeaderboard(caId),
  });

  const activitiesQueryKey = ["commonActivityActivities", caId];
  const { data: activities = [] } = useQuery({
    queryKey: activitiesQueryKey,
    queryFn: () => getCommonActivityActivities(caId),
  });

  if (isLoading) {
    return <div className="page"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  }
  if (isError || !ca) {
    return <div className="page"><p>Heist not found.</p></div>;
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <SportIcon sport={ca.sport_type} size={32} color="var(--accent)" />
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>{ca.name}</h2>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {ca.sport_type}
            {ca.distance != null && ` · ${(ca.distance / 1000).toFixed(2)} km`}
          </div>
        </div>
      </div>

      {ca.polyline && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
          <MapView polyline={ca.polyline} height={320} />
        </div>
      )}

      <h3 className="section-title">Bounty Board</h3>
      <div className="card" style={{ marginBottom: 24 }}>
        <LeaderboardTable efforts={leaderboard} />
      </div>

      <h3 className="section-title">Crew Runs on this Heist</h3>
      {activities.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No runs yet. Log one with a similar route to see it appear here.
        </p>
      ) : (
        <div className="activities-grid">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} queryKey={activitiesQueryKey} />
          ))}
        </div>
      )}
    </div>
  );
}
