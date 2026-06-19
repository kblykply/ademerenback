create table if not exists public.catalog_products (
  slug text primary key,
  sort_order integer not null default 0,
  product jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists catalog_products_sort_order_idx
  on public.catalog_products (sort_order);

create table if not exists public.site_content (
  id text primary key default 'main',
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  slug text primary key,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  post jsonb not null
);

create index if not exists blog_posts_status_idx
  on public.blog_posts (status);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

create index if not exists blog_posts_sort_order_idx
  on public.blog_posts (sort_order);

create table if not exists public.leads (
  id text primary key,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead jsonb not null
);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

create index if not exists leads_status_idx
  on public.leads (status);
