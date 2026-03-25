import { useEffect, useState } from 'react'
import { Tabs, Progress } from 'antd'
import ReactECharts from 'echarts-for-react'
import { TrendingUp, TrendingDown, Activity, Clock, RefreshCw } from 'lucide-react'
import api from '../api/client'
import type { LimitStock, LimitPoolResponse } from '../types'

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
      render: (_: unknown, r: LimitStock) => (
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
            style={{ width: 60 }}
          />
          <span className="font-mono font-black text-orange-400">{v}板</span>
        </div>
      ) : <span className="text-slate-500 text-xs">首板</span>,
    }] : []),
    {
      title: '原因',
      dataIndex: 'reason',
      render: (v: string) => <span className="text-[11px] text-slate-400">{v || '-'}</span>,
    },
  ]

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/5">
          {columns.map(c => (
            <th key={c.key ?? String(c.dataIndex)} className="text-left py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-500" style={{ width: c.width }}>{c.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b border-white/3 hover:bg-white/3 transition-colors">
            {columns.map(c => (
              <td key={c.key ?? String(c.dataIndex)} className="py-3 pr-4">
                {'render' in c && c.render
                  ? c.render((row as unknown as Record<string, unknown>)[c.dataIndex as string] as never, row)
                  : String((row as unknown as Record<string, unknown>)[c.dataIndex as string] ?? '-')}
              </td>
            ))}
          </tr>
        ))}
        {data.length === 0 && (
          <tr><td colSpan={columns.length} className="text-center py-10 text-slate-600 text-xs">暂无数据</td></tr>
        )}
      </tbody>
    </table>
  )
}

export default function MarketDetailPage() {
  const [limitPool, setLimitPool] = useState<LimitPoolResponse | null>(null)
  const [activePool, setActivePool] = useState('up')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await api.get('/market/limit-pool')
      setLimitPool(r.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const summary = limitPool?.summary ?? { up: 0, down: 0, consec: 0, up_open: 0 }
  const data = limitPool?.data ?? []

  const filteredData: Record<string, LimitStock[]> = {
    up: data.filter(s => s.pool_type === 'up' || (!s.pool_type && (s.change ?? 0) > 0)),
    consec: data.filter(s => (s.limit_days ?? 0) >= 2),
    up_open: data.filter(s => s.pool_type === 'up_open'),
    down: data.filter(s => s.pool_type === 'down' || (!s.pool_type && (s.change ?? 0) < 0)),
  }

  // Distribution chart: group stocks by change% buckets
  const buckets = [
    { label: '跌停', range: [-Infinity, -0.099], color: '#22c55e' },
    { label: '-9%~-5%', range: [-0.099, -0.05], color: '#4ade80' },
    { label: '-5%~0%', range: [-0.05, 0], color: '#86efac' },
    { label: '0%~5%', range: [0, 0.05], color: '#fca5a5' },
    { label: '5%~9%', range: [0.05, 0.099], color: '#f87171' },
    { label: '涨停', range: [0.099, Infinity], color: '#ef4444' },
  ]

  const bucketCounts = buckets.map(b => {
    const count = data.filter(s => {
      const c = s.change ?? 0
      return c > b.range[0] && c <= b.range[1]
    }).length
    return { ...b, count }
  })

  // Use summary for limit counts when data is sparse
  bucketCounts[0].count = bucketCounts[0].count || summary.down
  bucketCounts[5].count = bucketCounts[5].count || summary.up

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { top: 20, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: bucketCounts.map(b => b.label),
      axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    },
    series: [{
      type: 'bar',
      data: bucketCounts.map(b => ({
        value: b.count,
        itemStyle: { color: b.color, borderRadius: [4, 4, 0, 0] },
      })),
      barMaxWidth: 60,
    }],
    tooltip: {
      backgroundColor: 'rgba(2,6,23,0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontWeight: 'bold' },
    },
  }

  const tabItems = POOL_TABS.map(({ key, label, icon }) => ({
    key,
    label: (
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-black text-xs uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-mono font-black ${
          key === 'up' || key === 'consec' ? 'text-red-500' : key === 'down' ? 'text-green-500' : 'text-blue-500'
        }`}>
          {key === 'up' ? summary.up : key === 'consec' ? summary.consec : key === 'up_open' ? summary.up_open : summary.down}
        </span>
      </div>
    ),
    children: (
      <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
        <LimitTable data={filteredData[key] ?? []} poolType={key} />
      </div>
    ),
  }))

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            行情 <span className="text-blue-500">详情</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">涨跌分布 · 涨停连板炸板 · 实时监控</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      {/* Top 1/3: Distribution Chart */}
      <div className="glass-card p-5" style={{ flex: '0 0 33%', minHeight: 200 }}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">涨跌分布</div>
        <ReactECharts option={chartOption} style={{ height: 160 }} />
      </div>

      {/* Bottom 2/3: Four pool tabs */}
      <div className="glass-card p-5 flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs
          activeKey={activePool}
          onChange={setActivePool}
          items={tabItems}
          className="market-tabs h-full flex flex-col"
        />
      </div>
    </div>
  )
}
