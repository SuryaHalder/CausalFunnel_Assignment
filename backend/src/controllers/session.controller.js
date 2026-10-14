import { Event } from "../models/event.model.js";
import { EVENT_TYPES } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

// GET /api/v1/sessions?page=1&limit=20
// A "session" is not a stored document; we build the list by grouping events.
const getSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [result] = await Event.aggregate([
    // Sorting by (sessionId, timestamp) matches our compound index, so MongoDB
    // can stream the documents in order instead of sorting them in memory.
    { $sort: { sessionId: 1, timestamp: 1 } },
    {
      $group: {
        _id: "$sessionId",
        totalEvents: { $sum: 1 },
        pageViews: {
          $sum: { $cond: [{ $eq: ["$eventType", EVENT_TYPES.PAGE_VIEW] }, 1, 0] },
        },
        clicks: {
          $sum: { $cond: [{ $eq: ["$eventType", EVENT_TYPES.CLICK] }, 1, 0] },
        },
        firstSeen: { $first: "$timestamp" },
        lastSeen: { $last: "$timestamp" },
        entryPage: { $first: "$pageUrl" },
      },
    },
    { $sort: { lastSeen: -1 } }, // newest activity first
    {
      // $facet runs two sub-pipelines on the same input: the page of rows, and the total.
      $facet: {
        rows: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              sessionId: "$_id",
              totalEvents: 1,
              pageViews: 1,
              clicks: 1,
              firstSeen: 1,
              lastSeen: 1,
              entryPage: 1,
              durationMs: { $subtract: ["$lastSeen", "$firstSeen"] },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const total = result.total[0]?.count ?? 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessions: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      "Sessions fetched successfully"
    )
  );
});

// GET /api/v1/sessions/:sessionId/events
// The user journey: every event of one session, oldest first.
const getSessionEvents = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId || sessionId.length > 100) {
    throw new ApiError(400, "A valid sessionId is required");
  }

  const events = await Event.find({ sessionId })
    .sort({ timestamp: 1, _id: 1 }) // _id breaks ties when two events share a timestamp
    .select("-__v -userAgent -updatedAt")
    .lean();

  if (events.length === 0) {
    throw new ApiError(404, "No events found for this session");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { sessionId, totalEvents: events.length, events },
        "Session events fetched successfully"
      )
    );
});

export { getSessions, getSessionEvents };
