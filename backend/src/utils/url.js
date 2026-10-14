// Heatmaps group clicks "by page". https://shop.com/cart?utm=a#top and
// https://shop.com/cart/ are the same page, so we reduce a URL to origin + path.
export const normalizePageUrl = (href) => {
  try {
    const { origin, pathname } = new URL(href);
    const cleanPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    return `${origin}${cleanPath}`;
  } catch {
    return null; // not a valid absolute URL
  }
};
