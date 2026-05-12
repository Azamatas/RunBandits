import { useQuery } from "@tanstack/react-query";
import { getMe, getStats } from "../api/users";
import ActivityCard from "../components/ActivityCard";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

function StatBox({ label, value }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 20px", background: "#f9f9f9", borderRadius: 8 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  const { data: activities } = useQuery({
    queryKey: ["myActivities"],
    queryFn: () => client.get("/feed/", { params: { limit: 50 } }).then((r) => r.data),
  });

  const myActivities = activities?.filter((a) => a.owner_id === user?.id) ?? [];

  const runTotals = stats?.totals?.run;

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>{user?.username}</h2>
        {user?.location && <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>📍 {user.location}</p>}
        {user?.bio && <p style={{ marginTop: 8, fontSize: 14 }}>{user.bio}</p>}
      </div>

      {runTotals && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Running Totals</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatBox label="activities" value={runTotals.count} />
            <StatBox label="km" value={(runTotals.total_distance / 1000).toFixed(0)} />
            <StatBox label="m elevation" value={runTotals.total_elevation?.toFixed(0)} />
          </div>
        </div>
      )}

      <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Your Activities</h3>
      {myActivities.length === 0 && <p style={{ color: "#888" }}>No activities yet.</p>}
      {myActivities.map((a) => (
        <ActivityCard key={a.id} activity={a} queryKey={["myActivities"]} />
      ))}
    </div>
  );
}
