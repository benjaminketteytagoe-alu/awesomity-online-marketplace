-- V2 — Add audit timestamps to order_items for consistency with BaseEntity
--
-- Rationale: every other entity extends BaseEntity, which provides
-- created_at and updated_at. Making order_items match keeps the entity
-- layer uniform and gives us an audit trail for line-item creation.

ALTER TABLE order_items
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Attach the same updated_at trigger used elsewhere
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
