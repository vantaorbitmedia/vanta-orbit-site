create table if not exists public.daily_space_facts (
  id text primary key,
  slug text not null unique,
  title text not null,
  short_fact text not null,
  detailed_explanation text,
  source_notes text,
  publish_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live_short_fact', 'needs_review', 'ready', 'published', 'archived')),
  is_homepage_fact boolean not null default false,
  facebook_caption text,
  instagram_caption text,
  tiktok_caption text,
  youtube_caption text,
  hashtags text[] not null default '{}',
  leonardo_prompt text,
  image_url text,
  image_alt text,
  card_headline text,
  card_subtext text,
  card_curiosity_line text,
  card_cta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_post_published_at timestamptz
);

alter table public.daily_space_facts enable row level security;

create index if not exists daily_space_facts_publish_date_idx on public.daily_space_facts(publish_date);
create index if not exists daily_space_facts_status_idx on public.daily_space_facts(status);
create index if not exists daily_space_facts_homepage_idx on public.daily_space_facts(is_homepage_fact);
create index if not exists daily_space_facts_slug_idx on public.daily_space_facts(slug);
