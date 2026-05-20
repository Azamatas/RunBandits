import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getFeed } from "../api/feed";
import { useAuth } from "../context/AuthContext";
import ActivityCard from "../components/ActivityCard";
import { HERO_IMAGES, EMPTY_STATE_IMAGES } from "../constants/images";
import type { Activity } from "../types/api";

const PAGE_SIZE = 20;
const FEED_KEY: readonly ["feed", number] = ["feed", 0] as const;
const VIEW_STORAGE_KEY = "feed.viewMode";
type ViewMode = "list" | "grid";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "list";
  const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return v === "grid" ? "grid" : "list";
}

export default function Feed() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [view, setView] = useState<ViewMode>(readStoredView);

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const { data: allActivities = [], isLoading, isError } = useQuery<Activity[]>({
    queryKey: FEED_KEY as unknown as readonly unknown[],
    queryFn: () => getFeed(0),
    refetchInterval: 5000,
  });

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const current = qc.getQueryData<Activity[]>(FEED_KEY as unknown as readonly unknown[]) ?? [];
      const more = await getFeed(current.length);
      qc.setQueryData<Activity[]>(FEED_KEY as unknown as readonly unknown[], [...current, ...more]);
      setHasMore(more.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [qc]);

  return (
    <div className="page">
      <div className="feed-hero" style={{ backgroundImage: `url(${HERO_IMAGES.feed})` }}>
        <div className="feed-hero-overlay">
          <h2 className="feed-greeting">
            {getGreeting()}{user?.username ? `, ${user.username}` : ""}
          </h2>
          <p className="feed-sub">Here's what your network has been up to.</p>
        </div>
      </div>

      {isLoading && (
        <>
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </>
      )}

      {isError && <div className="error">Failed to load feed. Please try again.</div>}

      {!isLoading && allActivities.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-image">
              <img src={EMPTY_STATE_IMAGES.noActivities} alt="Start your journey" />
            </div>
            <h3>No activities yet</h3>
            <p>Add some friends or add your first activity to get started!</p>
            <Link to="/add-activity" className="btn-primary">Add Your First Activity</Link>
          </div>
        </div>
      )}

      {!isLoading && allActivities.length > 0 && (
        <div className="feed-toolbar">
          <div className="view-toggle" role="tablist" aria-label="Feed layout">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <ListIcon /> List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "grid"}
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <GridIcon /> Grid
            </button>
          </div>
        </div>
      )}

      <div className={view === "grid" ? "feed-grid" : undefined}>
        {allActivities.map((activity, i) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            queryKey={["feed", 0]}
            style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
          />
        ))}
      </div>

      {hasMore && allActivities.length > 0 && (
        <div className="load-more">
          <button onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="4" x2="13" y2="4" />
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="12" x2="13" y2="12" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.8" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="0.8" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="0.8" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="0.8" />
    </svg>
  );
}
