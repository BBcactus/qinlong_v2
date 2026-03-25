# CLS 数据获取指南

本文件只整理“如何从财联社获取数据”，不绑定当前项目的表设计和 pipeline 实现。

目标：给后续自研重构提供稳定的抓取说明、接口参数、字段含义、已知坑点和推荐落库边界。

## 总览

当前验证过的 CLS 数据来源分两类：

- `x-quote.cls.cn` JSON 接口：优先使用。
- `www.cls.cn` 页面 DOM：仅在接口缺字段、接口报签名错误、或者页面模块没有开放稳定 JSON 接口时作为兜底。

推荐策略：

- 能用 JSON 接口时，不要扫整页文本。
- 页面兜底只做模块级、表格级、tab 级抓取。
- 不要把“基础主数据”和“日行情快照”混在一张表里。
- 不要把“板块主数据”和“个股-板块映射”混在一张表里。

## 通用请求规则

基础域名：

- `https://x-quote.cls.cn`

建议默认参数：

- `app=CailianpressWeb`
- `os=web`
- `sv=8.4.6`

建议请求头：

- `User-Agent: qinlong-panel/0.2`
- `Accept: application/json, text/plain, */*`

说明：

- 部分接口即使不带默认参数也能返回。
- 但不同接口校验强度不一致，建议统一带上。
- 部分接口会返回 `code/msg/data` 结构，判定成功要看 `code == 200`。

## 已验证接口

### 1. 北交所股票列表

接口：

- `GET /quote/xsb/bj_stock_info`

已验证参数：

- `market=bj`
- `deviation_num=9`
- `types=last_px,change,tr,business_balance,mc`
- `way=change`
- `page=1...n`

返回结构：

- `data.index`
- `data.total_num`
- `data.items[]`

关键字段：

- `secu_code`: 例如 `920028.BJ`
- `ori_code`: 例如 `920028`
- `secu_name`
- `last_px`
- `change`
- `tr`
- `business_balance`
- `mc`

推荐映射：

- `code -> bj920028`
- `name -> secu_name`
- `lastPrice -> last_px`
- `pctChg -> change`
- `turnoverRate -> tr`
- `floatMarketCap -> mc`
- `mainNetInflow -> business_balance`

注意：

- `secu_code` 是 `920028.BJ` 这种形式，规范化时要转成 `bj920028`。

### 2. 热门板块列表

接口：

- `GET /web_quote/plate/hot_plate`

已验证参数：

- `type=industry`
- `type=concept`
- `type=area`

返回结构：

- `data[]`

关键字段：

- `secu_code`
- `secu_name`
- `change`
- `main_fund_diff`
- `up_stock[]`

`up_stock` 子字段：

- `secu_code`
- `secu_name`
- `change`

推荐映射：

- `plateCode -> secu_code`
- `plateName -> secu_name`
- `plateType -> industry | concept | region`
- `pctChg -> change`
- `fundFlow -> main_fund_diff`
- `leaderName -> up_stock[0].secu_name`
- `leaderPctChg -> up_stock[0].change`

类型规则：

- `area` 统一映射成 `region`

### 3. 板块详情

接口：

- `GET /web_quote/plate/info`

已验证参数：

- `secu_code=cls82337`

返回结构：

- `data` 为对象

关键字段：

- `secu_name`
- `secu_code`
- `plate_tag`
- `desc`
- `change`
- `fundflow`
- `limit_up_num`
- `limit_down_num`
- `up_num`
- `down_num`

推荐用途：

- 板块主数据
- 板块统计信息
- 板块简介信息

### 4. 板块成分股

接口：

- `GET /web_quote/plate/stocks`

已验证参数：

- `secu_code=cls82337`
- `page=1...n`

返回结构：

- `data.has_core`
- `data.stocks[]`

关键字段：

- `secu_code`
- `secu_name`
- `assoc_desc`
- `head_num`
- `change`
- `cmc`
- `last_px`
- `fundflow`

推荐映射：

- `code -> sh/sz/bj + code6`
- `name -> secu_name`
- `lastPrice -> last_px`
- `pctChg -> change`
- `leaderTimes -> head_num`
- `floatMarketCap -> cmc`
- `fundFlow -> fundflow`
- `profile -> assoc_desc`

### 5. 市场宽度 / 指数首页

接口：

- `GET /quote/index/home`

返回结构：

- `data.index_quote[]`
- `data.up_down_dis`
- `data.listed_today`
- `data.purchase_today`

`index_quote[]` 已验证字段：

- `secu_code`
- `secu_name`
- `last_px`
- `change`
- `change_px`
- `up_num`
- `down_num`
- `flat_num`

`up_down_dis` 已验证字段：

- `rise_num`
- `fall_num`
- `flat_num`
- `up_2`
- `up_4`
- `up_6`
- `up_8`
- `up_10`
- `down_2`
- `down_4`
- `down_6`
- `down_8`
- `down_10`
- `suspend_num`

推荐用途：

- 市场涨跌家数
- 区间分布桶
- 六大指数快照

已验证六个目标指数代码：

- `sh000001` 上证指数
- `sz399001` 深证成指
- `sz399006` 创业板指
- `sh000016` 上证50
- `sh000300` 沪深300
- `sh000905` 中证500

### 6. 指数分钟线 / 收盘快照

接口：

- `GET /quote/index/tlines`

已验证参数：

- `secu_codes=sh000001,sz399001,sz399006,sh000300,sh000016,sh000905`

返回结构：

- `data.sh000001`
- `data.sz399001`
- ...

每个指数对象结构：

- `date`
- `line[]`

`line[]` 已验证字段：

- `minute`
- `change`
- `last_px`

推荐用途：

- 获取交易日
- 获取最后一分钟的 `last_px/change`
- 当首页指数对象不给完整时间线时补收盘快照

### 7. 新闻首页标题

页面：

- `https://www.cls.cn/`

当前实现方式：

- Playwright 提取首页链接标题

推荐用途：

- 当没有更稳定新闻 JSON 接口时，做 headline 临时补充

## 已知问题与坑点

### 1. `allstocks` 接口签名问题

接口：

- `GET /web_quote/web_stock/stock_list`

理论参数：

- `market=all`
- `rever=1`
- `types=last_px,change,tr,main_fund_diff,cmc,trade_status`
- `way=change`
- `page=1...n`

当前环境实测返回：

- `code=9030`
- `msg=签名验证失败`

这意味着：

- 不能把这个接口当作当前环境下稳定可用主源。
- 如果你要继续研究，需要单独逆向其签名规则。

当前可行兜底：

- 页面 `https://www.cls.cn/allstocks`
- 定点抓表格行，而不是整页文本粗提取。

### 2. 页面兜底不要扫整页 `body_text`

尤其以下两页：

- `https://www.cls.cn/quotation`
- `https://www.cls.cn/finance`

问题：

- 整页文本会混入无关内容。
- 容易把新闻、页脚、广告文本误识别成统计数据。

推荐：

- `quotation` 只抓“分布模块”或指定数据模块。
- `finance` 只抓“市场温度 / 市场风向标 / 四池 tab”。

### 3. 板块类型不要靠中文名硬猜为主

如果接口返回 `type` 或 `plate_tag`，优先用接口字段。

仅在 fallback 时，才对中文名称做启发式判断：

- `industry`
- `concept`
- `region`

### 4. 不同层的数据不要混表

建议明确区分：

- 股票基础主数据
- 股票日快照
- 板块主数据
- 个股板块映射
- 板块日资金流

不要再把“板块快照字段”和“个股板块映射关系”混在同一张表里。

## 推荐落库边界

### 股票基础主数据

建议字段：

- `code`
- `code6`
- `stock_name`
- `exchange`
- `listed_date`
- `status`
- `company_profile`

来源建议：

- CLS 股票列表 + 本地补充源

### 股票日快照

建议字段：

- `trade_date`
- `snapshot_time`
- `code`
- `code6`
- `stock_name`
- `exchange`
- `last_price`
- `pct_chg`
- `turnover_rate`
- `float_market_cap`
- `main_net_inflow`

来源建议：

- `allstocks` 若能解签名则优先
- 当前环境可先用 `allstocks` 页面定点抓取
- 北交所补 `bj_stock_info`

### 板块主数据

建议字段：

- `trade_date`
- `snapshot_time`
- `sector_code`
- `sector_name`
- `sector_type`
- `pct_chg`
- `fund_flow`
- `leader_name`
- `leader_pct_chg`
- `up_count`
- `down_count`
- `flat_count`

来源建议：

- `hot_plate`
- `plate/info`

### 个股板块映射

建议字段：

- `trade_date`
- `code`
- `code6`
- `stock_name`
- `exchange`
- `sector_type`
- `sector_code`
- `sector_name`

推荐结构：

- 长表优于宽表

说明：

- 用 `sector_type in ('industry','concept','region')` 即可表达三种映射
- 更适合筛选、统计、连表和扩展

### 板块资金流

建议字段：

- `trade_date`
- `sector_code`
- `sector_name`
- `sector_type`
- `inflow`
- `outflow`
- `net_inflow`

来源建议：

- `hot_plate.main_fund_diff`
- 当前先写 `net_inflow`

## 推荐开发顺序

1. 先把 CLS 获取器单独抽成纯抓取模块，不直接写数据库。
2. 每个函数只做一类数据输出，不混模型。
3. 先把返回字段统一成 Python 原生对象，再交给标准化层写库。
4. 优先完成：`bjstock / hotplate / plate_info / plate_stocks / index_home / index_tlines`。
5. `allstocks` 签名问题未解前，先接受 DOM 定点兜底。
6. 最后再接 pipeline 和前端页面。

## 当前代码参考

如果你想直接参考当前抓取实现，主要在：

- [cls_fetch.py](/Users/jamesavery/Documents/Projects/active/qinlong-panel/backend/src/app/services/cls_fetch.py)

这份代码现在已经把：

- JSON 接口请求
- 北交所抓取
- 板块列表抓取
- 板块成分股抓取
- 宽度/指数抓取
- finance 页面定点抓取

都整理到一个地方了，适合你自己抽离重做。
