import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// Turns ?page=2&limit=20 into safe numbers plus the `skip` MongoDB needs.
export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  return { page, limit, skip: (page - 1) * limit };
};
