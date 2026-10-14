// Single place for "magic values" so they are never scattered across files.

export const DB_NAME = "user_analytics";

export const EVENT_TYPES = Object.freeze({
  PAGE_VIEW: "page_view",
  CLICK: "click",
});

// Limits that protect the server and the database
export const MAX_BATCH_SIZE = 50; // events accepted in one POST
export const MAX_HEATMAP_POINTS = 10000; // clicks returned for one page
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
