import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createActivity } from "../api/activities";

const SPORT_TYPES = ["run", "ride", "swim", "walk", "hike"];
const VISIBILITIES = ["public", "friends", "private"];

export default function LogActivity() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    sport_type: "run",
    distance: "",
    duration: "",
    elevation: "",
    visibility: "public",
    polyline: "",
  });

  const mutation = useMutation({
    mutationFn: createActivity,
    onSuccess: (activity) => navigate(`/activities/${activity.id}`),
  });

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      distance: form.distance ? parseFloat(form.distance) * 1000 : null,
      duration: form.duration ? parseInt(form.duration) * 60 : null,
      elevation: form.elevation ? parseFloat(form.elevation) : null,
      polyline: form.polyline || null,
      tagged_athlete_ids: [],
    });
  }

  return (
    <div className="page">
      <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Log Activity</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input required value={form.title} onChange={set("title")} placeholder="Morning Run" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Sport</label>
              <select value={form.sport_type} onChange={set("sport_type")}>
                {SPORT_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Visibility</label>
              <select value={form.visibility} onChange={set("visibility")}>
                {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Distance (km)</label>
              <input type="number" step="0.01" value={form.distance} onChange={set("distance")} placeholder="5.0" />
            </div>
            <div className="form-group">
              <label>Duration (min)</label>
              <input type="number" value={form.duration} onChange={set("duration")} placeholder="30" />
            </div>
            <div className="form-group">
              <label>Elevation (m)</label>
              <input type="number" value={form.elevation} onChange={set("elevation")} placeholder="120" />
            </div>
          </div>

          <div className="form-group">
            <label>Encoded Polyline (optional)</label>
            <input value={form.polyline} onChange={set("polyline")} placeholder="paste encoded route string" />
          </div>

          {mutation.isError && <p className="error">{mutation.error?.response?.data?.detail ?? "Failed to save"}</p>}

          <button className="btn-primary" type="submit" style={{ marginTop: 8 }} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Activity"}
          </button>
        </form>
      </div>
    </div>
  );
}
