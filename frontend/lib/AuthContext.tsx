"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, logoutUser, type User } from "@/lib/api";

type AuthUser = {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: string;
  is_onboarded: boolean;
} | null;

type AuthContextType = {
  user: AuthUser;
  loading: boolean;
  login: (userData: NonNullable<AuthUser>) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function refreshSession() {
    try {
      const data = await getMe();
      if (data && data.user) {
        const logged = {
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          full_name: data.user.full_name,
          role: data.user.role,
          is_onboarded: data.user.is_onboarded,
        };
        setUser(logged);
        localStorage.setItem("sb_user", JSON.stringify(logged));
      } else {
        throw new Error("No user in response");
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem("sb_user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Try local storage sync first (optimistic UI)
    const cachedUser = localStorage.getItem("sb_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("sb_user");
      }
    }

    // 2. Validate session against backend HTTPOnly cookie
    refreshSession();
  }, []);

  // Sync role redirections securely
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/", "/browse", "/login", "/register", "/verify", "/admin/login"];
    const isPublic = publicRoutes.some((route) => pathname === route || pathname.startsWith("/workers/"));

    if (!user) {
      // Unauthenticated state
      if (!isPublic && !pathname.startsWith("/onboarding")) {
        if (pathname.startsWith("/admin")) {
          router.replace("/admin/login");
        } else {
          router.replace("/login");
        }
      }
    } else {
      // Authenticated state route guards
      const currentRole = user.role.toLowerCase();
      
      if (pathname === "/login" || pathname === "/verify" || pathname === "/register" || pathname === "/admin/login") {
        // Already authenticated, redirect to portal or onboarding
        redirectToPortal(user.role, user.is_onboarded);
      } else if (pathname.startsWith("/(customer)") || pathname.startsWith("/book") || pathname.startsWith("/bookings") || pathname === "/dashboard") {
        if (currentRole !== "customer") {
          redirectToPortal(user.role, user.is_onboarded);
        } else if (!user.is_onboarded) {
          router.replace("/onboarding/customer");
        }
      } else if (pathname.startsWith("/home") || pathname.startsWith("/requests") || pathname.startsWith("/job") || pathname.startsWith("/earnings")) {
        if (currentRole !== "worker") {
          redirectToPortal(user.role, user.is_onboarded);
        } else if (!user.is_onboarded) {
          router.replace("/onboarding/worker");
        }
      } else if (pathname.startsWith("/admin")) {
        if (currentRole !== "admin") {
          redirectToPortal(user.role, user.is_onboarded);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, pathname]);

  function redirectToPortal(role: string, is_onboarded_val?: boolean) {
    const normRole = role.toLowerCase();
    if (normRole === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    const onboarded = is_onboarded_val ?? user?.is_onboarded;
    if (onboarded === false) {
      router.replace(`/onboarding/${normRole}`);
      return;
    }
    if (normRole === "worker") {
      router.replace("/home");
    } else {
      router.replace("/dashboard");
    }
  }

  function login(userData: NonNullable<AuthUser>) {
    setUser(userData);
    localStorage.setItem("sb_user", JSON.stringify(userData));
    redirectToPortal(userData.role, userData.is_onboarded);
  }

  async function logout() {
    setLoading(true);
    try {
      await logoutUser();
    } catch {
      // Log out locally even if API fails
    }
    setUser(null);
    localStorage.removeItem("sb_user");
    router.replace("/");
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
