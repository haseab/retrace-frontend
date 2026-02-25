"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  buildApiUrl,
  clearApiBaseUrlFromLocalStorage,
  clearApiBearerTokenFromLocalStorage,
  getApiBaseUrlFromLocalStorage,
  getApiBearerTokenFromLocalStorage,
  setApiBaseUrlInLocalStorage,
  setApiBearerTokenInLocalStorage,
} from "@/lib/client-api";

interface BearerTokenGuardProps {
  children: ReactNode;
}

interface ApiTokenContextValue {
  clearBearerToken: () => void;
  hasBearerToken: boolean;
}

const ApiTokenContext = createContext<ApiTokenContextValue | null>(null);

interface TokenValidationResult {
  ok: boolean;
  message?: string;
}

async function fetchTokenValidation(url: string, token: string): Promise<Response> {
  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function validateBearerToken(token: string, baseUrl: string): Promise<TokenValidationResult> {
  const tokenCheckUrl = buildApiUrl("/api/auth/token-check", baseUrl);
  const legacyCheckUrl = buildApiUrl("/api/feedback?limit=1&offset=0", baseUrl);

  try {
    let response = await fetchTokenValidation(tokenCheckUrl, token);
    if (response.status === 404 && tokenCheckUrl !== legacyCheckUrl) {
      response = await fetchTokenValidation(legacyCheckUrl, token);
    }

    if (response.ok) {
      return { ok: true };
    }

    let details = "";
    try {
      const payload = await response.json();
      const payloadRecord = payload as { details?: unknown; error?: unknown };
      if (typeof payloadRecord.details === "string") {
        details = payloadRecord.details;
      } else if (typeof payloadRecord.error === "string") {
        details = payloadRecord.error;
      }
    } catch {
      // Ignore JSON parse errors and use default message.
    }

    if (response.status === 401) {
      return {
        ok: false,
        message: details || "Invalid bearer token.",
      };
    }

    return {
      ok: false,
      message: details || `Token validation failed (${response.status}).`,
    };
  } catch {
    return {
      ok: false,
      message: "Unable to reach the API. Check API_BASE_URL/network.",
    };
  }
}

export function BearerTokenGuard({ children }: BearerTokenGuardProps) {
  const [isCheckingStoredToken, setIsCheckingStoredToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");

  useEffect(() => {
    const savedBaseUrl = getApiBaseUrlFromLocalStorage();
    if (savedBaseUrl) {
      setBaseUrlInput(savedBaseUrl);
    }

    const savedToken = getApiBearerTokenFromLocalStorage();
    if (!savedToken) {
      setIsCheckingStoredToken(false);
      return;
    }

    setTokenInput(savedToken);

    void (async () => {
      const validation = await validateBearerToken(savedToken, savedBaseUrl);
      if (validation.ok) {
        setIsTokenValid(true);
        setError("");
      } else {
        clearApiBearerTokenFromLocalStorage();
        setError(validation.message || "Saved bearer token is invalid.");
      }

      setIsCheckingStoredToken(false);
    })();
  }, []);

  const clearBearerToken = () => {
    clearApiBearerTokenFromLocalStorage();
    setIsTokenValid(false);
    setTokenInput("");
    setError("");
  };

  const contextValue: ApiTokenContextValue = {
    clearBearerToken,
    hasBearerToken: isTokenValid,
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedToken = tokenInput.trim();
    const trimmedBaseUrl = baseUrlInput.trim();

    if (!trimmedToken) {
      setError("Bearer token is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const validation = await validateBearerToken(trimmedToken, trimmedBaseUrl);
    if (!validation.ok) {
      setError(validation.message || "Token validation failed.");
      setIsSubmitting(false);
      return;
    }

    setApiBearerTokenInLocalStorage(trimmedToken);
    if (trimmedBaseUrl) {
      setApiBaseUrlInLocalStorage(trimmedBaseUrl);
    } else {
      clearApiBaseUrlFromLocalStorage();
    }

    setIsTokenValid(true);
    setIsSubmitting(false);
  };

  if (isCheckingStoredToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[hsl(var(--muted-foreground))]">Checking API token...</div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-[hsl(var(--card))] rounded-xl p-8 border border-[hsl(var(--border))]">
          <h1 className="text-2xl font-bold mb-2">Bearer Token Required</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Enter `BEARER_TOKEN` to access the feedback and analytics dashboards.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">
                Bearer Token
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder="Enter BEARER_TOKEN"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">
                API Base URL (optional)
              </label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(event) => setBaseUrlInput(event.target.value)}
                className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                placeholder="https://your-domain.com"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Validating..." : "Save Token"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ApiTokenContext.Provider value={contextValue}>
      {children}
    </ApiTokenContext.Provider>
  );
}

export function useApiToken() {
  const context = useContext(ApiTokenContext);
  if (!context) {
    throw new Error("useApiToken must be used within a BearerTokenGuard");
  }

  return context;
}
