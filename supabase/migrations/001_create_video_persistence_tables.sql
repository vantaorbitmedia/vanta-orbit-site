create extension if not exists pgcrypto;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  video_url text not null,
  thumbnail_url text,
  published_date date not null,
  content_type text not null,
  category text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  selected_hook text,
  selected_thumbnail_text text,
  tags text[] not null default '{}',
  series text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deep_dives (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  title text not null,
  slug text not null unique,
  content text not null,
  meta_description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos enable row level security;
alter table public.deep_dives enable row level security;

create index if not exists videos_status_idx on public.videos(status);
create index if not exists videos_slug_idx on public.videos(slug);
create index if not exists deep_dives_video_id_idx on public.deep_dives(video_id);
create index if not exists deep_dives_slug_idx on public.deep_dives(slug);
