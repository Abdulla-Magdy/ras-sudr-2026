-- Private bilateral netting. Shared ledger only stores the original trip liability.
create table kenz_internal.transfer_netting (
 transfer_id uuid primary key references public.trip_settlement_transfers(id),
 detail jsonb not null, reverse_sent_at timestamptz
);
create table kenz_internal.transfer_offsets (
 expense_id uuid primary key references public.personal_expenses(id),
 transfer_id uuid not null references public.trip_settlement_transfers(id)
);
revoke all on kenz_internal.transfer_netting,kenz_internal.transfer_offsets from public,anon,authenticated;

create function kenz_internal.netting_detail(p_t public.trip_settlement_transfers) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare v_saved jsonb; v_reverse timestamptz; v_items jsonb; v_minus bigint; v_plus bigint;
begin
 select detail,reverse_sent_at into v_saved,v_reverse from kenz_internal.transfer_netting where transfer_id=p_t.id;
 if found then return v_saved||jsonb_build_object('reverse_sent_at',v_reverse); end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'description',e.description,'cents',round(e.amount*100)::bigint,'direction',case when e.payer_member_id=p_t.from_member_id then 'subtract' else 'add' end) order by e.id),'[]'),
 coalesce(sum(case when e.payer_member_id=p_t.from_member_id then round(e.amount*100) else 0 end),0),
 coalesce(sum(case when e.payer_member_id=p_t.to_member_id then round(e.amount*100) else 0 end),0)
 into v_items,v_minus,v_plus from public.personal_expenses e
 where e.trip_id=p_t.trip_id and e.status='active'
 and ((e.payer_member_id=p_t.from_member_id and e.beneficiary_member_id=p_t.to_member_id) or (e.payer_member_id=p_t.to_member_id and e.beneficiary_member_id=p_t.from_member_id))
 and not exists(select 1 from kenz_internal.transfer_offsets o where o.expense_id=e.id);
 return jsonb_build_object('transfer_id',p_t.id,'trip_cents',round(p_t.amount*100)::bigint,'subtract',v_minus,'add',v_plus,'net',round(p_t.amount*100)::bigint-v_minus+v_plus,'items',v_items,'reverse_sent_at',null);
end $$;
revoke all on function kenz_internal.netting_detail(public.trip_settlement_transfers) from public,anon,authenticated;

create function kenz_internal.my_netting() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_result jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(kenz_internal.netting_detail(t)),'[]') into v_result
 from public.trip_settlement_transfers t where (t.from_member_id=v_me or t.to_member_id=v_me) and t.status in ('pending','sent','confirmed');
 return v_result;
end $$;
revoke all on function kenz_internal.my_netting() from public,anon;
grant execute on function kenz_internal.my_netting() to authenticated;
create function public.my_trip_netting() returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.my_netting()$$;
revoke all on function public.my_trip_netting() from public,anon;
grant execute on function public.my_trip_netting() to authenticated;

create function kenz_internal.submit_netting(p_id uuid,p_expected jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid; v_t public.trip_settlement_transfers; v_detail jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 perform 1 from public.trip_closeouts where trip_id=v_trip and status='closed' for update;
 if not found then raise exception 'TRIP_NOT_CLOSED'; end if;
 select * into v_t from public.trip_settlement_transfers where id=p_id and trip_id=v_trip and from_member_id=v_me for update;
 if not found or v_t.status<>'pending' then raise exception 'INVALID_TRANSFER_ACTION'; end if;
 perform 1 from public.personal_expenses e where e.trip_id=v_trip and ((e.payer_member_id=v_t.from_member_id and e.beneficiary_member_id=v_t.to_member_id) or (e.payer_member_id=v_t.to_member_id and e.beneficiary_member_id=v_t.from_member_id)) order by e.id for update;
 v_detail:=kenz_internal.netting_detail(v_t);
 if v_detail is distinct from p_expected then raise exception 'NETTING_CHANGED'; end if;
 insert into kenz_internal.transfer_netting(transfer_id,detail) values(p_id,v_detail);
 insert into kenz_internal.transfer_offsets(expense_id,transfer_id) select (x->>'id')::uuid,p_id from jsonb_array_elements(v_detail->'items') x;
 update public.trip_settlement_transfers set status='sent',sent_at=now() where id=p_id;
 return kenz_internal.closeout_dashboard();
end $$;
revoke all on function kenz_internal.submit_netting(uuid,jsonb) from public,anon;
grant execute on function kenz_internal.submit_netting(uuid,jsonb) to authenticated;
create function public.submit_trip_netting(p_id uuid,p_expected jsonb) returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.submit_netting(p_id,p_expected)$$;
revoke all on function public.submit_trip_netting(uuid,jsonb) from public,anon;
grant execute on function public.submit_trip_netting(uuid,jsonb) to authenticated;

create or replace function kenz_internal.transfer_action(p_id uuid,p_action text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_trip uuid; v_t public.trip_settlement_transfers; v_detail jsonb; v_reverse timestamptz; v_net bigint;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select trip_id into v_trip from public.members where id=v_me;
 perform 1 from public.trip_closeouts where trip_id=v_trip and status='closed' for update;
 if not found then raise exception 'TRIP_NOT_CLOSED'; end if;
 select * into v_t from public.trip_settlement_transfers where id=p_id and trip_id=v_trip for update;
 if not found or v_t.status<>'sent' then raise exception 'INVALID_TRANSFER_ACTION'; end if;
 select detail,reverse_sent_at into v_detail,v_reverse from kenz_internal.transfer_netting where transfer_id=p_id;
 v_net:=coalesce((v_detail->>'net')::bigint,round(v_t.amount*100)::bigint);
 if p_action='reverse_sent' and v_net<0 and v_reverse is null and v_me=v_t.to_member_id then
  update kenz_internal.transfer_netting set reverse_sent_at=now() where transfer_id=p_id;
 elsif p_action='confirm' and ((v_net>=0 and v_me=v_t.to_member_id) or (v_net<0 and v_reverse is not null and v_me=v_t.from_member_id)) then
  update public.trip_settlement_transfers set status='confirmed',confirmed_at=now() where id=p_id;
 elsif p_action='not_received' and ((v_reverse is null and v_me=v_t.to_member_id) or (v_net<0 and v_reverse is not null and v_me=v_t.from_member_id)) then
  delete from kenz_internal.transfer_offsets where transfer_id=p_id;
  delete from kenz_internal.transfer_netting where transfer_id=p_id;
  update public.trip_settlement_transfers set status='pending',sent_at=null where id=p_id;
 else raise exception 'INVALID_TRANSFER_ACTION'; end if;
 return kenz_internal.closeout_dashboard();
end $$;

create function kenz_internal.my_offset_states() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_me uuid:=public.current_trip_member_id(); v_rows jsonb;
begin
 if auth.uid() is null or v_me is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('expense_id',e.id,'transfer_id',t.id,'status',case when t.status='confirmed' then 'settled' else 'pending_settlement' end)),'[]') into v_rows
 from kenz_internal.transfer_offsets o join public.personal_expenses e on e.id=o.expense_id join public.trip_settlement_transfers t on t.id=o.transfer_id
 where e.payer_member_id=v_me or e.beneficiary_member_id=v_me;
 return v_rows;
end $$;
revoke all on function kenz_internal.my_offset_states() from public,anon;
grant execute on function kenz_internal.my_offset_states() to authenticated;
create function public.my_personal_offset_states() returns jsonb language sql security invoker set search_path='' as $$select kenz_internal.my_offset_states()$$;
revoke all on function public.my_personal_offset_states() from public,anon;
grant execute on function public.my_personal_offset_states() to authenticated;

create function kenz_internal.guard_offset_expense() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from kenz_internal.transfer_offsets where expense_id=old.id) then raise exception 'PERSONAL_EXPENSE_IN_SETTLEMENT'; end if;
 if TG_OP='DELETE' then return old; else return new; end if;
end $$;
revoke all on function kenz_internal.guard_offset_expense() from public,anon,authenticated;
create trigger guard_offset_expense before update or delete on public.personal_expenses for each row execute function kenz_internal.guard_offset_expense();
