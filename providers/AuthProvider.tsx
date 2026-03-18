"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, db, isSupabaseConfigured } from "@/lib/supabase";

type ProfileRow = { id: string; name: string; email: string; phone: string | null; avatar_url: string | null; role: string; organization_id: string | null };
type OrgRow = { id: string; name: string; slug: string; logo_url: string | null; plan: string; subscription_status: string; trial_ends_at: string | null; max_members: number; max_integrations: number };
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, Organization } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  organization: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfileAndOrg = useCallback(async (userId: string) => {
    const { data } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!data) return;

    const p: Profile = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatar_url,
      role: data.role as Profile["role"],
      organization_id: data.organization_id,
    };
    setProfile(p);

    if (data.organization_id) {
      const { data: orgData } = await db
        .from("organizations")
        .select("id, name, slug, logo_url, plan, subscription_status, trial_ends_at, max_members, max_integrations")
        .eq("id", data.organization_id)
        .single();

      if (orgData) {
        setOrganization({
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
          logo_url: orgData.logo_url,
          plan: orgData.plan as Organization["plan"],
          subscription_status: orgData.subscription_status as Organization["subscription_status"],
          trial_ends_at: orgData.trial_ends_at,
          max_members: orgData.max_members,
          max_integrations: orgData.max_integrations,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then((res) => {
      const s = res?.data?.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfileAndOrg(s.user.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfileAndOrg(s.user.id);
      } else {
        setProfile(null);
        setOrganization(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndOrg]);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }

    const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some(
      (r) => pathname.startsWith(r),
    );
    if (user && isAuthRoute) {
      const isNewUser = user.user_metadata?.is_new_user === true ||
        (user.created_at && Date.now() - new Date(user.created_at).getTime() < 60_000);
      router.replace(isNewUser ? "/admin/setup" : "/overview");
      return;
    }

    // Logado na landing page (/) → redirecionar para o dashboard
    if (user && pathname === "/") {
      const isNewUser = user.user_metadata?.is_new_user === true ||
        (user.created_at && Date.now() - new Date(user.created_at).getTime() < 60_000);
      router.replace(isNewUser ? "/admin/setup" : "/overview");
    }
  }, [user, loading, pathname, router]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setSession(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, profile, organization, session, loading, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
