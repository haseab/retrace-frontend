"use client";

import { useState, useEffect, ReactNode } from "react";

// SHA-256 hash of the password - generate with: echo -n "yourpassword" | shasum -a 256
const ADMIN_PASSWORD_HASH = "a68c0f407849dc00666288a70913c3ae03d2f2bea0bcc8f72cf9dec8fe646247"; // hash of "retrace2024"

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = await sha256(password);
    if (hashedInput === ADMIN_PASSWORD_HASH) {
      setIsAuthenticated(true);
      setError("");
      localStorage.setItem("admin_auth", "true");
    } else {
      setError("Incorrect password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[hsl(var(--muted-foreground))]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[hsl(var(--card))] rounded-xl p-8 border border-[hsl(var(--border))]">
            <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
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
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Login
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
import { createContext, useContext } from "react";

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
