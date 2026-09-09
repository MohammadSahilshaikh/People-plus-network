-- ============================================================================
-- Money-moving functions
-- ============================================================================
-- These are the ONLY way balances should ever change. They are called from
-- server-side API routes (api/*) using the Supabase service role client,
-- never directly from the browser. Each one is idempotent where relevant
-- (via idempotency_key on transactions/payments) and wraps its logic in a
-- single transaction so partial failures can't corrupt the ledger.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- wallet_balance(user) -> numeric
-- Balance is always *derived* from the transaction ledger, never stored.
-- ---------------------------------------------------------------------------
create or replace function public.wallet_balance(p_user_id uuid)
returns numeric language sql stable security definer as $$
  select coalesce(sum(amount), 0)
  from public.transactions
  where user_id = p_user_id and status = 'completed';
$$;

-- ---------------------------------------------------------------------------
-- credit_wallet / debit_wallet
-- Generic ledger insert. idempotency_key prevents double-processing
-- (e.g. a payment webhook firing twice).
-- ---------------------------------------------------------------------------
create or replace function public.record_transaction(
  p_user_id uuid,
  p_type text,
  p_amount numeric,           -- signed: positive credit, negative debit
  p_reference_type text,
  p_reference_id uuid,
  p_description text,
  p_idempotency_key text
) returns public.transactions
language plpgsql security definer as $$
declare
  v_row public.transactions;
begin
  if p_idempotency_key is not null then
    select * into v_row from public.transactions where idempotency_key = p_idempotency_key;
    if found then
      return v_row; -- already processed, return existing row (idempotent)
    end if;
  end if;

  insert into public.transactions (
    user_id, type, amount, status, reference_type, reference_id, description, idempotency_key
  ) values (
    p_user_id, p_type, p_amount, 'completed', p_reference_type, p_reference_id, p_description, p_idempotency_key
  ) returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- mark_order_paid(order_id, provider_payment_id, idempotency_key)
-- Call this ONLY after a payment gateway webhook has verified the payment
-- server-side. Never call this in response to a frontend "success" event.
-- Handles: order -> paid, payment row, purchase ledger entry, and triggers
-- referral commission crediting.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_idempotency_key text
) returns void
language plpgsql security definer as $$
declare
  v_order public.orders;
  v_rule public.referral_rules;
  v_commission numeric;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order % not found', p_order_id;
  end if;

  if v_order.status = 'paid' then
    return; -- already processed, idempotent no-op
  end if;

  if v_order.status not in ('pending') then
    raise exception 'order % is in status % and cannot be marked paid', p_order_id, v_order.status;
  end if;

  update public.orders set status = 'paid' where id = p_order_id;

  insert into public.payments (order_id, provider, provider_payment_id, amount, status, idempotency_key)
  values (p_order_id, p_provider, p_provider_payment_id, v_order.amount, 'succeeded', p_idempotency_key)
  on conflict (idempotency_key) do nothing;

  perform public.record_transaction(
    v_order.user_id, 'purchase', -v_order.amount, 'order', v_order.id,
    'Product purchase', p_idempotency_key || ':purchase'
  );

  -- Referral commission, if this order was attributed to a referrer.
  if v_order.referrer_id is not null and v_order.referrer_id <> v_order.user_id then
    select * into v_rule from public.referral_rules
      where product_id = v_order.product_id and active = true
      order by created_at desc limit 1;

    if found then
      if v_rule.commission_type = 'percentage' then
        v_commission := round(v_order.amount * v_rule.commission_value / 100.0, 2);
      else
        v_commission := v_rule.commission_value;
      end if;

      update public.referrals
        set status = 'eligible', reward_amount = v_commission, order_id = v_order.id
        where referrer_id = v_order.referrer_id and referred_id = v_order.user_id;

      perform public.record_transaction(
        v_order.referrer_id, 'referral_reward', v_commission, 'order', v_order.id,
        'Referral reward for order ' || v_order.id, p_idempotency_key || ':referral'
      );

      insert into public.notifications (user_id, title, message, type)
      values (v_order.referrer_id, 'Referral reward credited',
              'You earned a referral reward for a completed purchase.', 'referral_reward');
    end if;
  end if;

  insert into public.notifications (user_id, title, message, type)
  values (v_order.user_id, 'Purchase successful', 'Your order has been confirmed.', 'purchase');
end;
$$;

-- ---------------------------------------------------------------------------
-- reverse_order(order_id, reason) — refund/cancellation
-- Reverses the purchase ledger entry and, if a referral reward was already
-- paid out on this order, reverses that too.
-- ---------------------------------------------------------------------------
create or replace function public.reverse_order(
  p_order_id uuid,
  p_reason text
) returns void
language plpgsql security definer as $$
declare
  v_order public.orders;
  v_referral public.referrals;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order % not found', p_order_id;
  end if;
  if v_order.status <> 'paid' then
    raise exception 'only paid orders can be refunded (order % is %)', p_order_id, v_order.status;
  end if;

  update public.orders set status = 'refunded' where id = p_order_id;

  perform public.record_transaction(
    v_order.user_id, 'refund', v_order.amount, 'order', v_order.id,
    coalesce(p_reason, 'Order refunded'), 'refund:' || v_order.id::text
  );

  select * into v_referral from public.referrals where order_id = v_order.id and status = 'eligible';
  if found then
    update public.referrals set status = 'reversed' where id = v_referral.id;
    perform public.record_transaction(
      v_referral.referrer_id, 'adjustment', -v_referral.reward_amount, 'order', v_order.id,
      'Referral reward reversed due to refund', 'refund-reversal:' || v_order.id::text
    );
  end if;

  insert into public.notifications (user_id, title, message, type)
  values (v_order.user_id, 'Order refunded', coalesce(p_reason, 'Your order has been refunded.'), 'refund');
end;
$$;

-- ---------------------------------------------------------------------------
-- request_withdrawal(user_id, amount, bank_name, account_number, ifsc)
-- Validates balance (including other pending withdrawals) and reserves the
-- funds atomically by inserting a 'pending' withdrawal ledger entry.
-- ---------------------------------------------------------------------------
create or replace function public.request_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_ifsc text,
  p_min_withdrawal numeric default 500
) returns public.withdrawals
language plpgsql security definer as $$
declare
  v_available numeric;
  v_pending numeric;
  v_row public.withdrawals;
begin
  if p_amount < p_min_withdrawal then
    raise exception 'minimum withdrawal amount is %', p_min_withdrawal;
  end if;

  v_available := public.wallet_balance(p_user_id);

  select coalesce(sum(amount), 0) into v_pending
  from public.withdrawals
  where user_id = p_user_id and status in ('pending','processing','approved');

  if p_amount > (v_available - v_pending) then
    raise exception 'insufficient available balance';
  end if;

  insert into public.withdrawals (user_id, amount, bank_name, account_number, ifsc, status)
  values (p_user_id, p_amount, p_bank_name, p_account_number, p_ifsc, 'pending')
  returning * into v_row;

  insert into public.notifications (user_id, title, message, type)
  values (p_user_id, 'Withdrawal request received', 'Your withdrawal request is being reviewed.', 'withdrawal');

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_update_withdrawal(withdrawal_id, new_status, admin_id, ref, notes)
-- The only path that can move a withdrawal to approved/paid/rejected/failed.
-- Writes the actual debit transaction only once, when status becomes 'paid'.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_withdrawal(
  p_withdrawal_id uuid,
  p_new_status text,
  p_admin_id uuid,
  p_transaction_reference text,
  p_admin_notes text
) returns public.withdrawals
language plpgsql security definer as $$
declare
  v_row public.withdrawals;
begin
  select * into v_row from public.withdrawals where id = p_withdrawal_id for update;
  if not found then
    raise exception 'withdrawal % not found', p_withdrawal_id;
  end if;

  if not exists (select 1 from public.admin_users where id = p_admin_id) then
    raise exception 'actor % is not an admin', p_admin_id;
  end if;

  update public.withdrawals
    set status = p_new_status,
        transaction_reference = coalesce(p_transaction_reference, transaction_reference),
        admin_notes = coalesce(p_admin_notes, admin_notes),
        processed_by = p_admin_id
    where id = p_withdrawal_id
    returning * into v_row;

  if p_new_status = 'paid' then
    perform public.record_transaction(
      v_row.user_id, 'withdrawal', -v_row.amount, 'withdrawal', v_row.id,
      'Withdrawal paid out', 'withdrawal-paid:' || v_row.id::text
    );
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (p_admin_id, 'withdrawal_status_update', 'withdrawal', p_withdrawal_id,
          jsonb_build_object('new_status', p_new_status, 'notes', p_admin_notes));

  insert into public.notifications (user_id, title, message, type)
  values (
    v_row.user_id,
    case p_new_status
      when 'approved' then 'Withdrawal approved'
      when 'rejected' then 'Withdrawal rejected'
      when 'paid' then 'Withdrawal paid'
      else 'Withdrawal status updated'
    end,
    coalesce(p_admin_notes, 'Your withdrawal status has changed to ' || p_new_status || '.'),
    'withdrawal'
  );

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- register_referral(referred_id, referral_code)
-- Called once at registration. Prevents self-referral and duplicate
-- attribution (unique constraint on referrals.referred_id also enforces this).
-- ---------------------------------------------------------------------------
create or replace function public.register_referral(
  p_referred_id uuid,
  p_referral_code text
) returns void
language plpgsql security definer as $$
declare
  v_referrer_id uuid;
begin
  if p_referral_code is null or length(trim(p_referral_code)) = 0 then
    return;
  end if;

  select id into v_referrer_id from public.profiles where referral_code = p_referral_code;
  if not found or v_referrer_id = p_referred_id then
    return; -- invalid or self-referral: silently ignore, no reward path created
  end if;

  update public.profiles set referred_by = v_referrer_id where id = p_referred_id;

  insert into public.referrals (referrer_id, referred_id, status)
  values (v_referrer_id, p_referred_id, 'pending')
  on conflict (referred_id) do nothing;
end;
$$;
