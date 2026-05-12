import client from "./client";

export const createActivity = (data) => client.post("/activities/", data).then((r) => r.data);
export const getActivity = (id) => client.get(`/activities/${id}`).then((r) => r.data);
export const updateActivity = (id, data) => client.patch(`/activities/${id}`, data).then((r) => r.data);
export const deleteActivity = (id) => client.delete(`/activities/${id}`);
export const giveKudos = (id) => client.post(`/activities/${id}/kudos`).then((r) => r.data);
export const removeKudos = (id) => client.delete(`/activities/${id}/kudos`);
