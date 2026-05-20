import { Link } from "react-router-dom";
import SportIcon from "./SportIcon";
import type { PersonalRecord, PersonalRecordType, SportType } from "../types/api";

const SPORT_LABELS: Record<SportType, string> = {
  run: "Running",
  ride: "Cycling",
  walk: "Walking",
  hike: "Hiking",
};

const SPORT_COLORS: Record<SportType, string> = {
  run: "var(--sport-run)",
  ride: "var(--sport-ride)",
  walk: "var(--sport-walk)",
  hike: "var(--sport-hike)",
};

const RECORD_LABELS: Record<PersonalRecordType, string> = {
  longest_distance: "Longest",
  longest_duration: "Longest Time",
  fastest_pace: "Fastest Pace",
  fastest_speed: "Top Avg Speed",
  biggest_climb: "Biggest Climb",
};

const RECORD_ORDER: PersonalRecordType[] = [
  "longest_distance",
  "fastest_pace",
  "fastest_speed",
  "longest_duration",
  "biggest_climb",
];

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatPace(secondsPerKm: number): string {
  const s = Math.round(secondsPerKm);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")} /km`;
}

function formatSpeed(metersPerSecond: number): string {
  return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
}

function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

function formatRecordValue(record: PersonalRecord): string {
  switch (record.record_type) {
    case "longest_distance":
      return formatDistance(record.value);
    case "longest_duration":
      return formatDuration(record.value);
    case "fastest_pace":
      return formatPace(record.value);
    case "fastest_speed":
      return formatSpeed(record.value);
    case "biggest_climb":
      return formatElevation(record.value);
  }
}

export default function PersonalRecordsCard({ records }: { records: PersonalRecord[] }) {
  if (!records.length) return null;

  const bySport = new Map<SportType, PersonalRecord[]>();
  for (const r of records) {
    const list = bySport.get(r.sport_type) ?? [];
    list.push(r);
    bySport.set(r.sport_type, list);
  }

  const sports = Array.from(bySport.keys());

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 className="section-title">Personal Records</h3>
      {sports.map((sport) => {
        const sportRecords = (bySport.get(sport) ?? []).slice().sort(
          (a, b) => RECORD_ORDER.indexOf(a.record_type) - RECORD_ORDER.indexOf(b.record_type),
        );
        return (
          <div key={sport} style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                color: SPORT_COLORS[sport],
              }}
            >
              <SportIcon sport={sport} size={20} color="currentColor" />
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {SPORT_LABELS[sport] ?? sport}
              </span>
            </div>
            <div className="pr-grid">
              {sportRecords.map((pr) => (
                <Link
                  key={`${pr.sport_type}-${pr.record_type}`}
                  to={`/activities/${pr.activity_id}`}
                  className="pr-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="pr-card-value">{formatRecordValue(pr)}</div>
                  <div className="pr-card-label">{RECORD_LABELS[pr.record_type]}</div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
