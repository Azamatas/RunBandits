import { useQuery } from "@tanstack/react-query";
import { getFeed } from "../api/feed";
import ActivityCard from "../components/ActivityCard";

export default function Feed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed(0),
  });

  return (
    <div className="page">
      <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Your Feed</h2>
      {isLoading && <p style={{ color: "#888" }}>Loading…</p>}
      {isError && <p className="error">Failed to load feed.</p>}
      {data?.length === 0 && (
        <p style={{ color: "#888" }}>No activities yet. Follow some athletes or log your first activity!</p>
      )}
      {data?.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} queryKey={["feed"]} />
      ))}
    </div>
  );
}
