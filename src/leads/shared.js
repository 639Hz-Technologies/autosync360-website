// Shared by the /leads pages (LeadsPage, Pipe).
export const C = { bg: "#f6f8fc", card: "#fff", line: "rgba(15,23,42,0.10)", ink: "#0b1220", text: "#1e293b", mute: "#64748b", accent: "#2563eb", good: "#059669", warn: "#d97706", bad: "#dc2626" };

export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};

export class AuthError extends Error {}

export async function api(path, { token, body, method } = {}) {
  const res = await fetch(`/api/leads/${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
  if (res.status === 401 && path !== "login") throw new AuthError(data.error);
  if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status, data });
  return data;
}
