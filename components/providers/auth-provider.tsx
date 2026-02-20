"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { checkAuth } from "@/lib/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const result = await checkAuth();
        if (result && result.authenticated && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/verify" ||
      pathname === "/reset-password";

    const isPublicPage = pathname.startsWith("/verify-email");

    if (isAuthenticated) {
      if (isAuthPage) {
        router.push("/");
      }
    } else {
      if (!isAuthPage && !isPublicPage) {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  return <>{children}</>;
}
