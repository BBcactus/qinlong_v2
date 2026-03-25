# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qinlong v2 is a ground-up rewrite of a Chinese A-share (北交所/BJ) quantitative trading console. Primary data source is 财联社 (CLS / Cailianshe). The reference v1 implementation is at `../qinlong-panel/backend/src/app/services/cls_fetch.py`.

## Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 async, asyncpg, PostgreSQL 15+
- **Frontend**: React 18 + TypeScript + Vite + Ant Design 5 (Chinese locale)
- **HTTP**: httpx (async)
- **Scheduling**: APScheduler
- **AI**: Anthropic SDK (Claude)
- **Package manager**: uv (backend), npm (frontend)

## Commands

```bash
# Install
make install            # installs both backend and frontend deps
make install-backend    # cd backend && uv sync
make install-frontend   # cd frontend && npm install

# Dev servers
make dev-backend        # uvicorn on :8001 with --reload
make dev-frontend       # vite dev server (proxies /api → :8001)

# DB
make migrate            # runs all backend/migrations/0*.sql in order

# Code quality
make fmt                # ruff format
make lint               # ruff check
```

Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_URL` and `ANTHROPIC_API_KEY` before starting.

## Architecture

```
backend/src/app/
├── fetch/          # Pure HTTP fetchers — return plain dicts, no DB access
│   ├── cls_client.py   # shared httpx client + default CLS params
│   ├── market.py       # 指数/涨跌停/连板/炸板
│   ├── plates.py       # 板块列表 + 成分股
│   └── stocks.py       # 沪深+北交所全市场股票
├── normalize/      # Transform raw dicts → typed dicts, no I/O
│   ├── market.py
│   ├── plates.py
│   └── stocks.py
├── ingest/         # Write normalized data to DB, no HTTP
│   ├── market.py
│   ├── plates.py
│   └── stocks.py
├── api/            # FastAPI routers (thin: call fetch/normalize/ingest, return JSON)
│   ├── market.py
│   ├── watchlist.py
│   └── positions.py
├── core/
│   ├── config.py   # settings (pydantic-settings, reads .env)
│   └── db.py       # async engine + session factory
├── ai/
│   └── anthropic_client.py
└── scheduler.py    # APScheduler jobs
```y
│   ├── positions.py
│   └── ai.py
├── ai/
│   ├── anthropic_client.py   # raw Anthropic SDK wrapper
│   └── runner.py             # skill dispatch
├── core/
│   ├── config.py   # Settings via pydantic-settings
│   └── db.py       # async engine + session factory
├── scheduler.py    # APScheduler jobs
└── main.py         # FastAPI app, router registration, lifespan
```

**Layer rules** (strictly enforced):
1. `fetch/` — HTTP only. Returns plain Python dicts. No DB, no normalization.
2. `normalize/` — Pure transforms. No HTTP, no DB.
3. `ingest/` — DB writes only. Accepts normalized dicts. No HTTP.
4. `api/` — Thin routers. Orchestrate fetch→normalize→ingest or query DB.

## CLS API

Base URL: `https://x-quote.cls.cn`

Default params on every request: `app=CailianpressWeb&os=web&sv=8.4.6`

Default headers: `User-Agent: qinlong-panel/0.2`, `Accept: application/json`

Success check: `response["code"] == 200` (not HTTP status).

See `cls_fetch_guide.md` for all verified endpoints, field mappings, and known issues (e.g. `allstocks` signature problem — use DOM fallback).

## 开发工作流

1. 接到新开发任务时，**先**将任务添加到 `docs/tasks/README.md`，复杂任务拆解为子任务文件 `docs/tasks/<任务名>.md`
2. 查看 `docs/tasks/README.md` 确认当前任务
3. 开发完成后**必须**更新 `docs/tasks/README.md`（勾选已完成项，无需用户提醒）
4. 新增或修改表时，同步更新 `docs/database.md` 和对应迁移文件
5. 架构有大变动时更新本文件（CLAUDE.md）



- Raw SQL via `sqlalchemy.text()` — no ORM mappers.
- All writes use `ON CONFLICT DO UPDATE` (upsert).
- Migrations in `backend/migrations/0*.sql`，按序执行（make migrate 自动处理）。
- 完整表结构见 `docs/database.md`。
- Stock codes: always store both `code` (full: `sh600000`) and `code6` (bare: `600000`).
- 市场字段 market: sh / sz / bj（北交所不再有独立表）。

## Frontend

```
frontend/src/
├── App.tsx                     # Layout + routing (Ant Design Sider + AppDrawer)
├── pages/
│   ├── DashboardPage.tsx       # 全屏主仪表盘（glass morphism 深色风格）
│   ├── MarketPage.tsx          # 涨跌停板独立路由页（4 tab：涨停/连板/炸板/跌停）
│   ├── MarketDetailPage.tsx    # 行情详情（抽屉内）
│   ├── IntelPage.tsx           # 情报（抽屉内）
│   ├── AIMasterPage.tsx        # AI 助手（抽屉内）
│   ├── WatchlistPage.tsx       # 擒龙池（抽屉内）
│   ├── PositionsPage.tsx       # 持仓（抽屉内）
│   ├── SchedulerPage.tsx       # 定时任务（抽屉内）
│   ├── SettingsPage.tsx        # 设置（抽屉内）
│   └── AiPage.tsx              # 旧 AI 页（已弃用）
├── components/
│   ├── AppDrawer.tsx           # 全局右侧抽屉，承载 market/intel/ai/watchlist/positions/scheduler/settings
│   └── dashboard/
│       ├── WeatherBackground.tsx
│       ├── SentimentPanel.tsx  # 情绪温度计（props 驱动）
│       ├── SectorFlowPanel.tsx # 板块资金流（自行 fetch /market/hot-plates）
│       ├── MarketWidthPanel.tsx# 涨跌幅分布+板池（props 驱动）
│       ├── AINewsPanel.tsx     # 财联社电报（mock，待接口）
│       ├── AssetPanel.tsx      # 持仓/自选/净值（自行 fetch /watchlist/ /positions/）
│       └── AIChat.tsx          # AI 对话（调用 POST /ai/chat）
├── context/DrawerContext.tsx   # 全局抽屉状态
├── lib/utils.ts                # cn() tailwind helper
├── api/client.ts               # axios instance (baseURL=/api)
└── types/index.ts              # shared TS interfaces
```

**架构模式**：Dashboard 作为全屏主页，所有辅助功能通过 `AppDrawer` 展示。

**技术栈**：React 18 + TypeScript + Vite + Ant Design 5 (部分组件) + Tailwind CSS + framer-motion + ECharts + Lucide React。

Vite proxies `/api` → `http://localhost:8001`。

## 后端路由表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/market/indices | 指数快照 |
| GET  | /api/market/limit-pool | 涨跌停板池（?pool_type=up/down/consec/up_open&snap_date=YYYY-MM-DD）|
| GET  | /api/market/hot-plates | 热门板块（?plate_type=industry/concept）|
| GET  | /api/watchlist/ | 自选池列表 |
| POST | /api/watchlist/ | 添加自选 |
| GET  | /api/positions/ | 持仓列表 |
| POST | /api/positions/ | 开仓 |
| POST | /api/positions/{id}/close | 平仓 |
| POST | /api/ai/chat | AI 对话（body: {message, agent_id, context}）|
| GET  | /api/ai/skills | AI 技能列表 |
| GET  | /api/settings/providers | AI 提供商列表 |
| GET  | /api/scheduler/jobs | 定时任务列表 |
| POST | /api/scheduler/jobs/{id}/run | 手动触发任务 |
