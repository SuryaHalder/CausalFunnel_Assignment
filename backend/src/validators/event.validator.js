import { EVENT_TYPES } from "../constants.js";
import { normalizePageUrl } from "../utils/url.js";

const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const cleanString = (value, max) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

// Never trust the browser: anyone can POST anything to a public endpoint.
// Input is the snake_case payload sent by tracker.js; output is a camelCase
// document ready for Mongoose, plus a list of human-readable problems.
export const validateEventPayload = (raw) => {
  const errors = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { doc: null, errors: ["event must be a JSON object"] };
  }

  const sessionId = cleanString(raw.session_id, 100);
  if (!sessionId) errors.push("session_id is required (max 100 characters)");

  const eventType = raw.event_type;
  if (!Object.values(EVENT_TYPES).includes(eventType)) {
    errors.push(`event_type must be one of: ${Object.values(EVENT_TYPES).join(", ")}`);
  }

  const pageKey = typeof raw.page_url === "string" ? normalizePageUrl(raw.page_url) : null;
  if (!pageKey) errors.push("page_url must be a valid absolute URL");

  // A wrong client clock should not make us lose the event: fall back to server time.
  let timestamp = new Date(raw.timestamp);
  if (Number.isNaN(timestamp.getTime())) timestamp = new Date();

  const doc = {
    sessionId,
    eventType,
    pageUrl: typeof raw.page_url === "string" ? raw.page_url.slice(0, 2000) : undefined,
    pageKey,
    timestamp,
  };

  if (eventType === EVENT_TYPES.CLICK) {
    if (!isFiniteNumber(raw.x) || raw.x < 0) errors.push("x is required for click events (number >= 0)");
    if (!isFiniteNumber(raw.y) || raw.y < 0) errors.push("y is required for click events (number >= 0)");
    doc.x = raw.x;
    doc.y = raw.y;

    // Optional context, used to scale the heatmap correctly
    for (const [from, to] of [
      ["page_width", "pageWidth"],
      ["page_height", "pageHeight"],
      ["viewport_width", "viewportWidth"],
      ["viewport_height", "viewportHeight"],
    ]) {
      if (isFiniteNumber(raw[from]) && raw[from] >= 1) doc[to] = raw[from];
    }

    if (raw.target && typeof raw.target === "object") {
      doc.target = {
        tag: cleanString(raw.target.tag, 30),
        id: cleanString(raw.target.id, 100),
        text: cleanString(raw.target.text, 80),
      };
    }
  }

  return { doc, errors };
};
