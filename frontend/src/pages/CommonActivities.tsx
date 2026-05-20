import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCommonActivities } from "../api/commonActivities";
import SportIcon from "../components/SportIcon";

export default function CommonActivities() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["commonActivities"],
    queryFn: getCommonActivities,
  });

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 className="section-title" style={{ margin: 0 }}>Common Activities</h2>
        <Link to="/add-common-activity" className="btn-primary">
          + Create Common Activity
        </Link>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No common activities yet. Create one to define a shared route athletes can attempt.
        </p>
      ) : (
        <div className="friends-grid">
          {items.map((ca) => (
            <Link key={ca.id} to={`/common-activities/${ca.id}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "flex", gap: 12, alignItems: "center" }}>
              <SportIcon sport={ca.sport_type} size={28} color="var(--accent)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{ca.name}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {ca.sport_type}
                  {ca.distance != null && ` · ${(ca.distance / 1000).toFixed(2)} km`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
