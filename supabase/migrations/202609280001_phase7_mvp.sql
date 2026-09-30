-- CAPACITY Phase 7. Apply once to a new Supabase project with the SQL editor or CLI.
create extension if not exists pgcrypto;
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text not null default '', avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.businesses (
  id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) between 2 and 160),
  slug text not null unique, description text not null default '', business_type text not null default '',
  primary_industry text not null default '', location_city text not null default '', location_province text not null default '',
  location_country text not null default 'Indonesia', verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified')),
  years_operating int not null default 0 check (years_operating >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_members (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(), unique (business_id,user_id)
);
create table public.capacity_listings (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null, category text not null, description text not null default '',
  location_city text not null, location_province text not null default '',
  total_capacity numeric(16,2) not null check (total_capacity > 0),
  available_capacity numeric(16,2) not null check (available_capacity >= 0 and available_capacity <= total_capacity),
  capacity_unit text not null, minimum_order numeric(16,2) not null default 0 check (minimum_order >= 0 and minimum_order <= total_capacity),
  lead_time_days int not null check (lead_time_days >= 0),
  estimated_price_min numeric(16,2) not null default 0 check (estimated_price_min >= 0),
  estimated_price_max numeric(16,2) not null default 0 check (estimated_price_max >= estimated_price_min),
  pricing_unit text not null default 'unit',
  availability_status text not null default 'available_now' check (availability_status in ('available_now','within_7_days','within_14_days','within_30_days','unavailable')),
  listing_status text not null default 'active' check (listing_status in ('active','limited','paused','fully_booked')),
  supported_materials text[] not null default '{}', machines_facilities text[] not null default '{}', certifications text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.demands (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null, category text not null, capability text not null default '', description text not null default '',
  quantity numeric(16,2), unit text not null default 'units', demand_type text not null default 'one-time' check (demand_type in ('one-time','recurring')),
  monthly_quantity numeric(16,2), expected_duration_months int, preferred_location text not null default 'any',
  maximum_distance numeric(12,2), required_completion_date date, preferred_lead_time_days int,
  urgency text not null default 'standard' check (urgency in ('standard','priority','urgent')),
  budget_min numeric(16,2), budget_max numeric(16,2), budget_flexible boolean not null default false,
  materials text[] not null default '{}', required_certifications text[] not null default '{}',
  quality_requirements text not null default '', technical_notes text not null default '',
  status text not null default 'draft' check (status in ('draft','matching','open','fulfilled','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (quantity is null or quantity > 0), check (monthly_quantity is null or monthly_quantity > 0),
  check (expected_duration_months is null or expected_duration_months >= 1),
  check (maximum_distance is null or maximum_distance >= 0), check (preferred_lead_time_days is null or preferred_lead_time_days >= 0),
  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_max >= coalesce(budget_min,0))
);
create table public.saved_providers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  capacity_listing_id uuid not null references public.capacity_listings(id) on delete cascade,
  created_at timestamptz not null default now(), unique (user_id,capacity_listing_id)
);
create sequence public.capacity_request_number_seq;
create table public.capacity_requests (
  id uuid primary key default gen_random_uuid(), public_id text not null unique,
  buyer_business_id uuid not null references public.businesses(id), provider_business_id uuid not null references public.businesses(id),
  capacity_listing_id uuid not null references public.capacity_listings(id), demand_id uuid references public.demands(id),
  requested_capability text not null, category text not null default '', quantity numeric(16,2) not null check (quantity > 0),
  unit text not null, production_location text not null default 'any', preferred_start_date date, required_completion_date date, preferred_lead_time_days int,
  urgency text not null default 'standard', budget numeric(16,2), budget_flexibility text not null default 'flexible',
  material text not null default '', materials text[] not null default '{}', product_description text not null default '',
  technical_specifications text not null default '', quality_requirements text not null default '', certifications_required text[] not null default '{}',
  additional_notes text not null default '', attachment_references jsonb not null default '[]', message text not null default '',
  demand_type text not null default 'one-time', duration_months int, match_context jsonb,
  rejection_reason text, revision_notes text,
  status text not null default 'pending_review' check (status in ('pending_review','provider_reviewing','negotiation','accepted','rejected','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (buyer_business_id <> provider_business_id), check (budget is null or budget >= 0),
  check (preferred_lead_time_days is null or preferred_lead_time_days >= 0),
  check (duration_months is null or duration_months >= 1)
);
create table public.request_messages (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.capacity_requests(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id), sender_business_id uuid not null references public.businesses(id),
  message text not null check (length(trim(message)) between 1 and 10000), created_at timestamptz not null default now()
);
create table public.request_proposals (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.capacity_requests(id) on delete cascade,
  provider_business_id uuid not null references public.businesses(id), quantity numeric(16,2) not null check (quantity > 0),
  unit text not null, unit_price numeric(16,2) not null check (unit_price >= 0),
  estimated_total numeric(18,2) generated always as (quantity * unit_price) stored,
  production_start_date date not null, estimated_completion_date date not null, lead_time_days int not null check (lead_time_days >= 0),
  provider_notes text not null default '', status text not null default 'pending' check (status in ('pending','accepted','revision_requested','withdrawn')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (estimated_completion_date >= production_start_date)
);
create table public.request_timeline_events (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.capacity_requests(id) on delete cascade,
  event_type text not null, title text not null, description text not null default '', created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id), type text not null, title text not null,
  description text not null default '', link text not null default '', is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.business_members(user_id);
create index on public.capacity_listings(business_id);
create index on public.capacity_listings(category,listing_status);
create index on public.capacity_listings(location_city);
create index on public.demands(business_id,status);
create index on public.saved_providers(user_id);
create index on public.capacity_requests(buyer_business_id,status);
create index on public.capacity_requests(provider_business_id,status);
create index on public.capacity_requests(capacity_listing_id);
create index on public.request_messages(request_id,created_at);
create index on public.request_proposals(request_id,created_at desc);
create index on public.request_timeline_events(request_id,created_at);
create index on public.notifications(user_id,is_read,created_at desc);

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger businesses_updated before update on public.businesses for each row execute function private.touch_updated_at();
create trigger listings_updated before update on public.capacity_listings for each row execute function private.touch_updated_at();
create trigger demands_updated before update on public.demands for each row execute function private.touch_updated_at();
create trigger requests_updated before update on public.capacity_requests for each row execute function private.touch_updated_at();
create trigger proposals_updated before update on public.request_proposals for each row execute function private.touch_updated_at();

-- Registration is atomic. The browser cannot choose a business_id or grant itself membership.
create function private.register_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare new_business_id uuid; business_name text; full_name text;
begin
  full_name := left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),160);
  business_name := left(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'),''),full_name || ' Business'),160);
  insert into public.profiles(id,full_name,email) values(new.id,full_name,coalesce(new.email,''));
  insert into public.businesses(name,slug,business_type,location_city)
  values(business_name, lower(regexp_replace(business_name,'[^a-zA-Z0-9]+','-','g')) || '-' || left(new.id::text,8),
    left(coalesce(new.raw_user_meta_data->>'business_type',''),120),left(coalesce(new.raw_user_meta_data->>'city',''),120))
  returning id into new_business_id;
  insert into public.business_members(business_id,user_id,role) values(new_business_id,new.id,'owner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.register_new_user();

create function private.is_business_member(target_business uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select target_user is not null and exists(select 1 from public.business_members where business_id = target_business and user_id = target_user)
$$;
create function private.is_request_party(target_request uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.capacity_requests r where r.id = target_request
    and (private.is_business_member(r.buyer_business_id,target_user) or private.is_business_member(r.provider_business_id,target_user)))
$$;
create function private.is_public_listing(target_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.capacity_listings where id=target_listing and listing_status in ('active','limited'))
$$;
create function private.can_view_listing(target_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.capacity_requests r where r.capacity_listing_id=target_listing and private.is_request_party(r.id))
$$;
create function private.can_view_business(target_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_business_member(target_business)
    or exists(select 1 from public.capacity_listings l where l.business_id=target_business and l.listing_status in ('active','limited'))
    or exists(select 1 from public.capacity_requests r where (r.buyer_business_id=target_business or r.provider_business_id=target_business) and private.is_request_party(r.id))
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.capacity_listings enable row level security;
alter table public.demands enable row level security;
alter table public.saved_providers enable row level security;
alter table public.capacity_requests enable row level security;
alter table public.request_messages enable row level security;
alter table public.request_proposals enable row level security;
alter table public.request_timeline_events enable row level security;
alter table public.notifications enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.businesses,public.capacity_listings to anon,authenticated;
grant select on public.profiles,public.business_members,public.demands,public.saved_providers,public.capacity_requests,
  public.request_messages,public.request_proposals,public.request_timeline_events,public.notifications to authenticated;
grant update(full_name,avatar_url) on public.profiles to authenticated;
grant update(name,description,business_type,primary_industry,location_city,location_province,years_operating) on public.businesses to authenticated;
grant insert,update,delete on public.capacity_listings,public.demands,public.saved_providers to authenticated;
grant insert on public.capacity_requests,public.request_messages to authenticated;
grant update(is_read) on public.notifications to authenticated;

create policy profile_self_read on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profile_self_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy business_visible on public.businesses for select to anon,authenticated using (private.can_view_business(id));
create policy business_owner_update on public.businesses for update to authenticated using (
  exists(select 1 from public.business_members m where m.business_id=id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))
) with check (private.is_business_member(id));
create policy own_memberships on public.business_members for select to authenticated using (private.is_business_member(business_id));
create policy listing_read on public.capacity_listings for select to anon,authenticated using (
  listing_status in ('active','limited') or private.is_business_member(business_id) or private.can_view_listing(id)
);
create policy listing_insert on public.capacity_listings for insert to authenticated with check (private.is_business_member(business_id));
create policy listing_update on public.capacity_listings for update to authenticated using (private.is_business_member(business_id)) with check (private.is_business_member(business_id));
create policy listing_delete on public.capacity_listings for delete to authenticated using (private.is_business_member(business_id));
create policy demand_read on public.demands for select to authenticated using (private.is_business_member(business_id));
create policy demand_insert on public.demands for insert to authenticated with check (private.is_business_member(business_id));
create policy demand_update on public.demands for update to authenticated using (private.is_business_member(business_id)) with check (private.is_business_member(business_id));
create policy demand_delete on public.demands for delete to authenticated using (private.is_business_member(business_id));
create policy saved_read on public.saved_providers for select to authenticated using (user_id=(select auth.uid()));
create policy saved_insert on public.saved_providers for insert to authenticated with check (user_id=(select auth.uid()) and private.is_public_listing(capacity_listing_id));
create policy saved_delete on public.saved_providers for delete to authenticated using (user_id=(select auth.uid()));
create policy request_read on public.capacity_requests for select to authenticated using (
  private.is_business_member(buyer_business_id) or private.is_business_member(provider_business_id)
);
create policy request_insert on public.capacity_requests for insert to authenticated with check (
  private.is_business_member(buyer_business_id) and status='pending_review' and
  exists(select 1 from public.capacity_listings l where l.id=capacity_listing_id and l.business_id=provider_business_id and l.listing_status in ('active','limited')) and
  (demand_id is null or exists(select 1 from public.demands d where d.id=demand_id and d.business_id=buyer_business_id))
);
create policy message_read on public.request_messages for select to authenticated using (private.is_request_party(request_id));
create policy message_insert on public.request_messages for insert to authenticated with check (
  sender_user_id=(select auth.uid()) and private.is_business_member(sender_business_id) and
  exists(select 1 from public.capacity_requests r where r.id=request_id and sender_business_id in (r.buyer_business_id,r.provider_business_id) and r.status not in ('cancelled','rejected','completed'))
);
create policy proposal_read on public.request_proposals for select to authenticated using (private.is_request_party(request_id));
create policy timeline_read on public.request_timeline_events for select to authenticated using (private.is_request_party(request_id));
create policy notification_read on public.notifications for select to authenticated using (user_id=(select auth.uid()));
create policy notification_update on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create function private.assign_public_request_id() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.public_id := 'REQ-' || extract(year from now())::int || '-' || lpad(nextval('public.capacity_request_number_seq')::text,5,'0');
  return new;
end $$;
create trigger request_public_id before insert on public.capacity_requests for each row execute function private.assign_public_request_id();
create function private.notify_business(target_business uuid, event_type text, event_title text, event_description text, event_link text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id,business_id,type,title,description,link)
  select user_id,target_business,event_type,event_title,event_description,event_link from public.business_members where business_id=target_business;
end $$;
create function private.on_request_insert() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if length(trim(new.message)) > 0 then
    insert into public.request_messages(request_id,sender_user_id,sender_business_id,message)
    values(new.id,auth.uid(),new.buyer_business_id,left(trim(new.message),10000));
  end if;
  insert into public.request_timeline_events(request_id,event_type,title,description,created_by)
  values(new.id,'request_submitted','Request Submitted','A new capacity request was submitted.',auth.uid());
  perform private.notify_business(new.provider_business_id,'new_request','New capacity request',new.requested_capability,'/requests/'||new.public_id);
  return new;
end $$;
create trigger request_inserted after insert on public.capacity_requests for each row execute function private.on_request_insert();

-- Public RPCs are invoker wrappers; privileged transaction logic remains outside the exposed schema.
create function private.perform_request_action(target_public_id text, requested_action text, action_details text default '')
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
      if r.status not in ('pending_review','provider_reviewing','negotiation') or exists(select 1 from public.request_proposals where request_id=r.id and status='pending') then raise exception 'Invalid transition'; end if;
      next_status := 'accepted'; event_title := 'Request Accepted';
    when 'accept_proposal' then
      select * into p from public.request_proposals where request_id=r.id and status='pending' order by created_at desc limit 1 for update;
      if r.status <> 'negotiation' or p.id is null then raise exception 'No proposal to accept'; end if;
      update public.request_proposals set status='accepted' where id=p.id;
      next_status := 'accepted'; event_title := 'Proposal Accepted';
    when 'request_revision' then
      select * into p from public.request_proposals where request_id=r.id and status='pending' order by created_at desc limit 1 for update;
      if r.status <> 'negotiation' or p.id is null or length(trim(action_details))=0 then raise exception 'Invalid revision'; end if;
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
      if r.status not in ('pending_review','provider_reviewing','negotiation') or length(trim(action_details))=0 then raise exception 'Invalid rejection'; end if;
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
create function public.apply_request_action(target_public_id text, requested_action text, action_details text default '')
returns void language sql security invoker set search_path = '' as $$
  select private.perform_request_action(target_public_id,requested_action,action_details)
$$;
create function private.create_request_proposal(target_public_id text, proposed_quantity numeric, proposed_unit_price numeric,
  proposed_start date, proposed_completion date, proposed_lead_days int, proposed_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.capacity_requests%rowtype; proposal_id uuid;
begin
  select * into r from public.capacity_requests where public_id=target_public_id for update;
  if not found or not private.is_business_member(r.provider_business_id) or r.status <> 'negotiation' then raise exception 'Not authorized'; end if;
  if proposed_quantity <= 0 or proposed_unit_price < 0 or proposed_lead_days < 0 or proposed_completion < proposed_start then raise exception 'Invalid proposal'; end if;
  update public.request_proposals set status='withdrawn' where request_id=r.id and status='pending';
  insert into public.request_proposals(request_id,provider_business_id,quantity,unit,unit_price,production_start_date,estimated_completion_date,lead_time_days,provider_notes)
  values(r.id,r.provider_business_id,proposed_quantity,r.unit,proposed_unit_price,proposed_start,proposed_completion,proposed_lead_days,left(coalesce(proposed_notes,''),5000))
  returning id into proposal_id;
  insert into public.request_timeline_events(request_id,event_type,title,description,created_by)
  values(r.id,'proposal_sent','Proposal Sent','Provider sent production terms.',auth.uid());
  perform private.notify_business(r.buyer_business_id,'proposal_sent','New provider proposal',r.requested_capability,'/requests/'||r.public_id);
  return proposal_id;
end $$;
create function public.send_request_proposal(target_public_id text, proposed_quantity numeric, proposed_unit_price numeric,
  proposed_start date, proposed_completion date, proposed_lead_days int, proposed_notes text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.create_request_proposal(target_public_id,proposed_quantity,proposed_unit_price,proposed_start,proposed_completion,proposed_lead_days,proposed_notes)
$$;
revoke all on function public.apply_request_action(text,text,text), public.send_request_proposal(text,numeric,numeric,date,date,int,text) from public,anon;
revoke all on all functions in schema private from public,anon,authenticated;
grant usage on schema private to anon,authenticated,supabase_auth_admin;
grant execute on function private.is_business_member(uuid,uuid), private.is_request_party(uuid,uuid),
  private.is_public_listing(uuid), private.can_view_listing(uuid), private.can_view_business(uuid) to anon,authenticated;
grant execute on function private.touch_updated_at(), private.assign_public_request_id(), private.on_request_insert() to authenticated;
grant execute on function private.register_new_user() to supabase_auth_admin;
grant execute on function private.perform_request_action(text,text,text), private.create_request_proposal(text,numeric,numeric,date,date,int,text) to authenticated;
grant execute on function public.apply_request_action(text,text,text), public.send_request_proposal(text,numeric,numeric,date,date,int,text) to authenticated;
