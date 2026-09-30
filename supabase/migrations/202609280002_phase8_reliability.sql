-- Additive safeguards for existing Phase 7 databases. Apply after 202609280001.
-- Review any existing zero-minimum listings or zero-price proposals before applying.
alter table public.capacity_listings
  add constraint capacity_listings_positive_minimum_order check (minimum_order > 0),
  add constraint capacity_listings_booked_availability check (listing_status <> 'fully_booked' or available_capacity = 0);

alter table public.demands
  add constraint demands_reasonable_lead_time check (preferred_lead_time_days is null or preferred_lead_time_days between 0 and 365),
  add constraint demands_reasonable_duration check (expected_duration_months is null or expected_duration_months between 1 and 60);

alter table public.capacity_requests
  add constraint requests_chronological_dates check (preferred_start_date is null or required_completion_date is null or required_completion_date >= preferred_start_date),
  add constraint requests_reasonable_lead_time check (preferred_lead_time_days is null or preferred_lead_time_days between 0 and 365);

alter table public.request_proposals
  add constraint proposals_positive_unit_price check (unit_price > 0),
  add constraint proposals_positive_lead_time check (lead_time_days between 1 and 365),
  add constraint proposals_chronological_dates check (estimated_completion_date > production_start_date),
  add constraint proposals_matching_dates check (estimated_completion_date - production_start_date = lead_time_days);

create unique index request_proposals_one_pending_per_request
  on public.request_proposals(request_id) where status = 'pending';

create or replace function private.create_request_proposal(target_public_id text, proposed_quantity numeric, proposed_unit_price numeric,
  proposed_start date, proposed_completion date, proposed_lead_days int, proposed_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.capacity_requests%rowtype; proposal_id uuid;
begin
  select * into r from public.capacity_requests where public_id=target_public_id for update;
  if not found or not private.is_business_member(r.provider_business_id) or r.status <> 'negotiation' then raise exception 'Not authorized'; end if;
  if proposed_quantity is null or proposed_quantity <= 0 or proposed_unit_price is null or proposed_unit_price <= 0
    or proposed_start is null or proposed_completion is null or proposed_lead_days is null
    or proposed_lead_days not between 1 and 365 or proposed_completion <= proposed_start
    or proposed_completion - proposed_start <> proposed_lead_days then raise exception 'Invalid proposal'; end if;
  -- A repeated identical submission (for example from two tabs) returns the first proposal.
  select id into proposal_id from public.request_proposals
  where request_id=r.id and status='pending' and quantity=proposed_quantity and unit_price=proposed_unit_price
    and production_start_date=proposed_start and estimated_completion_date=proposed_completion
    and lead_time_days=proposed_lead_days and provider_notes=left(coalesce(proposed_notes,''),5000);
  if proposal_id is not null then return proposal_id; end if;
  update public.request_proposals set status='withdrawn' where request_id=r.id and status='pending';
  insert into public.request_proposals(request_id,provider_business_id,quantity,unit,unit_price,production_start_date,estimated_completion_date,lead_time_days,provider_notes)
  values(r.id,r.provider_business_id,proposed_quantity,r.unit,proposed_unit_price,proposed_start,proposed_completion,proposed_lead_days,left(coalesce(proposed_notes,''),5000))
  returning id into proposal_id;
  insert into public.request_timeline_events(request_id,event_type,title,description,created_by)
  values(r.id,'proposal_sent','Proposal Sent','Provider sent production terms.',auth.uid());
  perform private.notify_business(r.buyer_business_id,'proposal_sent','New provider proposal',r.requested_capability,'/requests/'||r.public_id);
  return proposal_id;
end $$;
