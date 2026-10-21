const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Call the AI StudyMate backend with the user's Clerk session token.
 *
 * Every backend route requires authentication, so this helper attaches the
 * token, sends JSON, and turns non-2xx responses into a thrown Error whose
 * message is the backend's own `detail` text.
 */
export async function apiFetch(path, { token, method = "GET", body } = {}) {
  if (!token) {
    throw new Error("Please sign in to use AI StudyMate.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page); fall through to status check.
  }

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : data.message || `Request failed (${response.status})`;

    throw new Error(detail);
  }

  return data;
}

export function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
