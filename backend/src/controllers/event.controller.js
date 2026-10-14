import { Event } from "../models/event.model.js";
import { MAX_BATCH_SIZE } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateEventPayload } from "../validators/event.validator.js";

// POST /api/v1/events
// Accepts one event object OR an array of events (batching).
const createEvent = asyncHandler(async (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];

  if (payload.length === 0) {
    throw new ApiError(400, "Request body must contain at least one event");
  }
  if (payload.length > MAX_BATCH_SIZE) {
    throw new ApiError(400, `A maximum of ${MAX_BATCH_SIZE} events can be sent at once`);
  }

  const userAgent = (req.get("user-agent") || "").slice(0, 300);
  const docs = [];
  const errors = [];

  payload.forEach((raw, index) => {
    const result = validateEventPayload(raw);
    if (result.errors.length > 0) {
      errors.push(...result.errors.map((message) => `events[${index}]: ${message}`));
    } else {
      docs.push({ ...result.doc, userAgent });
    }
  });

  // All-or-nothing: if any event is invalid we store none and explain why.
  if (errors.length > 0) {
    throw new ApiError(400, "Invalid event payload", errors);
  }

  const saved = await Event.insertMany(docs);

  return res
    .status(201)
    .json(new ApiResponse(201, { count: saved.length }, "Event(s) recorded"));
});

export { createEvent };
