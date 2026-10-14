import { Event } from "../models/event.model.js";
import { EVENT_TYPES, MAX_HEATMAP_POINTS } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizePageUrl } from "../utils/url.js";

// GET /api/v1/heatmap/pages
// Powers the page dropdown: every tracked page with its click and view counts.
const getHeatmapPages = asyncHandler(async (_req, res) => {
  const pages = await Event.aggregate([
    {
      $group: {
        _id: "$pageKey",
        clicks: { $sum: { $cond: [{ $eq: ["$eventType", EVENT_TYPES.CLICK] }, 1, 0] } },
        pageViews: { $sum: { $cond: [{ $eq: ["$eventType", EVENT_TYPES.PAGE_VIEW] }, 1, 0] } },
      },
    },
    { $sort: { clicks: -1 } },
    { $project: { _id: 0, url: "$_id", clicks: 1, pageViews: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { pages }, "Tracked pages fetched successfully"));
});

// GET /api/v1/heatmap?url=https://example.com/pricing
// Returns raw click positions for one page; the frontend decides how to draw them.
const getHeatmapData = asyncHandler(async (req, res) => {
  const pageKey = normalizePageUrl(req.query.url);
  if (!pageKey) {
    throw new ApiError(400, "Query param `url` must be a valid absolute URL");
  }

  const filter = { pageKey, eventType: EVENT_TYPES.CLICK };

  const [clicks, totalClicks] = await Promise.all([
    Event.find(filter)
      .sort({ timestamp: -1 }) // if we must cap, keep the most recent clicks
      .limit(MAX_HEATMAP_POINTS)
      .select("x y pageWidth pageHeight viewportWidth viewportHeight -_id")
      .lean(),
    Event.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { url: pageKey, totalClicks, returned: clicks.length, clicks },
      "Heatmap data fetched successfully"
    )
  );
});

export { getHeatmapPages, getHeatmapData };
