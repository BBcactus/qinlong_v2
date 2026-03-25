-- Qinlong v2 初始化迁移
-- 运行方式: psql $DATABASE_URL -f migrations/001_init.sql

-- 北交所股票主数据
CREATE TABLE IF NOT EXISTS bj_stock_master (
    code        TEXT PRIMARY KEY,
    code6       TEXT NOT NULL,
    stock_name  TEXT NOT NULL,
    market      TEXT NOT NULL DEFAULT 'bj',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 北交所股票日快照
CREATE TABLE IF NOT EXISTS bj_stock_snapshot (
    id               BIGSERIAL PRIMARY KEY,
    code             TEXT NOT NULL REFERENCES bj_stock_master(code),
    last_px          NUMERIC,
    change_rate      NUMERIC,
    turnover_rate    NUMERIC,
    business_balance NUMERIC,
    market_cap       NUMERIC,
    snap_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    snapped_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, snap_date)
);

-- 板块主数据
CREATE TABLE IF NOT EXISTS plate_master (
    plate_code       TEXT PRIMARY KEY,
    plate_name       TEXT NOT NULL,
    plate_type       TEXT NOT NULL,
    plate_type_label TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 板块日快照
CREATE TABLE IF NOT EXISTS plate_snapshot (
    id                  BIGSERIAL PRIMARY KEY,
    plate_code          TEXT NOT NULL REFERENCES plate_master(plate_code),
    change_rate         NUMERIC,
    main_inflow         NUMERIC,
    main_inflow_rate    NUMERIC,
    leading_stock       TEXT,
    leading_stock_code  TEXT,
    snap_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    snapped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plate_code, snap_date)
);

-- 板块-个股映射
CREATE TABLE IF NOT EXISTS plate_stock_map (
    plate_code  TEXT NOT NULL REFERENCES plate_master(plate_code),
    stock_code  TEXT NOT NULL,
    stock_name  TEXT,
    PRIMARY KEY (plate_code, stock_code)
);

-- 指数快照
CREATE TABLE IF NOT EXISTS index_snapshot (
    id          BIGSERIAL PRIMARY KEY,
    code        TEXT NOT NULL,
    name        TEXT,
    current     NUMERIC,
    change_rate NUMERIC,
    snap_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    snapped_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, snap_date)
);

-- 指数分时线
CREATE TABLE IF NOT EXISTS index_tline (
    id          BIGSERIAL PRIMARY KEY,
    code        TEXT NOT NULL,
    price       NUMERIC,
    avg_price   NUMERIC,
    volume      BIGINT,
    ts          TIMESTAMPTZ NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 擒龙标的池
CREATE TABLE IF NOT EXISTS watchlist (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL,
    code6       TEXT NOT NULL,
    stock_name  TEXT NOT NULL,
    add_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    note        TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    tags        TEXT[],
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 持仓池
CREATE TABLE IF NOT EXISTS position (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL,
    code6       TEXT NOT NULL,
    stock_name  TEXT NOT NULL,
    buy_date    DATE NOT NULL,
    buy_price   NUMERIC NOT NULL,
    quantity    INT NOT NULL,
    cost_basis  NUMERIC NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open',
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 持仓历史
CREATE TABLE IF NOT EXISTS position_history (
    id          SERIAL PRIMARY KEY,
    position_id INT NOT NULL REFERENCES position(id),
    action      TEXT NOT NULL,
    price       NUMERIC NOT NULL,
    quantity    INT NOT NULL,
    trade_date  DATE NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI 服务商
CREATE TABLE IF NOT EXISTS ai_provider (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    base_url    TEXT NOT NULL,
    api_key_env TEXT NOT NULL DEFAULT '',
    api_key     TEXT NOT NULL DEFAULT '',
    model_id    TEXT NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false
);

-- AI 技能
CREATE TABLE IF NOT EXISTS ai_skill (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    description   TEXT,
    system_prompt TEXT,
    provider_id   INT NOT NULL REFERENCES ai_provider(id),
    temperature   NUMERIC NOT NULL DEFAULT 0.7,
    max_tokens    INT NOT NULL DEFAULT 2048,
    enabled       BOOLEAN NOT NULL DEFAULT true
);

-- AI Agent
CREATE TABLE IF NOT EXISTS ai_agent (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    skill_id    INT REFERENCES ai_skill(id),
    max_tokens  INT NOT NULL DEFAULT 4096,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 种子数据: 默认 AI 服务商
INSERT INTO ai_provider (name, base_url, api_key_env, api_key, model_id, is_default)
VALUES ('Anthropic Claude', 'https://api.anthropic.com', 'ANTHROPIC_API_KEY', '', 'claude-opus-4-6', true)
ON CONFLICT DO NOTHING;

-- 索引
CREATE INDEX IF NOT EXISTS idx_bj_snapshot_code ON bj_stock_snapshot(code);
CREATE INDEX IF NOT EXISTS idx_plate_snapshot_code ON plate_snapshot(plate_code);
CREATE INDEX IF NOT EXISTS idx_index_snapshot_code ON index_snapshot(code);
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON watchlist(status);
CREATE INDEX IF NOT EXISTS idx_position_status ON position(status);
