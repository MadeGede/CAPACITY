-- Complete the existing demand -> match-history integration without storing match results.
-- Ownership continues to use the Phase 7 demands RLS policies.
alter table public.demands add column match_history jsonb;
alter table public.demands add constraint demands_valid_match_history check (
  match_history is null or (
    jsonb_typeof(match_history) = 'object'
    and match_history ?& array['evaluated','bestScore','strongMatches','updatedAt']
    and jsonb_typeof(match_history->'evaluated') = 'number'
    and jsonb_typeof(match_history->'bestScore') = 'number'
    and jsonb_typeof(match_history->'strongMatches') = 'number'
    and jsonb_typeof(match_history->'updatedAt') = 'string'
    and (match_history->>'evaluated')::numeric >= 0
    and (match_history->>'bestScore')::numeric between 0 and 100
    and (match_history->>'strongMatches')::numeric between 0 and (match_history->>'evaluated')::numeric
  )
);

-- Reject new requests for zero-available listings even when their status was not updated.
alter policy request_insert on public.capacity_requests with check (
  private.is_business_member(buyer_business_id) and status='pending_review' and
  exists(select 1 from public.capacity_listings l where l.id=capacity_listing_id and l.business_id=provider_business_id and l.listing_status in ('active','limited') and l.available_capacity > 0) and
  (demand_id is null or exists(select 1 from public.demands d where d.id=demand_id and d.business_id=buyer_business_id))
);

-- Match the shared lifecycle rules: a revision cannot be bypassed by accepting original terms.
-- Treat null rejection/revision notes as empty, rather than bypassing the required reason.
create or replace function private.perform_request_action(target_public_id text, requested_action text, action_details text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare r public.capacity_requests%rowtype; next_status text; event_title text; recipient uuid; p public.request_proposals%rowtype;
begin
  select * into r from public.capacity_requests where public_id=target_public_id for update;
  if not found then raise exception 'Request unavailable'; end if;
  if requested_action in ('start_review','start_negotiation','accept_request','reject_request','complete') then
    if not private.is_business_member(r.provider_business_id) then raise exception 'Not authorized'; end if;
    recipient := r.buyer_business_id;
  elsif requested_action in ('accept_proposal','request_revision','cancel') then
    if not private.is_business_member(r.buyer_business_id) then raise exception 'Not authorized'; end if;
    recipient := r.provider_business_id;
  elsif requested_action='start_collaboration' then
    if not private.is_business_member(r.buyer_business_id) and not private.is_business_member(r.provider_business_id) then raise exception 'Not authorized'; end if;
    recipient := case when private.is_business_member(r.buyer_business_id) then r.provider_business_id else r.buyer_business_id end;
  else raise exception 'Invalid action'; end if;
  case requested_action
    when 'start_review' then
      if r.status <> 'pending_review' then raise exception 'Invalid transition'; end if;
      next_status := 'provider_reviewing'; event_title := 'Provider Reviewing';
    when 'start_negotiation' then
      if r.status not in ('pending_review','provider_reviewing') then raise exception 'Invalid transition'; end if;
      next_status := 'negotiation'; event_title := 'Negotiation Started';
    when 'accept_request' then
      if r.status not in ('pending_review','provider_reviewing','negotiation') or exists(select 1 from public.request_proposals where request_id=r.id and status <> 'withdrawn') then raise exception 'Invalid transition'; end if;
      next_status := 'accepted'; event_title := 'Request Accepted';
    when 'accept_proposal' then
      select * into p from public.request_proposals where request_id=r.id and status='pending' order by created_at desc limit 1 for update;
      if r.status <> 'negotiation' or p.id is null then raise exception 'No proposal to accept'; end if;
      update public.request_proposals set status='accepted' where id=p.id;
      next_status := 'accepted'; event_title := 'Proposal Accepted';
    when 'request_revision' then
      select * into p from public.request_proposals where request_id=r.id and status='pending' order by created_at desc limit 1 for update;
      if r.status <> 'negotiation' or p.id is null or length(trim(coalesce(action_details,'')))=0 then raise exception 'Invalid revision'; end if;
      update public.request_proposals set status='revision_requested' where id=p.id;
      next_status := 'negotiation'; event_title := 'Revision Requested';
      update public.capacity_requests set revision_notes=left(action_details,2000) where id=r.id;
      insert into public.request_messages(request_id,sender_user_id,sender_business_id,message)
      values(r.id,auth.uid(),r.buyer_business_id,left(trim(action_details),10000));
    when 'start_collaboration' then
      if r.status <> 'accepted' then raise exception 'Invalid transition'; end if;
      next_status := 'in_progress'; event_title := 'Production Started';
    when 'complete' then
      if r.status <> 'in_progress' then raise exception 'Invalid transition'; end if;
      next_status := 'completed'; event_title := 'Production Completed';
    when 'reject_request' then
      if r.status not in ('pending_review','provider_reviewing','negotiation') or length(trim(coalesce(action_details,'')))=0 then raise exception 'Invalid rejection'; end if;
      next_status := 'rejected'; event_title := 'Request Rejected';
      update public.capacity_requests set rejection_reason=left(action_details,2000) where id=r.id;
    when 'cancel' then
      if r.status not in ('pending_review','provider_reviewing','negotiation','accepted') then raise exception 'Invalid cancellation'; end if;
      next_status := 'cancelled'; event_title := 'Request Cancelled';
  end case;
  update public.capacity_requests set status=next_status where id=r.id;
  insert into public.request_timeline_events(request_id,event_type,title,description,created_by)
  values(r.id,requested_action,event_title,left(coalesce(action_details,''),2000),auth.uid());
  perform private.notify_business(recipient,requested_action,event_title,r.requested_capability,'/requests/'||r.public_id);
end $$;
