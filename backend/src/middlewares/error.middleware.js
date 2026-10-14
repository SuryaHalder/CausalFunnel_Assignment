import { ApiError } from "../utils/ApiError.js";

// Catches requests to /api/... that matched no route.
export const apiNotFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// The single place where every error becomes a JSON response.
// Express recognises it as an error handler because it has FOUR parameters.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // express.json() failed to parse the body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON";
  }
  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  if (statusCode >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Internal Server Error";
  }

  res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    errors: err.errors || [],
  });
};
