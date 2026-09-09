-- Sample products + referral rules for local development / demo purposes.
-- Do NOT run this against production.

insert into public.products (name, description, price, status, terms) values
  ('Starter Plan', 'Entry-level product for new members. Includes access to core platform features.', 499.00, 'active', 'Non-refundable after 7 days. See /refund-policy for full terms.'),
  ('Growth Plan', 'Mid-tier product with expanded features and priority support.', 999.00, 'active', 'Non-refundable after 7 days. See /refund-policy for full terms.'),
  ('Pro Plan', 'Full-featured product for power users.', 1499.00, 'active', 'Non-refundable after 7 days. See /refund-policy for full terms.');

-- 10% commission on every product, configurable per-product.
insert into public.referral_rules (product_id, commission_type, commission_value, active)
select id, 'percentage', 10, true from public.products;
