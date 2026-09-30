"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { modeCookieName, supabaseConfigured, type DataMode } from "@/lib/supabase/config";

type Identity = { user: User | null; business: { id: string; name: string; city: string; type: string } | null; name: string };
type ModeContext = Identity & { mode: DataMode; ready: boolean; identityError: string; configured: boolean; chooseMode: (mode: DataMode) => void; refreshIdentity: () => Promise<void>; signOut: () => Promise<void> };
const Context = createContext<ModeContext | null>(null);

export function DataModeProvider({ initialMode, children }: { initialMode: DataMode; children: ReactNode }) {
  const [mode, setMode] = useState<DataMode>(supabaseConfigured ? initialMode : "demo");
  const [identity, setIdentity] = useState<Identity>({ user: null, business: null, name: "" });
  const [ready, setReady] = useState(!supabaseConfigured || initialMode === "demo");
  const [identityError, setIdentityError] = useState("");
  const identityGeneration = useRef(0);
  const chooseMode = useCallback((next: DataMode) => {
    const selected = supabaseConfigured ? next : "demo";
    document.cookie = `${modeCookieName}=${selected}; Path=/; SameSite=Lax; Max-Age=31536000`;
    setMode(selected);
    identityGeneration.current += 1;
    setIdentityError("");
    setIdentity({ user: null, business: null, name: "" });
    setReady(selected === "demo");
  }, []);
  const refreshIdentity = useCallback(async () => {
    const generation = ++identityGeneration.current;
    const client = getSupabaseBrowserClient();
    if (!client) { setReady(true); return; }
    setIdentityError("");
    try {
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (generation !== identityGeneration.current) return;
      if (authError && authError.name !== "AuthSessionMissingError") throw authError;
      if (!user) { setIdentity({ user: null, business: null, name: "" }); return; }
      const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
        client.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        client.from("business_members").select("business_id,businesses(id,name,location_city,business_type)").eq("user_id", user.id).order("created_at").limit(1).maybeSingle(),
      ]);
      if (generation !== identityGeneration.current) return;
      if (profileError || membershipError) throw new Error("identity");
      const rawBusiness = membership?.businesses as unknown as { id: string; name: string; location_city: string; business_type: string } | null;
      setIdentity({ user, name: profile?.full_name || String(user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"), business: rawBusiness ? { id: rawBusiness.id, name: rawBusiness.name, city: rawBusiness.location_city, type: rawBusiness.business_type } : null });
      if (!rawBusiness) setIdentityError("Your business membership could not be found. Please contact your workspace administrator.");
    } catch {
      if (generation === identityGeneration.current) { setIdentityError("Unable to verify your account. Please try again."); setIdentity({ user: null, business: null, name: "" }); }
    }
    finally { if (generation === identityGeneration.current) setReady(true); }
  }, []);
  useEffect(() => {
    if (mode !== "real") return;
    let active = true;
    const timer = window.setTimeout(() => { if (active) void refreshIdentity(); }, 0);
    const client = getSupabaseBrowserClient();
    const subscription = client?.auth.onAuthStateChange(() => { if (active) window.setTimeout(() => { if (active) void refreshIdentity(); }, 0); });
    return () => { active = false; identityGeneration.current += 1; window.clearTimeout(timer); subscription?.data.subscription.unsubscribe(); };
  }, [mode, refreshIdentity]);
  const signOut = useCallback(async () => {
    const result = await getSupabaseBrowserClient()?.auth.signOut();
    if (result?.error) throw new Error("Unable to sign out. Please try again.");
    identityGeneration.current += 1;
    if (identity.user && identity.business) {
      try { sessionStorage.removeItem(`capacity-real-session-v1:${identity.user.id}:${identity.business.id}`); } catch { /* Optional transient context. */ }
    }
    setIdentity({ user: null, business: null, name: "" });
    chooseMode("demo");
  }, [chooseMode, identity]);
  return <Context.Provider value={{ ...identity, mode, ready, identityError, configured: supabaseConfigured, chooseMode, refreshIdentity, signOut }}>{children}</Context.Provider>;
}

export function useDataMode() {
  const value = useContext(Context);
  if (!value) throw new Error("Data mode provider is missing.");
  return value;
}
