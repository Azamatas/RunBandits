import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { REFETCH_INTERVAL_MS } from "../constants/query";
import {
  searchUsers,
  getFriends,
  getIncomingFriendRequests,
  getSentFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from "../api/users";
import UserCard from "../components/UserCard";
import { SearchIcon } from "../components/SportIcon";
import { HERO_IMAGES } from "../constants/images";

const VIEW_STORAGE_KEY = "crew.viewMode";
type ViewMode = "list" | "grid";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "list";
  const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return v === "grid" ? "grid" : "list";
}

export default function Social() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>(readStoredView);
  const qc = useQueryClient();

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const listClass = view === "grid" ? "crew-grid" : "crew-list";

  const { data: searchResults } = useQuery({
    queryKey: ["searchUsers", query],
    queryFn: () => searchUsers(query),
    enabled: true,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const { data: incomingFriendRequests = [] } = useQuery({
    queryKey: ["incomingFriendRequests"],
    queryFn: getIncomingFriendRequests,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const { data: sentFriendRequests = [] } = useQuery({
    queryKey: ["sentFriendRequests"],
    queryFn: getSentFriendRequests,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const friendIds = new Set(friends.map((u) => u.id));
  const pendingIncomingIds = new Set(incomingFriendRequests.map((r) => r.requester_id));
  const pendingOutgoingIds = new Set(sentFriendRequests.map((r) => r.addressee_id));

  const sendFriendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["sentFriendRequests"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["incomingFriendRequests"] });
      qc.invalidateQueries({ queryKey: ["sentFriendRequests"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["sentFriendRequests"] });
      qc.invalidateQueries({ queryKey: ["incomingFriendRequests"] });
      qc.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });

  function getStatus(userId) {
    if (friendIds.has(userId)) return "accepted";
    if (pendingIncomingIds.has(userId)) return "incoming";
    if (pendingOutgoingIds.has(userId)) return "pending";
    return null;
  }

  const incoming = incomingFriendRequests;

  // Build connections list: friends + sent requests
  const connections = [
    ...friends.map((f) => ({ ...f, status: "accepted" })),
    ...sentFriendRequests.map((req: any) => ({
      ...(req.addressee ?? { id: req.addressee_id, username: `#${req.addressee_id}` }),
      status: "pending",
      requestId: req.id,
    })),
  ];



  return (
    <div className="page social-page">
      <div className="social-hero" style={{ backgroundImage: `url(${HERO_IMAGES.explore})` }}>
        <div className="social-hero-overlay">
          <h2>Crew</h2>
          <p>Find your crew of bandits</p>
        </div>
      </div>

      <div className="feed-toolbar">
        <div className="view-toggle" role="tablist" aria-label="Crew layout">
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

      <div className="friends-section">
        <h3 className="section-title">Your Connections</h3>
        {connections.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No connections yet. Search for athletes to connect.</p>
        ) : (
          <div className={listClass}>
            {connections.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                status={user.status}
                onUnfollow={() => removeFriendMutation.mutate(user.id)}
                onCancel={() => removeFriendMutation.mutate(user.id)}
                loading={removeFriendMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <div className="search-bar">
        <span className="search-bar-icon">
          <SearchIcon size={18} color="var(--text-muted)" />
        </span>
        <input
          placeholder="Search athletes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {incoming.length > 0 && !query && (
        <div style={{ marginBottom: 32 }}>
          <h3 className="section-title">Friend Requests</h3>
          <div className={listClass}>
            {incoming.map((req) => (
              <UserCard
                key={req.requester_id}
                user={req.requester}
                status="incoming"
                onAccept={() => acceptFriendRequestMutation.mutate(req.requester_id)}
                loading={acceptFriendRequestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults?.length > 0 && (
        <div data-testid="search-results">
          <h3 className="section-title">{query ? "Search Results" : "Suggested Athletes"}</h3>
          <div className={listClass}>
            {searchResults?.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                status={query ? getStatus(u.id) : null}
                onFollow={() => sendFriendRequestMutation.mutate(u.id)}
                onAccept={() => acceptFriendRequestMutation.mutate(u.id)}
                loading={sendFriendRequestMutation.isPending || acceptFriendRequestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
      {searchResults?.length === 0 && query && (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
          No athletes found.
        </p>
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
