// The only file that knows how to talk to the network.
// Every API call goes through here, so error handling lives in one place.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export async function http(path, { params } = {}) {
  const query = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
      )
    : "";

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${query}`);
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return body.data; // unwrap { statusCode, data, message, success }
}
