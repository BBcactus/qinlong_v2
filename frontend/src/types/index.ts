export interface Stock {
  code: string
  code6: string
  stock_name: string
  last_px: number
  change: number
  change_pct: number
  business_balance: number
  mc: number
  tr: number
}

export interface Plate {
  code: string
  name: string
  plate_type: 'industry' | 'concept' | 'area'
  change_pct: number
  lead_stock_name: string
  stock_num: number
}

export interface IndexSnapshot {
  code: string
  name: string
  last_px: number
  change: number
  change_pct: number
}

export interface WatchlistItem {
  id: number
  code: string
  code6: string
  stock_name: string
  add_date: string
  note: string
  status: string
  tags: string
}

export interface Position {
  id: number
  code: string
  code6: string
  stock_name: string
  buy_date: string
  buy_price: number
  quantity: number
  cost_basis: number
  status: 'open' | 'closed'
  note: string
}

export interface LimitStock {
  secu_code: string
  secu_name: string
  last_px: number
  change: number
  limit_time: string
  reason: string
  reason_detail: string
  plate_codes: string[]
  plate_names: string[]
  is_st: boolean
  limit_days: number
  pool_type: 'up' | 'down' | 'consec' | 'up_open'
}

export interface LimitPoolSummary {
  up: number
  down: number
  consec: number
  up_open: number
}

export interface LimitPoolResponse {
  date: string
  summary: LimitPoolSummary
  data: LimitStock[]
}


export interface ApiResponse<T> {
  data: T
  code?: number
  msg?: string
}
