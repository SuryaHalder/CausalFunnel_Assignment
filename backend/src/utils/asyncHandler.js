// Express 4 does not catch rejected promises from async route handlers.
// This wrapper forwards any failure to next(), i.e. to the error middleware,
// so controllers don't need a try/catch each.
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export { asyncHandler };
