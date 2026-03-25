-- Qinlong v2 迁移 004: 统一市场数据表
-- 旧表保留不删，新表统一命名

-- 全市场股票主数据
CREATE TABLE IF NOT EXISTS stock_master (
    code        TEXT PRIMARY KEY,
    code_raw    TEXT NOT NULL,
    stock_name  TEXT NOT NULL,
    market      TEXT NOT NULL CHECK (market IN ('sh', 'sz', 'bj')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 全市场个股每日快照
CREATE TABLE IF NOT EXISTS stock_daily_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    code            TEXT NOT NULL,
    snap_date       DATE NOT NULL,
    last_px         NUMERIC,
    change          NUMERIC,
    cmc             NUMERIC,
    tr              NUMERIC,
    main_fund_diff  NUMERIC,
    trade_status    TEXT,
    market          TEXT NOT NULL,
    snapped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, snap_date)
);

-- 板块主数据
CREATE TABLE IF NOT EXISTS plate_master (
    plate_code  TEXT PRIMARY KEY,
    plate_name  TEXT NOT NULL,
    plate_type  TEXT NOT NULL CHECK (plate_type IN ('industry', 'concept', 'area')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 板块成分股（只抓一次）
CREATE TABLE IF NOT EXISTS plate_stock_map (
    plate_code  TEXT NOT NULL REFERENCES plate_master(plate_code) ON DELETE CASCADE,
    stock_code  TEXT NOT NULL,
    stock_name  TEXT,
    PRIMARY KEY (plate_code, stock_code)
);

-- 板块每日行情快照
CREATE TABLE IF NOT EXISTS plate_daily_snapshot (
    id              BIGSERIAL PRIMARY KEY,
    plate_code      TEXT NOT NULL,
    snap_date       DATE NOT NULL,
    change          NUMERIC,
    main_fund_diff  NUMERIC,
    up_stocks       JSONB,
    snapped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plate_code, snap_date)
);

-- 6大指数每日快照
CREATE TABLE IF NOT EXISTS index_daily_snapshot (
    id          BIGSERIAL PRIMARY KEY,
    secu_code   TEXT NOT NULL,
    secu_name   TEXT NOT NULL,
    snap_date   DATE NOT NULL,
    last_px     NUMERIC,
    change      NUMERIC,
    change_px   NUMERIC,
    up_num      INT,
    down_num    INT,
    flat_num    INT,
    snapped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (secu_code, snap_date)
);

-- 全市场涨跌分布（每天一行）
CREATE TABLE IF NOT EXISTS market_breadth_snapshot (
    id          BIGSERIAL PRIMARY KEY,
    snap_date   DATE UNIQUE NOT NULL,
    up_num      INT,
    down_num    INT,
    rise_num    INT,
    fall_num    INT,
    flat_num    INT,
    up_2        INT, up_4    INT, up_6    INT, up_8    INT, up_10   INT,
    down_2      INT, down_4  INT, down_6  INT, down_8  INT, down_10 INT,
    raw_json    JSONB,
    snapped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 涨停个股快照
CREATE TABLE IF NOT EXISTS limit_up_snapshot (
    id          BIGSERIAL PRIMARY KEY,
    snap_date   DATE NOT NULL,
    secu_code   TEXT NOT NULL,
    secu_name   TEXT,
    last_px     NUMERIC,
    change      NUMERIC,
    limit_time  TEXT,
    up_reason   TEXT,
    snapped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (snap_date, secu_code)
);

-- 跌停个股快照
CREATE TABLE IF NOT EXISTS limit_down_snapshot (
    id          BIGSERIAL PRIMARY KEY,
    snap_date   DATE NOT NULL,
    secu_code   TEXT NOT NULL,
    secu_name   TEXT,
    last_px     NUMERIC,
    change      NUMERIC,
    limit_time  TEXT,
    snapped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (snap_date, secu_code)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_stock_daily_snap_date ON stock_daily_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_stock_daily_market ON stock_daily_snapshot(market);
CREATE INDEX IF NOT EXISTS idx_plate_daily_snap_date ON plate_daily_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_index_daily_snap_date ON index_daily_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_limit_up_snap_date ON limit_up_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_limit_down_snap_date ON limit_down_snapshot(snap_date);
CREATE INDEX IF NOT EXISTS idx_plate_stock_map_stock ON plate_stock_map(stock_code);
