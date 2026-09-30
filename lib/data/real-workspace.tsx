"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Capacity } from "@/data/capacities";
import type { CapacityListing, CapacityListingDraft, ListingStatus } from "@/types/capacity-listing";
import type { DemandRequirement, SavedDemand, SelectedCapacityRequest } from "@/types/matching";
import type { CapacityRequest, DemoPerspective, ProposalDraft, RequestAction, RequestDraft } from "@/types/requests";
import { createEmptyDemand } from "@/lib/demand-options";
import { validateDemand } from "@/lib/demand-options";
import { validateCapacityListing } from "@/lib/capacity-listing-rules";
import { validateProposal, validateRequestDraft } from "@/lib/request-rules";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useDataMode } from "./mode";
import { restoreWorkspaceSession, workspaceSessionKey } from "./workspace-session";
import { demandToSaved, listingToCapacity, listingToManaged, requestToView, type DemandRow, type ListingRow, type MessageRow, type ProposalRow, type RequestRow, type TimelineRow } from "./mappers";

export type RealNotification = { id: string; title: string; description: string; link: string; is_read: boolean; created_at: string };
type RealContext = {
  ready: boolean; error: string; refresh: () => Promise<void>;
  providers: Capacity[]; managedListings: CapacityListing[];
  createListing: (draft: CapacityListingDraft) => Promise<string>; updateListing: (id: string, draft: CapacityListingDraft) => Promise<void>; setListingStatus: (id: string, status: ListingStatus) => Promise<void>;
  draft: DemandRequirement; submittedDemand: DemandRequirement | null; selectedRequest: SelectedCapacityRequest | null; demands: SavedDemand[]; activeDemandId: string | null;
  saveDraft: (draft: DemandRequirement) => void; submitDemand: (draft: DemandRequirement) => Promise<void>; selectRequest: (providerId: string, demand: DemandRequirement, matchContext?: SelectedCapacityRequest["matchContext"]) => void;
  newDemand: () => void; editDemand: (id: string) => void; viewDemandMatches: (id: string) => void; duplicateDemand: (id: string) => Promise<string | undefined>; closeDemand: (id: string) => Promise<void>; recordMatches: (summary: { evaluated: number; bestScore: number; strongMatches: number }) => void;
  requests: CapacityRequest[]; perspective: DemoPerspective; sessionOnly: false; setPerspective: (value: DemoPerspective) => void;
  create: (draft: RequestDraft) => Promise<CapacityRequest>; actOnRequest: (id: string, action: RequestAction, details?: string) => Promise<void>; sendMessage: (id: string, body: string) => Promise<void>; saveProposal: (id: string, proposal: ProposalDraft) => Promise<void>;
  savedIds: string[]; toggleSaved: (id: string) => Promise<void>; notifications: RealNotification[]; markRead: (ids: string[]) => Promise<void>;
};
const Context = createContext<RealContext | null>(null);
const unavailable = "Your business workspace is unavailable. Please sign in again.";
const clientOrThrow = () => { const client = getSupabaseBrowserClient(); if (!client) throw new Error("Real workspace is not configured."); return client; };
const availabilityStatus = (days: number) => days >= 30 ? "within_30_days" : days >= 14 ? "within_14_days" : days >= 7 ? "within_7_days" : "available_now";

export function RealWorkspaceProvider({ children }: { children: ReactNode }) {
  const { mode, user, business } = useDataMode();
  const identityKey = mode === "demo" ? "demo" : `${user?.id ?? "anonymous"}:${business?.id ?? "none"}`;
  return <RealWorkspaceState key={identityKey}>{children}</RealWorkspaceState>;
}

function RealWorkspaceState({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode, ready: identityReady, identityError, refreshIdentity, user, business } = useDataMode();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<Capacity[]>([]);
  const [managedListings, setManagedListings] = useState<CapacityListing[]>([]);
  const [demands, setDemands] = useState<SavedDemand[]>([]);
  const [requests, setRequests] = useState<CapacityRequest[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<RealNotification[]>([]);
  const [draft, setDraft] = useState<DemandRequirement>(createEmptyDemand);
  const [submittedDemand, setSubmittedDemand] = useState<DemandRequirement | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SelectedCapacityRequest | null>(null);
  const [activeDemandId, setActiveDemandId] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<DemoPerspective>("buyer");
  const [contextReady, setContextReady] = useState(false);
  const generation = useRef(0);
  const savedMutations = useRef(new Set<string>());
  const matchMutations = useRef(new Set<string>());
  const sessionKey = mode === "real" && user && business ? workspaceSessionKey(user.id, business.id) : null;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (sessionKey) {
        try {
          const restored = restoreWorkspaceSession(sessionStorage.getItem(sessionKey));
          setDraft(restored.draft); setSubmittedDemand(restored.submittedDemand); setSelectedRequest(restored.selectedRequest);
          setActiveDemandId(restored.activeDemandId); setPerspective(restored.perspective);
        } catch { /* Storage may be disabled; live data is unaffected. */ }
      }
      setContextReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionKey]);
  useEffect(() => {
    if (!contextReady || !sessionKey) return;
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ draft, submittedDemand, selectedRequest, activeDemandId, perspective })); }
    catch { /* Keep working in memory when browser storage is unavailable. */ }
  }, [contextReady, sessionKey, draft, submittedDemand, selectedRequest, activeDemandId, perspective]);
  useEffect(() => () => { generation.current += 1; }, []);

  const refresh = useCallback(async () => {
    if (mode !== "real" || !identityReady || !contextReady) return;
    const revision = ++generation.current;
    if (pathname === "/" || pathname === "/how-it-works" || pathname === "/login" || pathname === "/register") { setReady(true); return; }
    if (identityError) { setError(identityError); setReady(true); return; }
    const publicCatalog = pathname === "/discover" || pathname.startsWith("/capacity/");
    if (!publicCatalog && (!user || !business)) { setError(unavailable); setReady(true); return; }
    setError("");
    setReady(false);
    try {
      const client = clientOrThrow();
      if (publicCatalog) {
        const [catalogResponse, savedResponse] = await Promise.all([
          client.from("capacity_listings").select("*,businesses(*)").order("updated_at", { ascending: false }),
          user ? client.from("saved_providers").select("capacity_listing_id").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
        ]);
        if (revision !== generation.current) return;
        if (catalogResponse.error || savedResponse.error) throw new Error("load");
        setProviders(((catalogResponse.data || []) as unknown as ListingRow[]).map(listingToCapacity).filter((item): item is Capacity => item !== null));
        setSavedIds(((savedResponse.data || []) as { capacity_listing_id: string }[]).map((item) => item.capacity_listing_id));
        setReady(true);
        return;
      }
      const [listingResponse, demandResponse, requestResponse, savedResponse, notificationResponse] = await Promise.all([
        client.from("capacity_listings").select("*,businesses(*)").order("updated_at", { ascending: false }),
        business ? client.from("demands").select("*").eq("business_id", business.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
        business ? client.from("capacity_requests").select("*").or(`buyer_business_id.eq.${business.id},provider_business_id.eq.${business.id}`).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
        user ? client.from("saved_providers").select("capacity_listing_id").eq("user_id", user.id) : Promise.resolve({ data: [], error: null }),
        user ? client.from("notifications").select("id,title,description,link,is_read,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
      ]);
      if ([listingResponse, demandResponse, requestResponse, savedResponse, notificationResponse].some((response) => response.error)) throw new Error("load");
      const listings = (listingResponse.data || []) as unknown as ListingRow[];
      const loadedDemands = ((demandResponse.data || []) as unknown as DemandRow[]).map(demandToSaved).filter((item): item is SavedDemand => item !== null);
      const requestRows = (requestResponse.data || []) as unknown as RequestRow[];
      let mappedRequests: CapacityRequest[] = [];
      if (requestRows.length) {
        const ids = requestRows.map((item) => item.id);
        const businessIds = Array.from(new Set(requestRows.flatMap((item) => [item.buyer_business_id, item.provider_business_id])));
        const [businessResponse, messageResponse, proposalResponse, timelineResponse] = await Promise.all([
          client.from("businesses").select("id,name").in("id", businessIds),
          client.from("request_messages").select("*").in("request_id", ids).order("created_at"),
          client.from("request_proposals").select("*").in("request_id", ids).order("created_at"),
          client.from("request_timeline_events").select("*").in("request_id", ids).order("created_at"),
        ]);
        if ([businessResponse, messageResponse, proposalResponse, timelineResponse].some((response) => response.error)) throw new Error("load");
        const names = new Map(((businessResponse.data || []) as { id: string; name: string }[]).map((item) => [item.id, item.name]));
        mappedRequests = requestRows.map((row) => requestToView(row, names, (messageResponse.data || []) as MessageRow[], (proposalResponse.data || []) as ProposalRow[], (timelineResponse.data || []) as TimelineRow[])).filter((item): item is CapacityRequest => item !== null);
      }
      if (revision !== generation.current) return;
      setProviders(listings.map(listingToCapacity).filter((item): item is Capacity => item !== null));
      setManagedListings(listings.filter((item) => item.business_id === business?.id).map(listingToManaged).filter((item): item is CapacityListing => item !== null));
      setDemands(loadedDemands);
      setRequests(mappedRequests);
      setSavedIds(((savedResponse.data || []) as { capacity_listing_id: string }[]).map((item) => item.capacity_listing_id));
      setNotifications((notificationResponse.data || []) as RealNotification[]);
      // Selection is explicit. Never turn a new/duplicate demand into an edit of the first row.
      setActiveDemandId((current) => current && loadedDemands.some((item) => item.id === current) ? current : null);
    } catch { if (revision === generation.current) setError("Unable to load workspace data. Please try again."); }
    finally { if (revision === generation.current) setReady(true); }
  }, [mode, identityReady, contextReady, identityError, business, user, pathname]);
  const retryRefresh = useCallback(async () => {
    if (identityError) await refreshIdentity();
    else await refresh();
  }, [identityError, refreshIdentity, refresh]);
  useEffect(() => {
    if (mode !== "real") return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => { window.clearTimeout(timer); generation.current += 1; };
  }, [mode, refresh]);

  const listingPayload = useCallback((value: CapacityListingDraft) => {
    const validation = validateCapacityListing(value);
    if (Object.keys(validation).length) throw new Error(Object.values(validation)[0]);
    if (!business) throw new Error(unavailable);
    return { business_id: business.id, title: value.capability.trim(), category: value.category, description: value.description.trim(), location_city: value.location,
      location_province: business.city === value.location ? "" : "Indonesia", total_capacity: value.maximumCapacity, available_capacity: value.availableCapacity,
      capacity_unit: value.capacityUnit, minimum_order: value.minimumOrder, lead_time_days: value.leadTimeDays,
      estimated_price_min: value.priceFrom, estimated_price_max: value.priceTo, pricing_unit: value.capacityUnit,
      availability_status: availabilityStatus(value.availabilityDays), listing_status: value.status,
      supported_materials: value.materials, machines_facilities: value.facilities, certifications: value.certifications };
  }, [business]);
  const createListing = useCallback(async (value: CapacityListingDraft) => {
    const { data, error: dbError } = await clientOrThrow().from("capacity_listings").insert(listingPayload(value)).select("id").single();
    if (dbError || !data) throw new Error("Unable to publish capacity. Please try again.");
    await refresh(); return data.id as string;
  }, [listingPayload, refresh]);
  const updateListing = useCallback(async (id: string, value: CapacityListingDraft) => {
    const { data, error: dbError } = await clientOrThrow().from("capacity_listings").update(listingPayload(value)).eq("id", id).eq("business_id", business?.id || "").select("id").maybeSingle();
    if (dbError || !data) throw new Error("Unable to update this capacity listing.");
    await refresh();
  }, [listingPayload, business, refresh]);
  const setListingStatus = useCallback(async (id: string, status: ListingStatus) => {
    const listing = managedListings.find((item) => item.id === id);
    if (!listing) throw new Error("This listing is not in your business workspace.");
    await updateListing(id, { ...listing, status, availableCapacity: status === "fully_booked" ? 0 : listing.availableCapacity });
  }, [managedListings, updateListing]);

  const saveDraft = useCallback((value: DemandRequirement) => setDraft(value), []);
  const submitDemand = useCallback(async (value: DemandRequirement) => {
    if (!business) throw new Error(unavailable);
    const validation = validateDemand(value);
    if (Object.keys(validation).length) throw new Error(Object.values(validation)[0]);
    const payload = { business_id: business.id, title: value.capability || "Production demand", category: value.category, capability: value.capability,
      description: value.description, quantity: value.quantity, unit: value.unit, demand_type: value.demandType, monthly_quantity: value.monthlyQuantity,
      expected_duration_months: value.durationMonths, preferred_location: value.location, maximum_distance: value.maxDistanceKm,
      required_completion_date: value.completionDate || null, preferred_lead_time_days: value.maxLeadTimeDays, urgency: value.urgency,
      budget_min: value.budgetMin, budget_max: value.budgetMax, budget_flexible: value.budgetFlexible, materials: value.materials,
      required_certifications: value.certifications, quality_requirements: value.qualityRequirements, technical_notes: value.technicalNotes, status: "open" };
    const query = activeDemandId && demands.some((item) => item.id === activeDemandId) ? clientOrThrow().from("demands").update(payload).eq("id", activeDemandId).eq("business_id", business.id) : clientOrThrow().from("demands").insert(payload);
    const { data, error: dbError } = await query.select("id").single();
    if (dbError || !data) throw new Error("Unable to save this demand. Please try again.");
    setActiveDemandId(data.id as string); setDraft(value); setSubmittedDemand(value); setSelectedRequest(null); await refresh();
  }, [business, activeDemandId, demands, refresh]);
  const selectRequest = useCallback((providerId: string, demand: DemandRequirement, matchContext?: SelectedCapacityRequest["matchContext"]) => setSelectedRequest({ providerId, demand, matchContext, createdAt: new Date().toISOString() }), []);
  const newDemand = useCallback(() => { setActiveDemandId(null); setDraft(createEmptyDemand()); setSubmittedDemand(null); setSelectedRequest(null); }, []);
  const editDemand = useCallback((id: string) => { const found = demands.find((item) => item.id === id); if (found) { setActiveDemandId(id); setDraft(found.requirement); setSelectedRequest(null); } }, [demands]);
  const viewDemandMatches = useCallback((id: string) => { const found = demands.find((item) => item.id === id); if (found) { setActiveDemandId(id); setDraft(found.requirement); setSubmittedDemand(found.requirement); setSelectedRequest(null); } }, [demands]);
  const duplicateDemand = useCallback(async (id: string) => { const found = demands.find((item) => item.id === id); if (!found) return undefined; setActiveDemandId(null); setDraft(found.requirement); setSubmittedDemand(null); setSelectedRequest(null); return undefined; }, [demands]);
  const closeDemand = useCallback(async (id: string) => { const { data, error: dbError } = await clientOrThrow().from("demands").update({ status: "closed" }).eq("id", id).eq("business_id", business?.id || "").select("id").maybeSingle(); if (dbError || !data) throw new Error("Unable to close this demand."); await refresh(); }, [business, refresh]);
  const recordMatches = useCallback((summary: { evaluated: number; bestScore: number; strongMatches: number }) => {
    const demand = demands.find((item) => item.id === activeDemandId);
    if (!business || !demand || ["closed", "fulfilled"].includes(demand.status) || matchMutations.current.has(demand.id)) return;
    if (demand.matchHistory && demand.matchHistory.evaluated === summary.evaluated && demand.matchHistory.bestScore === summary.bestScore && demand.matchHistory.strongMatches === summary.strongMatches) return;
    const history = { ...summary, updatedAt: new Date().toISOString() };
    matchMutations.current.add(demand.id);
    void (async () => {
      try {
        const { data, error: dbError } = await clientOrThrow().from("demands").update({ match_history: history }).eq("id", demand.id).eq("business_id", business.id).select("id").maybeSingle();
        if (dbError || !data) throw new Error("history");
        setDemands((current) => current.map((item) => item.id === demand.id ? { ...item, matchHistory: history } : item));
      } catch { setError("Unable to save match history. Please try again."); }
      finally { matchMutations.current.delete(demand.id); }
    })();
  }, [business, activeDemandId, demands]);

  const create = useCallback(async (value: RequestDraft): Promise<CapacityRequest> => {
    if (!business) throw new Error(unavailable);
    const validation = validateRequestDraft(value, undefined, providers);
    if (Object.keys(validation).length) throw new Error(Object.values(validation)[0]);
    const provider = providers.find((item) => item.id === value.providerId);
    if (!provider?.companyId || provider.companyId === business.id) throw new Error("Choose a capacity listing from another business.");
    const { data, error: dbError } = await clientOrThrow().from("capacity_requests").insert({
      buyer_business_id: business.id, provider_business_id: provider.companyId, capacity_listing_id: provider.id,
      demand_id: selectedRequest && activeDemandId && demands.some((item) => item.id === activeDemandId) ? activeDemandId : null,
      requested_capability: value.capability, category: value.category, quantity: value.quantity, unit: value.unit, production_location: value.location,
      preferred_start_date: value.preferredStartDate || null, required_completion_date: value.requiredCompletionDate || null,
      preferred_lead_time_days: value.preferredLeadTimeDays, urgency: value.urgency, budget: value.budget,
      budget_flexibility: value.budgetFlexibility, material: value.materials.join(", "), materials: value.materials,
      product_description: value.description, technical_specifications: value.technicalRequirements, quality_requirements: value.qualityRequirements,
      certifications_required: value.certifications, additional_notes: value.additionalNotes, attachment_references: value.attachments,
      message: value.message, demand_type: value.demandType, duration_months: value.durationMonths, match_context: value.matchContext ?? null,
    }).select("public_id").single();
    if (dbError || !data) throw new Error("Unable to submit this request. Please try again.");
    setPerspective("buyer"); await refresh();
    const created = requests.find((item) => item.id === data.public_id);
    return created ?? { ...value, quantity: value.quantity || 0, id: data.public_id as string, status: "pending_review", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [], timeline: [], proposal: null, buyerBusinessId: business.id, providerBusinessId: provider.companyId };
  }, [business, providers, selectedRequest, activeDemandId, demands, refresh, requests]);
  const actOnRequest = useCallback(async (id: string, action: RequestAction, details = "") => {
    const { error: dbError } = await clientOrThrow().rpc("apply_request_action", { target_public_id: id, requested_action: action, action_details: details });
    if (dbError) throw new Error("Unable to update this request. Check its current status and try again.");
    await refresh();
  }, [refresh]);
  const sendMessage = useCallback(async (id: string, body: string) => {
    const request = requests.find((item) => item.id === id);
    if (!request || !business || !user || !body.trim()) throw new Error("Unable to send this message.");
    const { data: row } = await clientOrThrow().from("capacity_requests").select("id").eq("public_id", id).single();
    if (!row) throw new Error("Request unavailable.");
    const { error: dbError } = await clientOrThrow().from("request_messages").insert({ request_id: row.id, sender_user_id: user.id, sender_business_id: business.id, message: body.trim() });
    if (dbError) throw new Error("Unable to send this message.");
    await refresh();
  }, [requests, business, user, refresh]);
  const saveProposal = useCallback(async (id: string, value: ProposalDraft) => {
    const validation = validateProposal(value);
    if (Object.keys(validation).length) throw new Error(Object.values(validation)[0]);
    const { error: dbError } = await clientOrThrow().rpc("send_request_proposal", { target_public_id: id, proposed_quantity: value.quantity, proposed_unit_price: value.unitPrice,
      proposed_start: value.startDate, proposed_completion: value.completionDate, proposed_lead_days: value.leadTimeDays, proposed_notes: value.notes });
    if (dbError) throw new Error("Unable to send this proposal. Please review the terms and try again.");
    await refresh();
  }, [refresh]);
  const toggleSaved = useCallback(async (id: string) => {
    if (!user) throw new Error(unavailable);
    if (savedMutations.current.has(id)) return;
    savedMutations.current.add(id);
    const wasSaved = savedIds.includes(id);
    setSavedIds((current) => wasSaved ? current.filter((item) => item !== id) : [...current, id]);
    try {
      const { error: dbError } = wasSaved ? await clientOrThrow().from("saved_providers").delete().eq("user_id", user.id).eq("capacity_listing_id", id)
        : await clientOrThrow().from("saved_providers").upsert({ user_id: user.id, capacity_listing_id: id }, { onConflict: "user_id,capacity_listing_id", ignoreDuplicates: true });
      if (dbError) throw new Error("saved");
    } catch {
      setSavedIds((current) => wasSaved ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id));
      throw new Error("Unable to update saved providers.");
    } finally { savedMutations.current.delete(id); }
  }, [user, savedIds]);
  const markRead = useCallback(async (ids: string[]) => {
    if (!user || !ids.length) return;
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, is_read: true } : item));
    const { error: dbError } = await clientOrThrow().from("notifications").update({ is_read: true }).in("id", ids).eq("user_id", user.id);
    if (dbError) await refresh();
  }, [user, refresh]);
  const value = useMemo<RealContext>(() => ({ ready, error, refresh: retryRefresh, providers, managedListings, createListing, updateListing, setListingStatus,
    draft, submittedDemand, selectedRequest, demands, activeDemandId, saveDraft, submitDemand, selectRequest, newDemand, editDemand, viewDemandMatches, duplicateDemand, closeDemand, recordMatches,
    requests, perspective, sessionOnly: false, setPerspective, create, actOnRequest, sendMessage, saveProposal, savedIds, toggleSaved, notifications, markRead }),
  [ready,error,retryRefresh,providers,managedListings,createListing,updateListing,setListingStatus,draft,submittedDemand,selectedRequest,demands,activeDemandId,saveDraft,submitDemand,selectRequest,newDemand,editDemand,viewDemandMatches,duplicateDemand,closeDemand,recordMatches,requests,perspective,create,actOnRequest,sendMessage,saveProposal,savedIds,toggleSaved,notifications,markRead]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useRealWorkspace() { const value = useContext(Context); if (!value) throw new Error("Real data provider is missing."); return value; }
