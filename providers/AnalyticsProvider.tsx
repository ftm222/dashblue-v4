"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView, identifyUser } from "@/lib/analytics";
import { useAuth } from "@/providers/AuthProvider";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user && profile) {
      identifyUser(user.id, {
        email: user.email,
        name: profile.name,
        role: profile.role,
      });
    }
  }, [user, profile]);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
