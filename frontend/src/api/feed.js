import client from "./client";

export const getFeed = (offset = 0) =>
  client.get("/feed/", { params: { limit: 20, offset } }).then((r) => r.data);
