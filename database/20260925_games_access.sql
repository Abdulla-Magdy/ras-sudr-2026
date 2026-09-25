-- Admin-controlled games gate for the prototype trip.
alter table public.trips add column if not exists games_enabled boolean not null default false;

create or replace function public.get_games_access()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare tid uuid;
begin
  select trip_id into tid from public.members where id=public.current_trip_member_id();
  if tid is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
  return coalesce((select games_enabled from public.trips where id=tid), false);
end $$;

create or replace function public.admin_set_games_access(p_enabled boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if not public.is_trip_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  select trip_id into tid from public.members where id=public.current_trip_member_id();
  if tid is null then raise exception 'MEMBER_LOGIN_REQUIRED'; end if;
  update public.trips set games_enabled=coalesce(p_enabled,false) where id=tid;
  return coalesce(p_enabled,false);
end $$;

-- All existing game write RPCs write through these tables. This also blocks stale clients.
create or replace function public.enforce_games_access()
returns trigger language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if TG_TABLE_NAME='game_court_votes' then
    select trip_id into tid from public.game_court_cases where id=NEW.case_id;
  else
    tid:=NEW.trip_id;
  end if;
  if not coalesce((select games_enabled from public.trips where id=tid), false) then
    raise exception 'GAMES_CLOSED';
  end if;
  return NEW;
end $$;

create trigger games_access_cases before insert or update on public.game_court_cases
for each row execute function public.enforce_games_access();
create trigger games_access_votes before insert or update on public.game_court_votes
for each row execute function public.enforce_games_access();
create trigger games_access_rounds before insert or update on public.game_forbidden_rounds
for each row execute function public.enforce_games_access();

revoke all on function public.enforce_games_access() from public, anon, authenticated;
revoke all on function public.admin_set_games_access(boolean) from public, anon;
revoke all on function public.get_games_access() from public, anon;
grant execute on function public.admin_set_games_access(boolean) to authenticated;
grant execute on function public.get_games_access() to authenticated;
