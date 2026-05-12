import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActivity, deleteActivity } from "../api/activities";
import { useAuth } from "../context/AuthContext";

function fmt(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function ActivityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => getActivity(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteActivity(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feed"] }); navigate("/feed"); },
  });

  if (isLoading) return <div className="page"><p style={{ color: "#888" }}>Loading…</p></div>;
  if (isError || !activity) return <div className="page"><p className="error">Activity not found.</p></div>;

  const isOwner = user?.id === activity.owner_id;

  return (
    <div className="page">
      <button className="btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 22 }}>{activity.title}</h2>
            <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              {activity.sport_type} · {activity.visibility} · {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
          {isOwner && (
            <button
              className="btn-ghost"
              style={{ color: "#c0392b", borderColor: "#c0392b" }}
              onClick={() => { if (confirm("Delete this activity?")) deleteMutation.mutate(); }}
            >
              Delete
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
          {activity.distance && (
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{(activity.distance / 1000).toFixed(2)}</div>
              <div style={{ fontSize: 12, color: "#888" }}>km</div>
            </div>
          )}
          {activity.duration && (
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(activity.duration)}</div>
              <div style={{ fontSize: 12, color: "#888" }}>time</div>
            </div>
          )}
          {activity.elevation && (
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{activity.elevation}</div>
              <div style={{ fontSize: 12, color: "#888" }}>m elevation</div>
            </div>
          )}
          {activity.distance && activity.duration && (
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {fmt(Math.round(activity.duration / (activity.distance / 1000)))}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>/km pace</div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, color: "#888" }}>👏 {activity.kudos_count} kudos</div>

        {activity.polyline && (
          <div style={{ marginTop: 16, padding: 12, background: "#f9f9f9", borderRadius: 6, fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", color: "#555" }}>
            <strong>Route polyline:</strong> {activity.polyline}
          </div>
        )}
      </div>
    </div>
  );
}
