# 数据库表结构文档

数据库：`qinlong_v2`（PostgreSQL 15+）

> 所有表结构变更须同步更新本文档。

---

## 股票主数据

### `stock_master` — 全市场个股主数据（沪深北）

| 字段 | 类型 | 说明 |
|---|---|---|
| code | TEXT PK | 证券代码，含交易所前缀，如 sh600000 / sz000001 / bj830001 |
| code6 | TEXT | 6位纯数字代码，如 600000 |
| stock_name | TEXT | 股票名称 |
| exchange | TEXT | 交易所（旧字段，与 market 重复，待清理） |
| market | TEXT | 交易所：sh / sz / bj |
| status | TEXT | 上市状态：listed / delisted |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

### `stock_daily_snapshot` — 全市场个股每日行情快照

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| code | TEXT | 证券代码，含交易所前缀 |
| snap_date | DATE | 快照日期 |
| last_px | NUMERIC | 最新价（元） |
| change | NUMERIC | 涨跌幅，小数格式，如 0.05 = 5% |
| cmc | NUMERIC | 流通市值（元） |
| tr | NUMERIC | 换手率 |
| main_fund_diff | NUMERIC | 主力净流入（元）；北交所用成交额替代 |
| trade_status | TEXT | 交易状态：normal / suspended 等 |
| market | TEXT | 交易所：sh / sz / bj |
| snapped_at | TIMESTAMPTZ | 数据抓取时间戳 |

唯一约束：`(code, snap_date)`

---

## 指数

### `index_daily_snapshot` — 主要指数每日快照

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| secu_code | TEXT | 指数代码，如 sh000001 |
| secu_name | TEXT | 指数名称 |
| snap_date | DATE | 快照日期 |
| last_px | NUMERIC | 最新点位 |
| change | NUMERIC | 涨跌幅 |
| change_px | NUMERIC | 涨跌点数 |
| up_num | INT | 上涨家数 |
| down_num | INT | 下跌家数 |
| flat_num | INT | 平盘家数 |

唯一约束：`(secu_code, snap_date)`

---

## 板块

### `plate_master` — 板块主数据

| 字段 | 类型 | 说明 |
|---|---|---|
| plate_code | TEXT PK | 板块代码，如 cls80173 |
| plate_name | TEXT | 板块名称 |
| plate_type | TEXT | 类型：industry（行业）/ concept（概念）/ area（地域） |
| plate_type_label | TEXT | 类型中文标签 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

### `plate_snapshot` — 板块行情快照

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| plate_code | TEXT | 板块代码 |
| snap_date | DATE | 快照日期 |
| change_rate | NUMERIC | 涨跌幅 |
| main_inflow | NUMERIC | 主力净流入（元） |
| main_inflow_rate | NUMERIC | 主力净流入占比 |
| leading_stock | TEXT | 领涨股名称 |
| leading_stock_code | TEXT | 领涨股代码 |
| snapped_at | TIMESTAMPTZ | 数据抓取时间戳 |

### `plate_daily_snapshot` — 板块每日结构化快照

### `plate_stock_map` — 板块成分股映射

| 字段 | 类型 | 说明 |
|---|---|---|
| plate_code | TEXT | 板块代码 |
| stock_code | TEXT | 成分股证券代码 |
| stock_name | TEXT | 成分股名称 |

唯一约束：`(plate_code, stock_code)`

---

## 涨跌停

### `limit_stock_snapshot` — 涨跌停/连板/炸板统一快照

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| snap_date | DATE | 快照日期 |
| pool_type | TEXT | 池类型：up（涨停）/ down（跌停）/ consec（连板）/ up_open（炸板） |
| secu_code | TEXT | 证券代码 |
| secu_name | TEXT | 股票名称 |
| last_px | NUMERIC | 最新价（元） |
| change | NUMERIC | 涨跌幅 |
| limit_time | TEXT | 封板时间 |
| reason | TEXT | 涨/跌停原因标题 |
| reason_detail | TEXT | 原因详情 |
| plate_codes | TEXT[] | 所属板块代码数组 |
| plate_names | TEXT[] | 所属板块名称数组 |
| is_st | BOOLEAN | 是否ST股 |
| limit_days | INT | 连续涨/跌停天数（默认1） |
| snapped_at | TIMESTAMPTZ | 数据抓取时间戳 |

唯一约束：`(snap_date, pool_type, secu_code)`

---

## 市场宽度

### `market_breadth_snapshot` — 市场情绪结构化快照

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGSERIAL PK | 自增主键 |
| snap_date | DATE | 快照日期 |
| snapped_at | TIMESTAMPTZ | 抓取时间戳 |
| limit_up_count | INT | 涨停家数 |
| limit_down_count | INT | 跌停家数 |
| broken_board_count | INT | 炸板家数 |
| consecutive_board | INT | 连板家数 |
| market_temperature | NUMERIC | 市场情绪温度 |
| limit_up_pool | JSONB | 涨停池原始数据 |
| limit_down_pool | JSONB | 跌停池原始数据 |
| broken_board_pool | JSONB | 炸板池原始数据 |
| consec_board_pool | JSONB | 连板池原始数据 |
| raw_payload | JSONB | 原始抓取元数据 |

---

## 持仓

### `position` — 持仓记录

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| code | TEXT | 证券代码，含交易所前缀 |
| code6 | TEXT | 6位纯数字代码 |
| stock_name | TEXT | 股票名称 |
| buy_date | DATE | 买入日期 |
| buy_price | NUMERIC | 买入价（元） |
| quantity | INT | 持仓数量（股） |
| cost_basis | NUMERIC | 成本价（含手续费摊销） |
| status | TEXT | 状态：holding / closed |
| note | TEXT | 备注 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

### `position_history` — 交易操作记录

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| position_id | INT | 关联持仓ID |
| action | TEXT | 操作类型：buy / sell / add / reduce |
| price | NUMERIC | 成交价（元） |
| quantity | INT | 成交数量（股） |
| trade_date | DATE | 交易日期 |
| note | TEXT | 备注 |
| created_at | TIMESTAMPTZ | 创建时间 |

### `watchlist` — 自选股

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| code | TEXT | 证券代码，含交易所前缀 |
| code6 | TEXT | 6位纯数字代码 |
| stock_name | TEXT | 股票名称 |
| add_date | DATE | 加入自选日期 |
| note | TEXT | 备注 |
| status | TEXT | 状态：active / removed |
| tags | TEXT[] | 标签数组 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

---

## AI

### `ai_provider` — AI服务提供商配置

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| name | TEXT | 提供商名称，如 anthropic |
| base_url | TEXT | API基础URL |
| api_key_env | TEXT | API Key 环境变量名 |
| api_key | TEXT | API Key 明文（可选） |
| model_id | TEXT | 默认模型ID |
| is_default | BOOLEAN | 是否默认提供商 |

### `ai_skill` — AI技能定义

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| name | TEXT | 技能名称 |
| description | TEXT | 技能描述 |
| system_prompt | TEXT | 系统提示词 |
| provider_id | INT | 关联提供商ID |
| temperature | NUMERIC | 生成温度 |
| max_tokens | INT | 最大输出Token数 |
| enabled | BOOLEAN | 是否启用 |

### `ai_agent` — AI智能体配置

| 字段 | 类型 | 说明 |
|---|---|---|
| id | SERIAL PK | 自增主键 |
| name | TEXT | 智能体名称 |
| description | TEXT | 描述 |
| provider_id | INT | 关联提供商ID |
| skill_id | INT | 关联技能ID |
| system_prompt | TEXT | 覆盖系统提示词 |
| temperature | NUMERIC | 生成温度 |
| max_tokens | INT | 最大输出Token数 |
| enabled | BOOLEAN | 是否启用 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

---

## 变更历史

| 迁移文件 | 说明 |
|---|---|
| 001_init.sql | 初始表结构 |
| 003_market_data.sql | 市场数据表 |
| 004_unified_market.sql | 统一市场数据命名 |
| 005_limit_pool_unified.sql | 涨跌停统一四池表 |
