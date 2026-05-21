import client from "./client";
import type {
  Segment,
  SegmentCreatePayload,
  SegmentEffort,
  SegmentLeaderboardEntry,
} from "../types/api";

export const getSegments = (params?: { offset?: number; limit?: number }): Promise<Segment[]> =>
  client.get("/segments/", { params }).then((r) => r.data);

export const getSegment = (id: number | string): Promise<Segment> =>
  client.get(`/segments/${id}`).then((r) => r.data);

export const getSegmentLeaderboard = (id: number | string): Promise<SegmentLeaderboardEntry[]> =>
  client.get(`/segments/${id}/leaderboard`).then((r) => r.data);

export const getMySegmentEfforts = (id: number | string): Promise<SegmentEffort[]> =>
  client.get(`/segments/${id}/efforts`).then((r) => r.data);

export const createSegment = (data: SegmentCreatePayload): Promise<Segment> =>
  client.post("/segments/", data).then((r) => r.data);
