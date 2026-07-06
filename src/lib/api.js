export const API_BASE = "https://monkeycrm.onrender.com";

export const SOCKET_BASE = API_BASE.replace(/^http/, "ws");

export function getToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("crm_auth_token") ?? "";
}

export function authHeaders(isFormData = false) {
    const token = getToken();
    return {
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export async function apiFetch(path, options = {}) {
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...authHeaders(isFormData),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("crm_auth_token");
        localStorage.removeItem("crm_user");
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json.message || `Error ${res.status}: ${res.statusText}`);
    }

    return json;
}