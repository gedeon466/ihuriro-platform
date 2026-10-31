/*
  IHURIRO online schema (Supabase / Postgres)

  Run this once in the Supabase SQL editor (Dashboard -> SQL -> New query).
  The Express API uses the project's secret key, so RLS stays closed to
  browser clients while the server has full access.

  If you prefer the API to apply this itself, set DATABASE_URL in
  backend/.env to the Postgres connection string and start the server.
*/

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Accounts (profiles mirror auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role text not null default 'citizen'
    check (role in ('citizen','student','parent','teacher','business','health','government','admin')),
  language text not null default 'en' check (language in ('en','rw','fr')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Citizen services
-- ---------------------------------------------------------------------------
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  location text not null,
  status text not null default 'pending'
    check (status in ('pending','in-review','resolved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  category text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('system','sms','email','government','school','health','business')),
  title text not null,
  message text not null,
  read boolean not null default false,
  date date not null default current_date,
  channel text not null default 'system' check (channel in ('sms','email','system')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Education
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class text not null,
  attendance numeric(5,1) not null default 0 check (attendance between 0 and 100),
  performance numeric(5,1) not null default 0 check (performance between 0 and 100),
  status text not null default 'active' check (status in ('active','at-risk','dropped')),
  date_of_birth text,
  gender text check (gender in ('male','female') or gender is null),
  academic_year text,
  parent_name text,
  parent_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subjects jsonb not null default '[]'::jsonb,
  classes jsonb not null default '[]'::jsonb,
  students integer not null default 0,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Business
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  stock integer not null default 0 check (stock >= 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  low_stock_alert integer not null default 8 check (low_stock_alert >= 0),
  description text,
  status text not null default 'in-stock' check (status in ('in-stock','low-stock','out-of-stock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  product text not null,
  quantity integer not null check (quantity > 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  date date not null default current_date,
  customer text,
  payment_method text not null default 'cash'
    check (payment_method in ('cash','mobile-money','card','credit')),
  created_at timestamptz not null default now()
);

create table if not exists public.loan_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'loan' check (type in ('loan','debt')),
  counterparty text not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  date date not null default current_date,
  interest_rate numeric(5,2) not null default 0 check (interest_rate >= 0),
  due_date date,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Oversight
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  resource text not null,
  resource_id text,
  detail jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists complaints_user_idx on public.complaints (user_id, created_at desc);
create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists notifications_user_idx on public.notifications (user_id, read, date desc);
create index if not exists students_class_idx on public.students (class, name);
create index if not exists sales_date_idx on public.sales (date desc, created_at desc);
create index if not exists loans_created_idx on public.loan_records (created_at desc);
create index if not exists audit_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Lock tables down: only the API's secret key may access them.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.ideas enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.loan_records enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Create a profile whenever an auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'citizen');
begin
  insert into public.profiles (id, name, email, phone, role, language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    case
      when requested_role in ('citizen','student','parent','teacher','business','health','government','admin')
        then requested_role
      else 'citizen'
    end,
    coalesce(nullif(new.raw_user_meta_data->>'language', ''), 'en')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic sale creation (inserts the sale and decrements product stock)
-- ---------------------------------------------------------------------------
create or replace function public.create_sale(
  p_user_id uuid,
  p_product text,
  p_quantity integer,
  p_amount numeric,
  p_date date,
  p_customer text,
  p_payment_method text
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_sale public.sales;
  v_next_stock integer;
begin
  select * into v_product
  from public.products
  where lower(name) = lower(p_product)
  limit 1;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  insert into public.sales (user_id, product, quantity, amount, date, customer, payment_method)
  values (
    p_user_id,
    v_product.name,
    p_quantity,
    p_amount,
    p_date,
    nullif(p_customer, ''),
    p_payment_method
  )
  returning * into v_sale;

  v_next_stock := greatest(0, v_product.stock - p_quantity);

  update public.products
     set stock = v_next_stock,
         status = case
           when v_next_stock <= 0 then 'out-of-stock'
           when v_next_stock <= low_stock_alert then 'low-stock'
           else 'in-stock'
         end,
         updated_at = now()
   where id = v_product.id;

  return v_sale;
end;
$$;
