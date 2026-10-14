import mongoose, { Schema } from "mongoose";
import { EVENT_TYPES } from "../constants.js";

// One document = one thing a visitor did (a page view or a click).
// Sessions are NOT stored separately: they are derived by grouping events on
// `sessionId`. That keeps writes cheap (one insert) and avoids two sources of truth.
const eventSchema = new Schema(
  {
    sessionId: { type: String, required: true, trim: true, maxlength: 100 },
    eventType: {
      type: String,
      enum: Object.values(EVENT_TYPES),
      required: true,
    },
    pageUrl: { type: String, required: true, maxlength: 2000 }, // full URL as seen
    pageKey: { type: String, required: true, maxlength: 2000 }, // origin + path (for grouping)
    timestamp: { type: Date, required: true }, // when it happened on the client

    // Click-only fields
    x: { type: Number, min: 0 }, // pixels from the left edge of the whole page
    y: { type: Number, min: 0 }, // pixels from the top edge of the whole page
    pageWidth: { type: Number, min: 1 },
    pageHeight: { type: Number, min: 1 },
    viewportWidth: { type: Number, min: 1 },
    viewportHeight: { type: Number, min: 1 },
    target: {
      tag: { type: String, maxlength: 30 },
      id: { type: String, maxlength: 100 },
      text: { type: String, maxlength: 80 },
    },

    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true } // adds createdAt / updatedAt (server time)
);

// Indexes = pre-sorted lookup tables. Each one exists for a specific query:
// 1) sessions list + one session's journey (group / filter by session, ordered by time)
eventSchema.index({ sessionId: 1, timestamp: 1 });
// 2) heatmap: all clicks for one page
eventSchema.index({ pageKey: 1, eventType: 1 });

export const Event = mongoose.model("Event", eventSchema);
