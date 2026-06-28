-- Enable UUID generation for other tables that still use UUIDs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum-like check constraint is used instead of a native ENUM type so that
-- adding a new status later does not require an ALTER TYPE migration.

CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    customer_name   TEXT,
    items           JSONB NOT NULL,              -- [{ item_id, qty, ... }]
    total_amount    NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status          TEXT NOT NULL DEFAULT 'PLACED'
                        CHECK (status IN ('PLACED', 'PREPARING', 'COMPLETED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent upgrade path for databases created before customer_name
-- existed, so existing orders keep working without losing data.
ALTER TABLE orders ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Archive table mirrors the orders table exactly so rows can be moved
-- between them with a plain INSERT ... SELECT.
CREATE TABLE IF NOT EXISTS orders_archive (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    customer_name   TEXT,
    items           JSONB NOT NULL,
    total_amount    NUMERIC(12, 2) NOT NULL,
    status          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    archived_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders_archive ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE orders_archive ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Food catalog: created once via the Food Management screen, then
-- referenced by id ("item_id") from order items instead of re-entering
-- name/price/image on every order.
CREATE TABLE IF NOT EXISTS foods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    category        TEXT,
    image_path      TEXT,                        -- e.g. /uploads/xyz.png, NULL = use default-food.png
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_category ON foods (category);

-- One invoice configuration per store. This is upserted by store_id so
-- editing updates the existing row rather than creating duplicates.
CREATE TABLE IF NOT EXISTS invoice_configs (
    store_id            TEXT PRIMARY KEY,
    restaurant_name     TEXT NOT NULL,
    restaurant_address  TEXT NOT NULL,
    gst_number          TEXT NOT NULL,
    qr_image_path       TEXT,
    footer_note         TEXT NOT NULL DEFAULT 'Thanks! Visit Again',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily per-store counter used to generate human-readable tracking numbers.
CREATE TABLE IF NOT EXISTS order_tracking_sequences (
    store_id        TEXT NOT NULL,
    sequence_date   DATE NOT NULL,
    last_sequence   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (store_id, sequence_date)
);

-- Required indexes: store_id and created_at on the hot table.
CREATE INDEX IF NOT EXISTS idx_orders_store_id   ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Composite index supports the most common query: "orders for a store,
-- newest first" which is exactly what GET /orders?store_id= does.
CREATE INDEX IF NOT EXISTS idx_orders_store_created
    ON orders (store_id, created_at DESC);

-- GIN index lets the analytics queries expand the items JSONB array
-- efficiently when computing top-selling items.
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN (items);

CREATE INDEX IF NOT EXISTS idx_orders_archive_store_id   ON orders_archive (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_archive_created_at ON orders_archive (created_at);

-- Keep updated_at current whenever a row changes (used by the status PATCH).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_foods_updated_at ON foods;
CREATE TRIGGER trg_foods_updated_at
    BEFORE UPDATE ON foods
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_invoice_configs_updated_at ON invoice_configs;
CREATE TRIGGER trg_invoice_configs_updated_at
    BEFORE UPDATE ON invoice_configs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
