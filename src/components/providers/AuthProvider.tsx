"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AccountStatus, OnboardingStep, UserRole } from "@/constants";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  image?: string;
  isProfileCompleted: boolean;
  onboardingStep: OnboardingStep;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  setAuthUser: (user: AuthUser | null) => void;
  logout: (redirectTo?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.authenticated && data?.user) {
      return data.user as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncRef = useRef<number>(0);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    lastSyncRef.current = Date.now();
    const currentUser = await fetchCurrentSessionUser();
    setUser(currentUser);
    setLoading(false);
    return currentUser;
  }, []);

  useEffect(() => {
    let active = true;
    lastSyncRef.current = Date.now();
    fetchCurrentSessionUser().then((currentUser) => {
      if (!active) return;
      setUser(currentUser);
      setLoading(false);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastSyncRef.current < 30_000) return;
      refreshUser().catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshUser]);

  const logout = useCallback(
    async (redirectTo = "/login") => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } finally {
        setUser(null);
        router.push(redirectTo);
        router.refresh();
      }
    },
    [router]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        setAuthUser: setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return ctx;
}

/**
 * Helper gọi API tự động thử làm mới Access Token một lần nếu nhận 401
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (res.status !== 401) {
    return res;
  }

  const refreshRes = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    return res;
  }

  return fetch(input, {
    ...init,
    credentials: "include",
  });
}

export default AuthProvider;
