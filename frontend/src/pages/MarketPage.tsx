import { useEffect, useState } from 'react'
import { Tabs, Table, Typography, Space, Progress } from 'antd'
import axios from 'axios'
import type { LimitStock, LimitPoolResponse } from '../types'
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react'

const { Text } = Typography

const POOL_TABS = [
  { key: 'up',      label: '涨停板', icon: <TrendingUp size={14} className="text-red-500" /> },
  { key: 'consec',  label: '连板池', icon: <Activity size={14} className="text-orange-500" /> },
  { key: 'up_open', label: '炸板池', icon: <Clock size={14} className="text-blue-500" /> },
  { key: 'down',    label: '跌停板', icon: <TrendingDown size={14} className="text-green-500" /> },
]

function LimitTable({ data, poolType }: { data: LimitStock[]; poolType: string }) {
  const isUp = poolType === 'up' || poolType === 'consec'

  const columns = [
    {
      title: '标的信息',
      key: 'stock',
      width: 180,
      render: (_: any, r: LimitStock) => (
        <div className="flex flex-col">
          <span className="font-black text-white">{r.secu_name}</span>
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{r.secu_code}</span>
        </div>
      ),
    },
    {
      title: '最新价',
      dataIndex: 'last_px',
      width: 100,
      render: (v: number) => <span className="font-mono font-black text-white">{v?.toFixed(2)}</span>,
    },
    {
      title: '涨跌幅',
      dataIndex: 'change',
      width: 100,
      render: (v: number) => (
        <span className={`font-mono font-black ${v >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          {v >= 0 ? '+' : ''}{(v * 100).toFixed(2)}%
        </span>
      ),
    },
    ...(isUp ? [{
      title: '连板天数',
      dataIndex: 'limit_days',
      width: 100,
      render: (v: number) => v > 1 ? (
        <div className="flex items-center gap-2">
          <Progress 
            percent={(v / 10) * 100} 
            showInfo={false} 
            size="small" 
            strokeColor={v > 5 ? '#ef4444' : '#f97316'} 
            trailColor="rgba(255,255,255,0.05)"
            className="w-12"
          />
          <span className="text-[10px] font-black text-orange-500">{v}板</span>
        </div>
      ) : <span className="text-slate-600">-</span>,
    }] : []),
    { 
      title: '封板时间', 
      dataIndex: 'limit_time', 
      width: 120,
      render: (v: string) => <span className="font-mono text-slate-400">{v || '--:--'}</span>
    },
    {
      title: '核心概念',
      dataIndex: 'plate_names',
      render: (names: string[]) => (
        <Space size={4} wrap>
          {(names || []).slice(0, 3).map(n => (
            <span key={n} className="text-[9px] px-2 py-0.5 bg-blue-500/5 text-blue-400 border border-blue-500/20 rounded-md font-black italic">
              #{n}
            </span>
          ))}
          {names?.length > 3 && <span className="text-[9px] text-slate-600">+{names.length - 3}</span>}
        </Space>
      ),
    },
    {
      title: '异动原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: (v: string) => <Text className="text-slate-300 text-xs italic">{v || '-'}</Text>,
    },
  ]

  return (
    <Table<LimitStock>
      dataSource={data}
      rowKey="secu_code"
      columns={columns}
      size="small"
      pagination={{ pageSize: 50, showSizeChanger: false, className: 'custom-pagination' }}
      className="mt-4"
    />
  )
}

export default function MarketPage() {
  const [limitPool, setLimitPool] = useState<LimitPoolResponse | null>(null)
  const [activePool, setActivePool] = useState('up')

  useEffect(() => {
    const fetchData = () => {
      axios.get('/api/market/limit-pool').then(r => setLimitPool(r.data))
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const summary = limitPool?.summary
  const data = (limitPool?.data ?? []).filter(d => d.pool_type === activePool)

  const tabItems = POOL_TABS.map(({ key, label, icon }) => ({
    key,
    label: (
      <div className="flex items-center gap-2 px-2">
        {icon}
        <span className="font-black uppercase tracking-widest text-[11px]">{label}</span>
        {summary && (
          <span className={`text-[10px] font-mono font-bold px-1.5 rounded bg-white/5 ${
            key === 'up' || key === 'consec' ? 'text-red-500' : key === 'down' ? 'text-green-500' : 'text-blue-500'
          }`}>
            {summary[key as keyof typeof summary]}
          </span>
        )}
      </div>
    ),
    children: <LimitTable data={data} poolType={key} />,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            Limit <span className="text-blue-500">Tracker</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            实时涨跌停监控系统 · {limitPool?.date || 'Updating...'}
          </Text>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Live Data</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 min-h-[600px]">
        <Tabs
          activeKey={activePool}
          onChange={setActivePool}
          items={tabItems}
          className="market-tabs"
        />
      </div>
    </div>
  )
}
