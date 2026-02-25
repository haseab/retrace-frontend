const API_BASE_URL_STORAGE_KEY = "API_BASE_URL";
const BEARER_TOKEN_STORAGE_KEY = "BEARER_TOKEN";

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (privacy mode/quota).
  }
}

function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures.
  }
}

export function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.replace(/\/+$/, "");
}

export function setApiBaseUrlInLocalStorage(baseUrl: string): void {
  const normalized = normalizeBaseUrl(baseUrl.trim());
  if (!normalized) {
    removeLocalStorage(API_BASE_URL_STORAGE_KEY);
    return;
  }

  writeLocalStorage(API_BASE_URL_STORAGE_KEY, normalized);
}

export function clearApiBaseUrlFromLocalStorage(): void {
  removeLocalStorage(API_BASE_URL_STORAGE_KEY);
}

export function getApiBaseUrlFromLocalStorage(): string {
  const raw = readLocalStorage(API_BASE_URL_STORAGE_KEY);
  if (!raw) {
    return "";
  }

  return normalizeBaseUrl(raw);
}

export function getApiBearerTokenFromLocalStorage(): string | null {
  return readLocalStorage(BEARER_TOKEN_STORAGE_KEY);
}

export function setApiBearerTokenInLocalStorage(token: string): void {
  const normalized = token.trim();
  if (!normalized) {
    removeLocalStorage(BEARER_TOKEN_STORAGE_KEY);
    return;
  }

  writeLocalStorage(BEARER_TOKEN_STORAGE_KEY, normalized);
}

export function clearApiBearerTokenFromLocalStorage(): void {
  removeLocalStorage(BEARER_TOKEN_STORAGE_KEY);
}

export function buildApiUrl(path: string, baseUrlOverride = ""): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = baseUrlOverride ? normalizeBaseUrl(baseUrlOverride) : getApiBaseUrlFromLocalStorage();
  if (!baseUrl) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

function mergeHeadersWithBearer(headersInit: HeadersInit | undefined, token: string): Headers {
  const headers = new Headers(headersInit ?? {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(buildApiUrl(path), init);
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getApiBearerTokenFromLocalStorage();
  if (!token) {
    throw new Error("Missing API token in localStorage. Set BEARER_TOKEN.");
  }

  return apiFetch(path, {
    ...init,
    headers: mergeHeadersWithBearer(init.headers, token),
  });
}
