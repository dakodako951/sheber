create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title text not null,
  category text not null,
  city text not null,
  price numeric(12,2) not null check (price >= 0),
  description text not null,
  phone text not null,
  image_url text,
  rating numeric(2,1) not null default 5.0,
  reviews integer not null default 0,
  views integer not null default 0,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;

create policy "profiles readable by everyone" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "active listings readable by everyone" on public.listings for select using (status = 'active' or auth.uid() = owner_id);
create policy "users create own listings" on public.listings for insert with check (auth.uid() = owner_id);
create policy "owners update listings" on public.listings for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners delete listings" on public.listings for delete using (auth.uid() = owner_id);

create policy "users read own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "users add own favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "users remove own favorites" on public.favorites for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=2097152, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "public reads listing images" on storage.objects for select using (bucket_id = 'listing-images');
create policy "users upload listing images" on storage.objects for insert to authenticated with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own listing images" on storage.objects for update to authenticated using (bucket_id = 'listing-images' and owner_id = auth.uid()::text);
create policy "users delete own listing images" on storage.objects for delete to authenticated using (bucket_id = 'listing-images' and owner_id = auth.uid()::text);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, identifier)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','Пользователь'), coalesce(new.email,new.phone));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
