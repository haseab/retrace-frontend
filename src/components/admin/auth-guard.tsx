"use client";

import { useState, useEffect, ReactNode, createContext, useContext } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockedUntil && lockedUntil > Date.now()) {
      const interval = setInterval(() => {
        if (Date.now() >= lockedUntil) {
          setLockedUntil(null);
          setError("");
          setRemainingAttempts(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      if (res.ok) {
        setIsAuthenticated(true);
      }
    } catch {
      // Not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || (lockedUntil && lockedUntil > Date.now())) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        setError("");
        setPassword("");
      } else if (res.status === 429) {
        // Rate limited
        setLockedUntil(Date.now() + (data.retryAfter * 1000));
        setError(`Too many attempts. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
        setRemainingAttempts(0);
      } else {
        setError(data.error || "Invalid password");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors
    }
    setIsAuthenticated(false);
    setPassword("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isLocked = lockedUntil && lockedUntil > Date.now();
    const lockoutRemaining = isLocked ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(var(--card))] rounded-xl p-8 border border-[hsl(var(--border))]">
            <h1 className="text-2xl font-bold text-center mb-6">Access Required</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  placeholder="Enter password"
                  autoFocus
                  disabled={isLocked || isSubmitting}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-yellow-400 text-sm mb-4">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                </p>
              )}
              {isLocked && (
                <p className="text-orange-400 text-sm mb-4">
                  Locked for {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, "0")}
                </p>
              )}
              <button
                type="submit"
                disabled={isLocked || isSubmitting}
                className="w-full py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Verifying..." : isLocked ? "Locked" : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Context for logout function
interface AuthContextType {
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthGuard");
  }
  return context;
}
