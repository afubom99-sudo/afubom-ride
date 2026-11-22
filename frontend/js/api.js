export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem("bb_access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("bb_refresh_token");
}

export function saveSession(data) {
  localStorage.setItem("bb_access_token", data.access_token);
  localStorage.setItem("bb_refresh_token", data.refresh_token);
}

export function clearSession() {
  localStorage.removeItem("bb_access_token");
  localStorage.removeItem("bb_refresh_token");
  localStorage.removeItem("bb_user");
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`/api/v1${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Could not reach the server. Check your internet connection.");
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail || data?.error?.message || "The request could not be completed.";
    throw new ApiError(detail, response.status);
  }
  return data;
}
