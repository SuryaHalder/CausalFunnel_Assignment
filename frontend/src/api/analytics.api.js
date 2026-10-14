import { http } from "./http.js";

// One function per backend endpoint. Components import these instead of
// building URLs themselves.
export const getSessions = ({ page = 1, limit = 15 } = {}) =>
  http("/sessions", { params: { page, limit } });

export const getSessionEvents = (sessionId) =>
  http(`/sessions/${encodeURIComponent(sessionId)}/events`);

export const getHeatmapPages = () => http("/heatmap/pages");

export const getHeatmap = (url) => http("/heatmap", { params: { url } });
