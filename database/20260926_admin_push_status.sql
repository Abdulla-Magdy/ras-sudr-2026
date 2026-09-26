-- Admin-only, trip-scoped summary. Never expose subscription endpoints or keys.
create or replace function public.admin_push_status()
returns table(member_id uuid, name text, confirmed boolean, active_devices bigint)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_member uuid;
  current_trip uuid;
begin
  current_member := public.current_trip_member_id();
  select m.trip_id into current_trip from public.members m
  where m.id = current_member and m.access_role = 'admin';
  if current_trip is null then raise exception 'ADMIN_ONLY'; end if;

  return query
  select m.id, m.name, coalesce(m.confirmed, true), count(ps.id)
  from public.members m
  left join public.push_subscriptions ps
    on ps.member_id = m.id and ps.trip_id = current_trip and ps.enabled = true
  where m.trip_id = current_trip
  group by m.id, m.name, m.confirmed, m.sort_order
  order by m.sort_order, m.name;
end;
$function$;

revoke all on function public.admin_push_status() from public, anon;
grant execute on function public.admin_push_status() to authenticated;
