
-- ============ ROLES ============
create type public.app_role as enum ('organizer', 'attendee');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "organizers read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'organizer'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  one_liner text,
  intent text,
  tags text[] not null default '{}',
  socials jsonb not null default '{}'::jsonb,
  gradient jsonb,
  color text not null default '#7c3aed',
  initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "anyone signed in can read profiles" on public.profiles
  for select to authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    display_name,
    upper(substr(regexp_replace(display_name, '[^a-zA-Z ]', '', 'g'), 1, 2))
  );
  -- Default role: attendee. Organizer role is granted manually.
  insert into public.user_roles (user_id, role) values (new.id, 'attendee');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ EVENTS ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dates text,
  city text,
  description text,
  cover_gradient text,
  is_live boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
create policy "anyone signed in reads events" on public.events
  for select to authenticated using (true);
create policy "organizers create events" on public.events
  for insert to authenticated with check (public.has_role(auth.uid(), 'organizer') and auth.uid() = owner_id);
create policy "owner updates event" on public.events
  for update to authenticated using (auth.uid() = owner_id);
create policy "owner deletes event" on public.events
  for delete to authenticated using (auth.uid() = owner_id);

-- ============ ROOMS ============
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  kind text not null default 'session',
  capacity int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "anyone signed in reads rooms" on public.rooms
  for select to authenticated using (true);
create policy "organizers manage rooms" on public.rooms
  for all to authenticated using (public.has_role(auth.uid(), 'organizer'))
  with check (public.has_role(auth.uid(), 'organizer'));

-- ============ SESSIONS ============
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  speaker text,
  speaker_role text,
  time_label text,
  abstract text,
  topics text[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  transcript jsonb,
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create policy "anyone signed in reads sessions" on public.sessions
  for select to authenticated using (true);
create policy "organizers manage sessions" on public.sessions
  for all to authenticated using (public.has_role(auth.uid(), 'organizer'))
  with check (public.has_role(auth.uid(), 'organizer'));

-- ============ ATTENDEES ============
create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'registered',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_attendees enable row level security;
create policy "anyone signed in reads attendees" on public.event_attendees
  for select to authenticated using (true);
create policy "users register self" on public.event_attendees
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users unregister self" on public.event_attendees
  for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'organizer'));

-- ============ INVITATIONS ============
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;
create policy "organizers manage invitations" on public.invitations
  for all to authenticated using (public.has_role(auth.uid(), 'organizer'))
  with check (public.has_role(auth.uid(), 'organizer'));

-- ============ PRESENCE ============
create table public.presence (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.presence enable row level security;
create policy "anyone signed in reads presence" on public.presence
  for select to authenticated using (true);
create policy "users set own presence" on public.presence
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own presence" on public.presence
  for update to authenticated using (auth.uid() = user_id);
create policy "organizers update presence" on public.presence
  for all to authenticated using (public.has_role(auth.uid(), 'organizer'))
  with check (public.has_role(auth.uid(), 'organizer'));

-- ============ TAPS ============
create table public.taps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
alter table public.taps enable row level security;
create policy "anyone signed in reads taps" on public.taps
  for select to authenticated using (true);
create policy "organizers create taps" on public.taps
  for insert to authenticated with check (public.has_role(auth.uid(), 'organizer') and auth.uid() = organizer_id);

-- ============ CARDS EXCHANGED ============
create table public.cards_exchanged (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  reason text,
  at timestamptz not null default now(),
  unique (event_id, from_user, to_user)
);
alter table public.cards_exchanged enable row level security;
create policy "anyone signed in reads cards" on public.cards_exchanged
  for select to authenticated using (true);
create policy "users exchange own cards" on public.cards_exchanged
  for insert to authenticated with check (auth.uid() = from_user);

-- ============ REALTIME ============
alter publication supabase_realtime add table public.presence;
alter publication supabase_realtime add table public.taps;
alter publication supabase_realtime add table public.cards_exchanged;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.rooms;
