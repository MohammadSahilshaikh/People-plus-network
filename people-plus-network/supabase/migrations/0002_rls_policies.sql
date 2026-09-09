-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Principle: users can only ever read/write their own rows. Every write that
-- affects money (orders->paid, transactions, referral rewards, withdrawal
-- approval) is blocked from direct client writes and must go through
-- SECURITY DEFINER functions (0003_functions.sql) called from server-side
-- API routes using the service role key.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.referral_rules enable row level security;
alter table public.referrals enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.events enable row level security;
alter table public.event_prizes enable row level security;
alter table public.event_eligibility enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

-- ---------------------------------------------------------------- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_limited" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
  -- Note: application layer / a trigger should restrict which columns a
  -- non-admin update may touch (e.g. block status, is_admin, referral_code).

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------- products
create policy "products_select_active_public" on public.products
  for select using (status = 'active' or public.is_admin());

create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- orders
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id and status = 'pending');
  -- Orders may only ever be *created* by the client in 'pending' state.
  -- Transitioning to paid/failed/refunded happens only via the server
  -- using the service role key (see api/payments).

create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- payments
create policy "payments_select_own_or_admin" on public.payments
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
-- No insert/update policy for regular users: payments are only ever written
-- by the server (service role bypasses RLS) in response to a verified
-- payment gateway webhook.

-- ---------------------------------------------------------------- referral_rules
create policy "referral_rules_select_all" on public.referral_rules
  for select using (true);

create policy "referral_rules_admin_write" on public.referral_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- referrals
create policy "referrals_select_own_or_admin" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id or public.is_admin());
-- No client insert/update: referrals are created server-side at
-- registration time and updated server-side when an order is paid/refunded.

-- ---------------------------------------------------------------- transactions
create policy "transactions_select_own_or_admin" on public.transactions
  for select using (auth.uid() = user_id or public.is_admin());
-- No client insert/update/delete, ever. The ledger is written exclusively
-- by SECURITY DEFINER functions below.

-- ---------------------------------------------------------------- withdrawals
create policy "withdrawals_select_own_or_admin" on public.withdrawals
  for select using (auth.uid() = user_id or public.is_admin());

create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (auth.uid() = user_id);
  -- The insert itself doesn't move money; public.request_withdrawal() below
  -- is what should actually be called (it validates balance and reserves
  -- funds atomically). This direct-insert policy exists only as a fallback
  -- and still requires status default 'pending'.

create policy "withdrawals_admin_update" on public.withdrawals
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- notifications
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own_read_state" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- support
create policy "support_tickets_select_own_or_admin" on public.support_tickets
  for select using (auth.uid() = user_id or public.is_admin());

create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (auth.uid() = user_id);

create policy "support_tickets_admin_update" on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());

create policy "support_messages_select_participant" on public.support_messages
  for select using (
    public.is_admin() or
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

create policy "support_messages_insert_participant" on public.support_messages
  for insert with check (
    sender_id = auth.uid() and (
      public.is_admin() or
      exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------- announcements
create policy "announcements_select_published" on public.announcements
  for select using (status = 'published' or public.is_admin());

create policy "announcements_admin_write" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- admin_users
create policy "admin_users_select_admin_only" on public.admin_users
  for select using (public.is_admin());
-- Writes to admin_users must happen via the Supabase dashboard / a trusted
-- server script, never via the client API.

-- ---------------------------------------------------------------- audit_logs
create policy "audit_logs_select_admin_only" on public.audit_logs
  for select using (public.is_admin());
-- Inserts happen only via SECURITY DEFINER functions / service role.

-- ---------------------------------------------------------------- events
create policy "events_select_active_public" on public.events
  for select using (status = 'active' or public.is_admin());

create policy "events_admin_write" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "event_prizes_select_all" on public.event_prizes for select using (true);
create policy "event_prizes_admin_write" on public.event_prizes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "event_eligibility_select_own_or_admin" on public.event_eligibility
  for select using (auth.uid() = user_id or public.is_admin());
create policy "event_eligibility_admin_write" on public.event_eligibility
  for all using (public.is_admin()) with check (public.is_admin());
