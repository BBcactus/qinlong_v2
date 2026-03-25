-- 003_market_data.sql: 全市场数据表

-- 全市场个股主数据（沪深+北交所）
CREATE TABLE IF NOT EXISTS stock_master (
    code        TEXT PRIMARY KEY,        -- sh600000 / sz000001 / bj830001
    code6       TEXT NOT NULL,
    stock_name  TEXT NOT NULL,
    exchange    TEXT NOT NULL,           -- sh / sz / bj
    status      TEXT NOT NULL DEFAULT 'listed',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 全市场个股日快照
CREATE TABLE IF NOT EXISTS stock_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT NOT NULL REFERENCES stock_master(code),
    last_px         NUMERIC,
    change_rate     NUMERIC,
    turnover_rate   NUMERIC,
    float_mktcap    NUMERIC,
    main_net_inflow NUMERIC,
    snap_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    snapped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, snap_date)
);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_code ON stock_snapshot(code);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_date ON stock_snapshot(snap_date);

-- 涨跌停/连板市场数据（每次抓取一条聚合记录）
CREATE TABLE IF NOT EXISTS market_breadth (
    id                  BIGSERIAL PRIMARY KEY,
    snap_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    snapped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 涨停
    limit_up_count      INT,
    limit_down_count    INT,
    broken_board_count  INT,
    -- 连板
    consecutive_board   JSONB,          -- {"2连板": 12, "3连板": 5}
    -- 市场温度 (0-100)
    market_temperature  NUMERIC,
    -- 各涨跌停个股明细
    limit_up_pool       JSONB,
    limit_down_pool     JSONB,
    broken_board_pool   JSONB,
    consec_board_pool   JSONB,
    -- 原始抓取元数据
    raw_payload         JSONB,
    UNIQUE (snap_date, snapped_at)
);
CREATE INDEX IF NOT EXISTS idx_market_breadth_date ON market_breadth(snap_date);

-- 板块-个股映射补充（fetch_plate_stocks 填充）
-- plate_stock_map 已存在，只需确保 stock_code 不强依赖 stock_master FK
ALTER TABLE plate_stock_map DROP CONSTRAINT IF EXISTS plate_stock_map_stock_code_fkey;
