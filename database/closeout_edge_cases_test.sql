begin;
-- Fixtures and all side effects are rolled back, including notification queue entries.
do $$
declare t uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); ua uuid:=gen_random_uuid(); ub uuid:=gen_random_uuid(); uc uuid:=gen_random_uuid(); e uuid; cat uuid; req uuid;
begin
 insert into auth.users(id) values(ua),(ub),(uc);
 insert into public.trips(id,slug,name) values(t,'qa-closeout-'||t,'QA closeout');
 insert into public.trip_closeouts(trip_id) values(t);
 insert into public.members(id,trip_id,name,access_role,sort_order) values(a,t,'QA creditor','admin',1),(b,t,'QA debtor','member',2),(c,t,'QA reverse','member',3);
 insert into public.device_sessions(auth_user_id,member_id) values(ua,a),(ub,b),(uc,c);
 insert into public.categories(trip_id,name) values(t,'QA category') returning id into cat;
 perform set_config('request.jwt.claim.sub',ua::text,true);
 req:=public.submit_expense_for_approval(a,cat,3000,'QA approved fixture');
 perform public.admin_review_expense_request(req,true,'QA approved');
 perform set_config('request.jwt.claim.sub','',true);
 insert into public.personal_expenses(trip_id,payer_member_id,beneficiary_member_id,description,amount) values(t,b,a,'QA zero net',1200),(t,b,a,'QA disputed excluded',900);
 perform set_config('qa.trip',t::text,true);perform set_config('qa.a',a::text,true);perform set_config('qa.b',b::text,true);perform set_config('qa.c',c::text,true);
 perform set_config('qa.ua',ua::text,true);perform set_config('qa.ub',ub::text,true);perform set_config('qa.uc',uc::text,true);
end $$;
do $$
declare t uuid:=current_setting('qa.trip')::uuid; a uuid:=current_setting('qa.a')::uuid; b uuid:=current_setting('qa.b')::uuid; item uuid; li uuid; snap jsonb; req uuid;
begin
 insert into public.shopping_items(trip_id,name) values(t,'QA leftover') returning id into item;
 insert into public.trip_leftover_items(trip_id,shopping_item_id,remaining_qty) values(t,item,1) returning id into li;
 insert into public.trip_leftover_allocations(trip_id,leftover_item_id,member_id,qty,unit_price,amount) values(t,li,b,1,300,300);
 snap:=kenz_internal.closeout_snapshot(t);
 if (snap->>'shared')::bigint<>270000 then raise exception 'FAIL subtract leftovers from common pool';end if;
 if not exists(select 1 from jsonb_array_elements(snap->'people') x where x->>'id'=b::text and (x->>'net')::bigint=-120000) then raise exception 'FAIL assign leftover to recipient';end if;
 update public.personal_expenses set status='disputed' where trip_id=t and description='QA disputed excluded';
 perform set_config('request.jwt.claim.sub',current_setting('qa.ua'),true);
 -- Unallocated leftovers block close; restored after verification.
 update public.trip_leftover_items set remaining_qty=2 where id=li;
 begin perform public.close_trip_accounts(true);raise exception 'FAIL open leftover not blocked';exception when others then if SQLERRM<>'OPEN_LEFTOVERS' then raise;end if;end;
 update public.trip_leftover_items set remaining_qty=1 where id=li;
 req:=public.submit_expense_for_approval(a,(select id from public.categories where trip_id=t limit 1),1,'QA pending');
 begin perform public.close_trip_accounts(true);raise exception 'FAIL pending not blocked';exception when others then if SQLERRM<>'PENDING_EXPENSES' then raise;end if;end;
 perform public.admin_review_expense_request(req,false,'QA reject');
end $$;
set local role authenticated;
do $$declare d jsonb; n jsonb; tr uuid; begin
 d:=public.close_trip_accounts(true);
 perform set_config('request.jwt.claim.sub',current_setting('qa.ub'),true);
 n:=public.my_trip_netting()->0;tr:=(n->>'transfer_id')::uuid;
 if (n->>'net')::bigint<>0 or jsonb_array_length(n->'items')<>1 then raise exception 'FAIL zero net/dispute';end if;
 perform public.submit_trip_netting(tr,n);
 perform set_config('request.jwt.claim.sub',current_setting('qa.ua'),true);
 perform public.trip_transfer_action(tr,'not_received');
 perform set_config('request.jwt.claim.sub',current_setting('qa.ub'),true);
 if public.my_personal_offset_states()<>'[]'::jsonb then raise exception 'FAIL rejected offsets released';end if;
 n:=public.my_trip_netting()->0;perform public.submit_trip_netting(tr,n);
 perform set_config('request.jwt.claim.sub',current_setting('qa.ua'),true);
 perform public.trip_transfer_action(tr,'confirm');
end $$;
rollback;
select 'PASS: leftover allocation, pending/open blocking, disputed exclusion, zero net, rejection and retry; rolled back' as test_result;
