import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { giveKudos, removeKudos } from "../api/activities";
import { useAuth } from "../context/AuthContext";

const SPORT_EMOJI = { run: "🏃", ride: "🚴", swim: "🏊", walk: "🚶", hike: "🥾" };

function fmt(seconds) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function ActivityCard({ activity, queryKey }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const kudosMutation = useMutation({
    mutationFn: () => giveKudos(activity.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const removeKudosMutation = useMutation({
    mutationFn: () => removeKudos(activity.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const isOwner = user?.id === activity.owner_id;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <Link to={`/activities/${activity.id}`} style={{ fontWeight: 700, fontSize: 16 }}>
          {SPORT_EMOJI[activity.sport_type] ?? "🏅"} {activity.title}
        </Link>
        <span style={{ fontSize: 12, color: "#888" }}>
          {activity.visibility} · {new Date(activity.created_at).toLocaleDateString()}
        </span>
      </div>

      <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#555", marginBottom: 12 }}>
        {activity.distance && <span><strong>{(activity.distance / 1000).toFixed(2)}</strong> km</span>}
        {activity.duration && <span><strong>{fmt(activity.duration)}</strong></span>}
        {activity.elevation && <span><strong>{activity.elevation}</strong> m elev</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {!isOwner && (
          <button
            className="btn-ghost"
            style={{ padding: "4px 12px", fontSize: 13 }}
            onClick={() => kudosMutation.mutate()}
            disabled={kudosMutation.isPending}
          >
            👏 Kudos ({activity.kudos_count})
          </button>
        )}
        {isOwner && (
          <span style={{ fontSize: 13, color: "#888" }}>👏 {activity.kudos_count} kudos</span>
        )}
      </div>
    </div>
  );
}
