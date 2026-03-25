# GEMINI.md

This file serves as a mandate for Gemini CLI when working on the **Qinlong v2** project. It outlines the project's purpose, technical stack, architecture, and development standards.

## Project Overview

**Qinlong v2 (擒龙 v2)** is a quantitative trading console for Chinese A-shares (specifically focusing on BJ/North Exchange). It is a complete rewrite of a previous panel, utilizing **财联社 (Cailianshe/CLS)** as its primary data source.

- **Primary Objective:** Real-time market monitoring, AI-assisted analysis, and quantitative trading signals.
- **Target Market:** Chinese A-shares (SH, SZ, BJ).
- **Core Technology:** Python backend with FastAPI and a React frontend with Ant Design.

## Technical Stack

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Database:** PostgreSQL 15+ (with `asyncpg`)
- **ORM/Query:** SQLAlchemy 2.0 (Async, raw SQL preferred)
- **Networking:** `httpx` (Async)
- **Scheduling:** `APScheduler`
- **AI Integration:** Anthropic Claude (via SDK)
- **Package Manager:** `uv`

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Components:** Ant Design 5 (Chinese Locale)
- **Styling:** TailwindCSS + Vanilla CSS
- **Charts:** ECharts (via `echarts-for-react`)
- **Package Manager:** `npm`

## Core Commands

| Action | Command |
| :--- | :--- |
| **Install All** | `make install` |
| **Install Backend** | `make install-backend` |
| **Install Frontend** | `make install-frontend` |
| **Run Backend** | `make dev-backend` (Port 8000) |
| **Run Frontend** | `make dev-frontend` (Port 5173, proxies `/api` to 8000) |
| **DB Migrations** | `make migrate` (Applies `backend/migrations/*.sql`) |
| **Format Code** | `make fmt` (Ruff) |
| **Lint Code** | `make lint` (Ruff) |

## Architecture & Layering Rules

The backend strictly follows a decoupled architectural pattern to ensure clean data flow:

1.  **`fetch/` (HTTP Layer):** Pure HTTP fetchers. Return raw Python dicts. **No DB access, no data normalization.**
2.  **`normalize/` (Data Layer):** Pure transformation functions. Convert raw dicts into typed structures. **No I/O (no HTTP, no DB).**
3.  **`ingest/` (Persistence Layer):** Writes normalized data to the database. **No HTTP calls.**
4.  **`api/` (Router Layer):** Thin FastAPI routers. Orchestrate the flow: `fetch` → `normalize` → `ingest`.

### Key Data Standards
- **Stock Codes:** Always store both `code` (e.g., `sh600000`) and `code6` (e.g., `600000`).
- **Market Identifiers:** `sh`, `sz`, `bj`.
- **SQL Usage:** Prefer raw SQL via `sqlalchemy.text()` with `ON CONFLICT DO UPDATE` (upsert) for all market data ingestion.

## Development Workflow

1.  **Task Management:** Document every new task in `docs/tasks/README.md`. Use individual files in `docs/tasks/` for complex features.
2.  **Documentation First:** Update `docs/database.md` for any schema changes before running migrations.
3.  **Language:** UI and documentation are primarily in **Chinese**. Ensure all user-facing strings in the frontend follow this.
4.  **Code Quality:** Always run `make fmt` and `make lint` before finishing a task.

## Key Files & Directories
- `backend/migrations/`: Sequential SQL migration files (`001_...`, `002_...`).
- `backend/src/app/main.py`: Entry point for the FastAPI application.
- `frontend/src/api/client.ts`: Shared Axios instance for backend communication.
- `cls_fetch_guide.md`: Detailed documentation on Cailianshe API endpoints and field mappings.
