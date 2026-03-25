-- 005_limit_pool_unified.sql: 统一涨跌停/连板/炸板四池
-- 旧 limit_up_snapshot / limit_down_snapshot 保留不删

CREATE TABLE IF NOT EXISTS limit_stock_snapshot (
    id                  BIGSERIAL PRIMARY KEY,
    snap_date           DATE NOT NULL,
    pool_type           TEXT NOT NULL CHECK (pool_type IN ('up', 'down', 'consec', 'up_open')),
    secu_code           TEXT NOT NULL,
    secu_name           TEXT,
    last_px             NUMERIC,
    change              NUMERIC,
    limit_time          TEXT,
    reason              TEXT,          -- 涨/跌停原因标题
    reason_detail       TEXT,          -- 原因详情
    plate_codes         TEXT[],
    plate_names         TEXT[],
    is_st               BOOLEAN NOT NULL DEFAULT FALSE,
    limit_days          INT NOT NULL DEFAULT 1,  -- 连续涨/跌停天数
    snapped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (snap_date, pool_type, secu_code)
);

CREATE INDEX IF NOT EXISTS idx_limit_stock_snap_date  ON limit_stock_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_limit_stock_pool_type  ON limit_stock_snapshot(pool_type, snap_date);
CREATE INDEX IF NOT EXISTS idx_limit_stock_secu_code  ON limit_stock_snapshot(secu_code);
