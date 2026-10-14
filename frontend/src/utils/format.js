export const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatClock = (value) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

// 83000 -> "1m 23s"
export const formatDuration = (ms) => {
  if (!ms || ms < 1000) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

// 5000 -> "+5s" (time since the first event in the journey)
export const formatOffset = (ms) => `+${formatDuration(ms)}`;

export const shortId = (id) => (id ? id.slice(0, 8) : "");

// "https://shop.com/cart?x=1" -> "/cart"
export const pathOf = (url) => {
  try {
    const { pathname } = new URL(url);
    return pathname || "/";
  } catch {
    return url;
  }
};

export const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};
