-- Trip closeout. Existing financial records are preserved; closing is an explicit admin action.
create schema if not exists kenz_internal;
revoke all on schema kenz_internal from public, anon;
grant usage on schema kenz_internal to authenticated;

create table public.trip_closeouts (
 trip_id uuid primary key references public.trips(id),
 status text not null default 'review' check(status in ('review','closed')),
 round_no integer not null default 0,
 snapshot jsonb,
 closed_at timestamptz,
 closed_by uuid references public.members(id),
 reopened_at timestamptz,
 reopen_reason text
);
insert into public.trip_closeouts(trip_id) select id from public.trips on conflict do nothing;
alter table public.trip_closeouts enable row level security;
revoke all on public.trip_closeouts from anon,authenticated;
grant select on public.trip_closeouts to authenticated;
create policy closeout_read on public.trip_closeouts for select to authenticated
using (trip_id=(select trip_id from public.members where id=public.current_trip_member_id()));

create table public.trip_settlement_transfers (
 id uuid primary key default gen_random_uuid(),
 trip_id uuid not null references public.trips(id),
 round_no integer not null,
 from_member_id uuid not null references public.members(id),
 to_member_id uuid not null references public.members(id),
 amount numeric(14,2) not null check(amount>0),
 status text not null default 'pending' check(status in ('pending','sent','confirmed','void')),
 sent_at timestamptz, confirmed_at timestamptz,
 created_at timestamptz not null default now(),
 check(from_member_id<>to_member_id)
);
create index on public.trip_settlement_transfers(trip_id);
alter table public.trip_settlement_transfers enable row level security;
revoke all on public.trip_settlement_transfers from anon,authenticated;
grant select on public.trip_settlement_transfers to authenticated;
create policy transfers_read on public.trip_settlement_transfers for select to authenticated
using (trip_id=(select trip_id from public.members where id=public.current_trip_member_id()));

-- Internal calculation, never exposed through the Data API. All values are integer cents.
create function kenz_internal.closeout_snapshot(p_trip uuid) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare v_total bigint; v_alloc bigint; v_count integer; v_shared bigint; v_people jsonb;
begin
 select coalesce(round(sum(amount)*100),0)::bigint into v_total from public.expenses where trip_id=p_trip;
 select coalesce(sum(round(amount*100)),0)::bigint into v_alloc from public.trip_leftover_allocations where trip_id=p_trip;
 select count(*) into v_count from public.members where trip_id=p_trip and confirmed is distinct from false;
 if v_alloc>v_total then raise exception 'INVALID_LEFTOVER_TOTAL'; end if;
 v_shared:=v_total-v_alloc;
 with base as (
 select m.id,m.name,m.confirmed is distinct from false as included,m.sort_order,
 coalesce((select round(sum(e.amount)*100)::bigint from public.expenses e where e.trip_id=p_trip and e.payer_member_id=m.id),0) paid,
 coalesce((select sum(round(a.amount*100))::bigint from public.trip_leftover_allocations a where a.trip_id=p_trip and a.member_id=m.id),0) leftovers,
 coalesce((select sum(round(t.amount*100))::bigint from public.trip_settlement_transfers t where t.trip_id=p_trip and t.status='confirmed' and t.from_member_id=m.id),0) sent,
 coalesce((select sum(round(t.amount*100))::bigint from public.trip_settlement_transfers t where t.trip_id=p_trip and t.status='confirmed' and t.to_member_id=m.id),0) received
 from public.members m where m.trip_id=p_trip
 ), ranked as (select *,sum(included::int) over(order by sort_order nulls last,id) as participant_no from base),
 calc as(select *,case when included and v_count>0 then v_shared/v_count + case when participant_no<=v_shared%v_count then 1 else 0 end else 0 end as share from ranked)
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'included',included,'paid',paid,'leftovers',leftovers,'share',share,'sent',sent,'received',received,'net',paid+sent-received-share-leftovers) order by sort_order nulls last,id),'[]'::jsonb) into v_people from calc;
 return jsonb_build_object('total',v_total,'allocated',v_alloc,'shared',v_shared,'participants',v_count,'people',v_people);
end $$;
revoke all on function kenz_internal.closeout_snapshot(uuid) from public,anon,authenticated;

create function kenz_internal.closeout_dashboard() returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid; v_state public.trip_closeouts; v_live jsonb; v_pending integer; v_open integer; v_transfers jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 select * into v_state from public.trip_closeouts where trip_id=v_trip;
 v_live:=kenz_internal.closeout_snapshot(v_trip);
 select count(*) into v_pending from public.expense_approval_requests where trip_id=v_trip and status='pending';
 select count(*) into v_open from public.trip_leftover_items l where l.trip_id=v_trip and l.status='open' and l.remaining_qty>coalesce((select sum(a.qty) from public.trip_leftover_allocations a where a.leftover_item_id=l.id),0);
 select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) into v_transfers from public.trip_settlement_transfers t where t.trip_id=v_trip and t.status<>'void';
 return jsonb_build_object('status',coalesce(v_state.status,'review'),'round',coalesce(v_state.round_no,0),'closed_at',v_state.closed_at,'snapshot',v_state.snapshot,'live',v_live,'pending',v_pending,'open_leftovers',v_open,'transfers',v_transfers);
end $$;
revoke all on function kenz_internal.closeout_dashboard() from public,anon;
grant execute on function kenz_internal.closeout_dashboard() to authenticated;
create function public.trip_closeout_dashboard() returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.closeout_dashboard()$$;
revoke all on function public.trip_closeout_dashboard() from public,anon;
grant execute on function public.trip_closeout_dashboard() to authenticated;

create function kenz_internal.close_trip(p_reviewed boolean) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid; v_state public.trip_closeouts; v_data jsonb; v_people jsonb; i integer; j integer; v_n integer; v_debt bigint; v_credit bigint; v_amount bigint;
begin
 if auth.uid() is null or v_me is null or not public.is_trip_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 if p_reviewed is distinct from true then raise exception 'REVIEW_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 select * into v_state from public.trip_closeouts where trip_id=v_trip for update;
 if v_state.status='closed' then return kenz_internal.closeout_dashboard(); end if;
 v_data:=kenz_internal.closeout_dashboard();
 if (v_data->>'pending')::int>0 then raise exception 'PENDING_EXPENSES'; end if;
 if (v_data->>'open_leftovers')::int>0 then raise exception 'OPEN_LEFTOVERS'; end if;
 if (v_data->'live'->>'participants')::int=0 then raise exception 'NO_PARTICIPANTS'; end if;
 v_people:=v_data->'live'->'people'; v_n:=jsonb_array_length(v_people);
 if (select sum((x->>'net')::bigint) from jsonb_array_elements(v_people) x)<>0 then raise exception 'UNBALANCED_SETTLEMENT'; end if;
 update public.trip_closeouts set status='closed',round_no=round_no+1,snapshot=v_data->'live',closed_at=now(),closed_by=v_me where trip_id=v_trip;
 -- Greedy settlement, deterministic member order and exact cent conservation.
 for i in 0..v_n-1 loop
  v_debt:=-(v_people->i->>'net')::bigint;
  if v_debt<=0 then continue; end if;
  for j in 0..v_n-1 loop
   v_credit:=(v_people->j->>'net')::bigint;
   if v_credit<=0 then continue; end if;
   v_amount:=least(v_debt,v_credit);
   insert into public.trip_settlement_transfers(trip_id,round_no,from_member_id,to_member_id,amount)
    values(v_trip,v_state.round_no+1,(v_people->i->>'id')::uuid,(v_people->j->>'id')::uuid,v_amount/100.0);
   v_debt:=v_debt-v_amount;
   v_people:=jsonb_set(v_people,array[j::text,'net'],to_jsonb(v_credit-v_amount));
   exit when v_debt=0;
  end loop;
 end loop;
 return kenz_internal.closeout_dashboard();
end $$;
revoke all on function kenz_internal.close_trip(boolean) from public,anon;
grant execute on function kenz_internal.close_trip(boolean) to authenticated;
create function public.close_trip_accounts(p_reviewed boolean) returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.close_trip(p_reviewed)$$;
revoke all on function public.close_trip_accounts(boolean) from public,anon;
grant execute on function public.close_trip_accounts(boolean) to authenticated;

create function kenz_internal.reopen_trip(p_reason text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid;
begin
 if auth.uid() is null or v_me is null or not public.is_trip_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 if length(trim(coalesce(p_reason,'')))<3 then raise exception 'REASON_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 perform 1 from public.trip_closeouts where trip_id=v_trip for update;
 if exists(select 1 from public.trip_settlement_transfers where trip_id=v_trip and status='sent') then raise exception 'UNCONFIRMED_TRANSFERS'; end if;
 update public.trip_settlement_transfers set status='void' where trip_id=v_trip and status='pending';
 update public.trip_closeouts set status='review',reopened_at=now(),reopen_reason=trim(p_reason) where trip_id=v_trip;
 return kenz_internal.closeout_dashboard();
end $$;
revoke all on function kenz_internal.reopen_trip(text) from public,anon;
grant execute on function kenz_internal.reopen_trip(text) to authenticated;
create function public.reopen_trip_accounts(p_reason text) returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.reopen_trip(p_reason)$$;
revoke all on function public.reopen_trip_accounts(text) from public,anon;
grant execute on function public.reopen_trip_accounts(text) to authenticated;

create function kenz_internal.transfer_action(p_id uuid,p_action text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid; v_t public.trip_settlement_transfers;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 perform 1 from public.trip_closeouts where trip_id=v_trip and status='closed' for update;
 if not found then raise exception 'TRIP_NOT_CLOSED'; end if;
 select * into v_t from public.trip_settlement_transfers where id=p_id and trip_id=v_trip for update;
 if not found then raise exception 'TRANSFER_NOT_FOUND'; end if;
 if p_action='sent' and v_me=v_t.from_member_id and v_t.status='pending' then
 update public.trip_settlement_transfers set status='sent',sent_at=now() where id=p_id;
 elsif p_action='confirm' and v_me=v_t.to_member_id and v_t.status='sent' then
 update public.trip_settlement_transfers set status='confirmed',confirmed_at=now() where id=p_id;
 elsif p_action='not_received' and v_me=v_t.to_member_id and v_t.status='sent' then
 update public.trip_settlement_transfers set status='pending',sent_at=null where id=p_id;
 else raise exception 'INVALID_TRANSFER_ACTION'; end if;
 return kenz_internal.closeout_dashboard();
end $$;
revoke all on function kenz_internal.transfer_action(uuid,text) from public,anon;
grant execute on function kenz_internal.transfer_action(uuid,text) to authenticated;
create function public.trip_transfer_action(p_id uuid,p_action text) returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.transfer_action(p_id,p_action)$$;
revoke all on function public.trip_transfer_action(uuid,text) from public,anon;
grant execute on function public.trip_transfer_action(uuid,text) to authenticated;

-- Database enforcement: old clients cannot change finalized finance or participant shares.
create function kenz_internal.guard_closed_finance() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_trip uuid; v_other uuid; v_row jsonb; v_closed boolean;
begin
 if TG_TABLE_NAME='members' and TG_OP='UPDATE' then
  if new.confirmed is not distinct from old.confirmed and new.trip_id=old.trip_id then return new; end if;
 end if;
 v_row:=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 if TG_TABLE_NAME='expense_shopping_items' then
 select trip_id into v_trip from public.expenses where id=(v_row->>'expense_id')::uuid;
 else v_trip:=(v_row->>'trip_id')::uuid; end if;
 if TG_OP='UPDATE' then
  if TG_TABLE_NAME='expense_shopping_items' then select trip_id into v_other from public.expenses where id=old.expense_id;
  else v_other:=(to_jsonb(old)->>'trip_id')::uuid; end if;
 end if;
 for v_closed in select status='closed' from public.trip_closeouts where trip_id in (v_trip,v_other) order by trip_id for update loop
  if v_closed then raise exception 'TRIP_ACCOUNTS_CLOSED'; end if;
 end loop;
 if TG_OP='DELETE' then return old; else return new; end if;
end $$;
revoke all on function kenz_internal.guard_closed_finance() from public,anon,authenticated;
do $$declare t text; begin foreach t in array array['expenses','expense_approval_requests','expense_shopping_items','trip_leftover_items','trip_leftover_allocations','members'] loop
 execute format('create trigger closeout_finance_guard before insert or update or delete on public.%I for each row execute function kenz_internal.guard_closed_finance()',t);
end loop; end $$;

-- Next-year planning is separate from this year's actuals and remains editable after closeout.
create table public.trip_next_plans (
 id uuid primary key default gen_random_uuid(),trip_id uuid not null references public.trips(id),
 shopping_item_id uuid references public.shopping_items(id),
 name text not null check(length(trim(name)) between 1 and 120),
 quantity numeric check(quantity is null or (quantity>0 and quantity<=100000)),
 unit text not null default '' check(length(unit)<=30),
 buy_from text not null default 'undecided' check(buy_from in ('cairo','ras_sudr','undecided')),
 note text not null default '' check(length(note)<=1000),
 created_by_member_id uuid not null references public.members(id),
 updated_by_member_id uuid not null references public.members(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(trip_id,shopping_item_id)
);
alter table public.trip_next_plans enable row level security;
revoke all on public.trip_next_plans from anon,authenticated;
grant select,insert,update on public.trip_next_plans to authenticated;
create policy next_plan_read on public.trip_next_plans for select to authenticated using(trip_id=(select trip_id from public.members where id=public.current_trip_member_id()));
create policy next_plan_insert on public.trip_next_plans for insert to authenticated with check(trip_id=(select trip_id from public.members where id=public.current_trip_member_id()) and created_by_member_id=public.current_trip_member_id() and updated_by_member_id=public.current_trip_member_id());
create policy next_plan_update on public.trip_next_plans for update to authenticated using(trip_id=(select trip_id from public.members where id=public.current_trip_member_id())) with check(trip_id=(select trip_id from public.members where id=public.current_trip_member_id()) and updated_by_member_id=public.current_trip_member_id());
create function kenz_internal.validate_next_plan() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if TG_OP='UPDATE' then
  new.created_by_member_id:=old.created_by_member_id; new.created_at:=old.created_at;
  if new.trip_id<>old.trip_id or new.shopping_item_id is distinct from old.shopping_item_id then raise exception 'PLAN_IDENTITY_IMMUTABLE'; end if;
 end if;
 if new.shopping_item_id is not null and not exists(select 1 from public.shopping_items where id=new.shopping_item_id and trip_id=new.trip_id) then raise exception 'INVALID_SHOPPING_ITEM'; end if;
 new.updated_at:=now(); return new;
end $$;
revoke all on function kenz_internal.validate_next_plan() from public,anon,authenticated;
create trigger next_plan_validate before insert or update on public.trip_next_plans for each row execute function kenz_internal.validate_next_plan();
