# Qinlong v2

Qinlong v2 是一个面向 A 股短线交易场景的量化终端重构项目，聚焦行情浏览、板块跟踪、持仓管理、调度任务与 AI 辅助分析。当前项目采用前后端分离架构，前端提供交易终端式界面，后端负责行情抓取、数据规范化、入库与 API 服务。

## 项目特性

- 全屏仪表盘主页，支持抽屉式辅助功能页面
- 涨停 / 跌停 / 连板 / 炸板等行情池展示
- 热门板块、市场宽度、情绪面板等可视化模块
- 自选池、持仓、定时任务等业务模块
- AI 对话接口与提供商配置能力
- FastAPI + React + TypeScript 的前后端分离架构

## 项目截图

> 你可以将项目截图放到 `docs/screenshots/` 目录，并替换下面的占位链接。

| 仪表盘主页 | 行情页 |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Market](docs/screenshots/market.png) |

## 快速开始

如果你只想尽快把项目跑起来，可以直接执行下面这几步：

```bash
cp backend/.env.example backend/.env
make install
make migrate
make dev-backend
```

新开一个终端后，再启动前端：

```bash
make dev-frontend
```

启动后：

- 前端默认地址：`http://localhost:5173`
- 后端默认地址：`http://localhost:8000`

## 技术栈

### 前端

- React 18
- TypeScript
- Vite
- Ant Design 5
- Tailwind CSS
- Framer Motion
- ECharts
- Axios

### 后端

- Python 3.12+
- FastAPI
- SQLAlchemy Async
- asyncpg
- APScheduler
- httpx
- pydantic-settings
- OpenAI SDK 兼容接口

### 数据与运行环境

- PostgreSQL 15+
- uv 管理后端依赖
- npm 管理前端依赖

## 目录结构

```text
qinlong_v2/
├── backend/                 # FastAPI 后端、迁移脚本、抓取与入库逻辑
├── frontend/                # React 前端项目
├── docs/                    # 数据库与任务文档
├── cls_fetch_guide.md       # 财联社接口说明
├── Makefile                 # 常用开发命令
└── AGENTS.md                # 项目开发约束与架构说明
```

## 核心架构

后端按职责拆分为四层：

- `fetch/`：只负责 HTTP 抓取，返回原始数据
- `normalize/`：只负责纯数据转换
- `ingest/`：只负责数据库写入
- `api/`：只负责接口编排与对外返回

前端采用 Dashboard 主页 + `AppDrawer` 抽屉式功能页模式，主要页面位于 `frontend/src/pages`，可复用模块位于 `frontend/src/components`。

## 已实现的主要接口

- `GET /api/market/indices`：指数快照
- `GET /api/market/limit-pool`：涨跌停板池
- `GET /api/market/hot-plates`：热门板块
- `GET /api/watchlist/`：自选池列表
- `POST /api/watchlist/`：添加自选
- `GET /api/positions/`：持仓列表
- `POST /api/positions/`：开仓
- `POST /api/positions/{id}/close`：平仓
- `POST /api/ai/chat`：AI 对话
- `GET /api/ai/skills`：AI 技能列表
- `GET /api/settings/providers`：AI 提供商列表
- `GET /api/scheduler/jobs`：定时任务列表
- `POST /api/scheduler/jobs/{id}/run`：手动执行任务

## API 示例请求 / 响应

### 1. 获取涨跌停板池

请求：

```bash
curl "http://localhost:8000/api/market/limit-pool?pool_type=up"
```

响应示例：

```json
{
  "summary": {
    "pool_type": "up",
    "snap_date": "2026-03-25",
    "total": 42
  },
  "items": [
    {
      "code": "sh600000",
      "code6": "600000",
      "name": "示例个股",
      "latest_price": 12.34,
      "change_percent": 10.01,
      "reason": "机器人",
      "plate": "人工智能"
    }
  ]
}
```

### 2. 获取热门板块

请求：

```bash
curl "http://localhost:8000/api/market/hot-plates?plate_type=concept"
```

响应示例：

```json
[
  {
    "plate_code": "GN001",
    "plate_name": "算力",
    "change_percent": 4.82,
    "leading_stock": "示例科技"
  }
]
```

### 3. AI 对话

请求：

```bash
curl -X POST "http://localhost:8000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "帮我分析今天早盘的主线题材",
    "agent_id": "market-analyst",
    "context": {
      "scene": "dashboard"
    }
  }'
```

响应示例：

```json
{
  "reply": "今天早盘资金主要围绕算力、机器人和低空经济展开，算力方向强度最高。",
  "provider": "openai",
  "model": "gpt-4o"
}
```

## 环境准备

请先确保你的本地环境具备：

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- `uv`
- `npm`

## 安装依赖

### 一键安装

```bash
make install
```

### 分别安装

```bash
make install-backend
make install-frontend
```

## 环境变量

先复制后端环境变量模板：

```bash
cp backend/.env.example backend/.env
```

你至少需要配置：

- `DATABASE_URL`
- `OPENAI_API_KEY`

可选配置包括：

- `DEFAULT_AI_PROVIDER`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `SECONDARY_AI_BASE_URL`
- `SECONDARY_AI_API_KEY`
- `SECONDARY_AI_MODEL`
- `CLS_BASE_URL`
- `CLS_USER_AGENT`
- `DEBUG`
- `CORS_ORIGINS`

如果你使用默认前端开发地址，`CORS_ORIGINS` 可保持模板中的默认值。

## 数据库迁移

执行全部迁移：

```bash
make migrate
```

这个命令会按顺序执行 `backend/migrations/0*.sql`。

## 本地开发

### 启动后端

```bash
make dev-backend
```

默认启动地址：`http://localhost:8000`

### 启动前端

```bash
make dev-frontend
```

默认启动地址通常为：`http://localhost:5173`

前端会将 `/api` 请求代理到本地后端。

## 部署说明

当前项目更适合按前后端分开部署：

### 前端部署

你可以将前端部署到静态站点平台，例如 Vercel、Netlify 或自托管 Nginx。

构建命令：

```bash
cd frontend && npm run build
```

构建产物目录：

```text
frontend/dist
```

部署时需要确保前端请求的 `/api` 能正确转发到后端服务地址。

### 后端部署

后端是标准 FastAPI 应用，可部署到云服务器、容器环境或 PaaS 平台。

示例启动命令：

```bash
cd backend && uv run uvicorn src.app.main:app --host 0.0.0.0 --port 8000
```

部署前请确保：

- PostgreSQL 已可访问
- `backend/.env` 已正确配置
- 已执行数据库迁移
- 反向代理或网关已放行 API 路由

### 生产建议

- 使用独立数据库实例
- 通过反向代理统一前后端域名
- 将敏感环境变量交给部署平台管理
- 为调度任务与 AI 接口增加日志和监控

## 代码质量

### 后端格式化

```bash
make fmt
```

### 后端检查

```bash
make lint
```

### 前端构建验证

```bash
cd frontend && npm run build
```

## 开发说明

- 数据抓取来源以财联社接口为主
- 股票代码同时保存完整代码 `code` 与 6 位代码 `code6`
- 市场字段统一为 `sh / sz / bj`
- 数据写入采用 upsert 策略
- 详细数据库结构见 `docs/database.md`
- 详细开发约束见 `AGENTS.md`

## 后续方向

当前仓库已经具备行情终端、AI 接口、自选池、持仓与调度的基础能力，后续可继续补全：

- 市场宽度写入与 API
- 个股搜索与详情页
- 板块榜单与成分股页面
- 历史行情与分时数据
- AI 助手的更完整交互能力

## License

当前仓库未单独声明 License，如需开源发布，建议补充对应许可证文件。
