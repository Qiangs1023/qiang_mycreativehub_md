import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  configured: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  isAdmin: false,
  configured: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    // Subscribe FIRST, then check session
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer to avoid deadlocks inside the auth callback
        setTimeout(() => {
          void checkAdmin(s.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    client.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) void checkAdmin(s.user.id);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function checkAdmin(userId: string) {
    const client = getSupabaseClient();
    if (!client) return;

    // Primary: check JWT app_metadata role via getUser() (always available in the token)
    try {
      const { data: userData } = await client.auth.getUser();
      const appMetaRole = (userData?.user as any)?.app_metadata?.role;
      if (appMetaRole === "admin") {
        setIsAdmin(true);
        return;
      }
      // Also check top-level role claim in JWT
      const topRole = (userData?.user as any)?.role;
      if (topRole === "admin") {
        setIsAdmin(true);
        return;
      }
    } catch (_) {
      // getUser failed — continue to DB check
    }

    // Secondary: check user_roles table (may fail due to PostgREST schema cache issues)
    try {
      const { data } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (data) {
        setIsAdmin(true);
        return;
      }
    } catch (_) {
      // DB query failed — fall through
    }

    setIsAdmin(false);
  }

  async function signOut() {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
  }

  return (
    <Ctx.Provider
      value={{ user, session, isAdmin, configured: isSupabaseConfigured, loading, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
