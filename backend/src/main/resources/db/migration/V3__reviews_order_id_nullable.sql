-- V3 — Relax reviews.order_id constraint.
--
-- Purchase verification is now done via ReviewRepository.hasUserPurchasedProduct()
-- which checks order_items + order status. Recording which specific order the
-- review came from was more restrictive than the business rule requires
-- (a shopper may have purchased the same product multiple times).

ALTER TABLE reviews ALTER COLUMN order_id DROP NOT NULL;
