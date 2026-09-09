-- ============================================================================
-- People Plus Network — Initial Schema
-- ============================================================================
-- This migration creates all core tables. RLS policies live in
-- 0002_rls_policies.sql. Wallet/referral logic (the parts that must never be
-- driven from the frontend) live in 0003_functions.sql.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  email text unique not null,
  referral_code text unique not null,
  referred_by uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active','suspended')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_referral_code on public.profiles(referral_code);
create index idx_profiles_referred_by on public.profiles(referred_by);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_status on public.products(status);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  amount numeric(12,2) not null check (amount >= 0),
  referral_code_used text,
  referrer_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);

-- ----------------------------------------------------------------------------
-- payments  (one row per payment attempt/webhook event against an order)
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'manual',
  provider_payment_id text,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  idempotency_key text unique,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);
create index idx_payments_order on public.payments(order_id);

-- ----------------------------------------------------------------------------
-- referral_rules  (database-driven commission configuration)
-- ----------------------------------------------------------------------------
create table public.referral_rules (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade,
  commission_type text not null default 'percentage' check (commission_type in ('percentage','fixed')),
  commission_value numeric(12,2) not null check (commission_value >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_referral_rules_product on public.referral_rules(product_id);

-- ----------------------------------------------------------------------------
-- referrals  (one row per referred signup, linked to the order that
-- triggered eligibility, if any)
-- ----------------------------------------------------------------------------
create table public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id),
  status text not null default 'pending' check (status in ('pending','eligible','rejected','reversed')),
  reward_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (referred_id) -- a user can only ever be attributed to one referrer
);
create index idx_referrals_referrer on public.referrals(referrer_id);

-- ----------------------------------------------------------------------------
-- transactions  (immutable wallet ledger — the single source of truth for
-- balance. Never updated or deleted, only inserted.)
-- ----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('purchase','referral_reward','reward','withdrawal','refund','adjustment')),
  amount numeric(12,2) not null, -- positive = credit, negative = debit
  status text not null default 'completed' check (status in ('pending','completed','reversed')),
  reference_type text,          -- e.g. 'order', 'withdrawal', 'referral'
  reference_id uuid,
  idempotency_key text unique,  -- prevents duplicate crediting (e.g. duplicate webhooks)
  description text,
  created_at timestamptz not null default now()
);
create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_type on public.transactions(type);

-- ----------------------------------------------------------------------------
-- withdrawals
-- ----------------------------------------------------------------------------
create table public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  ifsc text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','processing','paid','failed')),
  transaction_reference text,
  admin_notes text,
  processed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_withdrawals_user on public.withdrawals(user_id);
create index idx_withdrawals_status on public.withdrawals(status);

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, read);

-- ----------------------------------------------------------------------------
-- support_tickets / support_messages
-- ----------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_support_tickets_user on public.support_tickets(user_id);

create table public.support_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  is_admin boolean not null default false,
  message text not null,
  created_at timestamptz not null default now()
);
create index idx_support_messages_ticket on public.support_messages(ticket_id);

-- ----------------------------------------------------------------------------
-- announcements
-- ----------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- admin_users  (separate, explicit allowlist — do NOT rely on profiles.is_admin
-- alone for authorization checks in API routes)
-- ----------------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','super_admin')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_logs  (every admin action must write here)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_actor on public.audit_logs(actor_id);

-- ----------------------------------------------------------------------------
-- events / event_prizes / event_eligibility (optional reward-event system)
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','ended')),
  terms text,
  created_at timestamptz not null default now()
);

create table public.event_prizes (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  rank integer
);

create table public.event_eligibility (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  eligible boolean not null default false,
  reason text,
  unique (event_id, user_id)
);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger trg_withdrawals_updated_at before update on public.withdrawals
  for each row execute function public.set_updated_at();
create trigger trg_support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
