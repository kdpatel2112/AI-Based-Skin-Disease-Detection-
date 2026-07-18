import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, preferredLanguage?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    {
    id: "6a3e48820c7c56925b729ee3",
    full_name: "Krishna Patel",
    email: "krishna@example.com",
    role: "admin",
    preferred_language: "en",
    is_verified: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth bypass: always logged in, no token checks
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    // Auth bypass: login succeeds automatically
  }

  async function register(fullName: string, email: string, password: string, preferredLanguage = "en") {
    // Auth bypass: registration succeeds automatically
  }

  type LogoutType = () => void;
  const logout: LogoutType = () => {
    // Auth bypass: logout does not clear user session
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
