-- THE LOST BOX - Supabase setup
-- Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.

-- 1. Table that stores every report -------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  type         text not null check (type in ('Lost', 'Found')),
  email        text not null check (char_length(email) between 5 and 150),
  admission_no text not null check (admission_no ~ '^[A-Za-z0-9/-]{3,30}$'),
  item_name    text not null check (char_length(item_name) between 3 and 100),
  description  text not null check (char_length(description) between 10 and 1000),
  item_date    date not null check (item_date <= current_date + 1),
  location     text not null check (char_length(location) between 1 and 150),
  image_url    text not null check (char_length(image_url) <= 500)
);

-- same person cannot submit the same report twice
create unique index if not exists reports_no_duplicates
  on public.reports (lower(email), type, lower(item_name), item_date);

-- 2. Security: visitors may ADD reports but cannot read the raw table ----------
alter table public.reports enable row level security;

drop policy if exists "anyone can add a report" on public.reports;
create policy "anyone can add a report"
  on public.reports for insert to anon with check (true);

-- 3. Public view for the website: everything EXCEPT the admission number ------
create or replace view public.reports_public as
  select id, created_at, type, email, item_name, description, item_date, location, image_url
  from public.reports;

grant select on public.reports_public to anon;
grant insert on public.reports to anon;

-- 4. Photo storage: public bucket, 5 MB limit, images only --------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

drop policy if exists "anyone can upload report photos" on storage.objects;
create policy "anyone can upload report photos"
  on storage.objects for insert to anon with check (bucket_id = 'report-images');
