
-- Storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "room-photos public read"
on storage.objects for select
using (bucket_id = 'room-photos');

create policy "room-photos auth upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'room-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "room-photos owner delete"
on storage.objects for delete to authenticated
using (bucket_id = 'room-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Metadata table
create table public.room_photos (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index room_photos_room_idx on public.room_photos(room_id, created_at desc);

alter table public.room_photos enable row level security;

create policy "anyone signed in reads room photos"
on public.room_photos for select to authenticated
using (true);

create policy "users insert own room photos"
on public.room_photos for insert to authenticated
with check (auth.uid() = user_id);

create policy "users delete own room photos"
on public.room_photos for delete to authenticated
using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.room_photos;
