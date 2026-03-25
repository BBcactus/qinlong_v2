import { useEffect, useState } from 'react'
import api from '../api/client'
import { WeatherBackground } from '../components/dashboard/WeatherBackground'
import { SentimentPanel } from '../components/dashboard/SentimentPanel'
import { SectorFlowPanel } from '../components/dashboard/SectorFlowPanel'
import { MarketWidthPanel } from '../components/dashboard/MarketWidthPanel'
import { AINewsPanel } from '../components/dashboard/AINewsPanel'
import { AssetPanel } from '../components/dashboard/AssetPanel'
import { AIChat } from '../components/dashboard/AIChat'
import { AppDrawer } from '../components/AppDrawer'
import { useDrawer } from '../context/DrawerContext'
import { Menu } from 'lucide-react'

interface IndexRow {
  secu_code: string
  secu_name: string
  snap_date: string
  last_px: number | null
  change: number | null
  change_px: number | null
  up_num: number | null
  down_num: number | null
  flat_num: number | null
}

interface LimitSummary {
  up: number
  down: number
  consec: number
  up_open: number
}

interface LimitStock {
  secu_code: string
  secu_name: string
  last_px: number | null
  change: number | null
  limit_days: number | null
}

interface BreadthRow {
  up_num: number
  down_num: number
  rise_num: number
  fall_num: number
  flat_num: number
}

export default function DashboardPage() {
  const [indices, setIndices] = useState<IndexRow[]>([])
  const [limitSummary, setLimitSummary] = useState<LimitSummary>({ up: 0, down: 0, consec: 0, up_open: 0 })
  const [limitStocks, setLimitStocks] = useState<LimitStock[]>([])
  const [breadth, setBreadth] = useState<BreadthRow | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [indicesRes, limitRes, breadthRes] = await Promise.allSettled([
        api.get('/market/indices'),
        api.get('/market/limit-pool'),
        api.get('/market/breadth'),
      ])
      if (indicesRes.status === 'fulfilled') {
        setIndices(indicesRes.value.data.data ?? [])
      }
      if (limitRes.status === 'fulfilled') {
        setLimitSummary(limitRes.value.data.summary ?? { up: 0, down: 0, consec: 0, up_open: 0 })
        setLimitStocks(limitRes.value.data.data ?? [])
      }
      if (breadthRes.status === 'fulfilled' && breadthRes.value.data.data) {
        setBreadth(breadthRes.value.data.data)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const { openDrawer } = useDrawer()

  const temperature = (() => {
    if (indices.length === 0) return 50
    const sh = indices.find(i => i.secu_code === 'sh000001')
    if (!sh?.change) return 50
    return Math.max(0, Math.min(100, 50 + (sh.change * 50)))
  })()

  const topLimitStocks = limitStocks.slice(0, 10)

  const limitUpCount = breadth?.up_num ?? limitSummary.up
  const limitDownCount = breadth?.down_num ?? limitSummary.down
  const upCount = breadth?.rise_num ?? 0
  const downCount = breadth?.fall_num ?? 0

  return (
    <div className="relative flex flex-col min-h-screen font-sans text-slate-100">
      <WeatherBackground temperature={temperature} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/30">
            擒
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wider text-gradient-red">擒龙系统</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase">A股短线量化终端</div>
          </div>
        </div>

        {/* Index Ticker */}
        <div className="flex items-center gap-6">
          {(['sh000001','sz399001','sz399006','sh000688','sh000300','sh000905'] as const)
            .map(code => indices.find(i => i.secu_code === code))
            .filter(Boolean)
            .map(idx => idx && (
            <div key={idx.secu_code} className="text-center">
              <div className="text-[10px] text-slate-500 mb-0.5">{idx.secu_name}</div>
              <div className={`text-sm font-mono font-semibold ${
                (idx.change ?? 0) >= 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {idx.last_px?.toFixed(2)}
                <span className="ml-1 text-[9px]">
                  {(idx.change ?? 0) >= 0 ? '+' : ''}{((idx.change ?? 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">涨停</span>
            <span className="text-red-400 font-semibold">{limitUpCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">跌停</span>
            <span className="text-green-400 font-semibold">{limitDownCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">连板</span>
            <span className="text-orange-400 font-semibold">{limitSummary.consec}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">上涨</span>
            <span className="text-red-400 font-semibold">{upCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">下跌</span>
            <span className="text-green-400 font-semibold">{downCount}</span>
          </div>
          <button
            onClick={() => openDrawer('market')}
            className="ml-4 w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
            title="打开面板"
          >
            <Menu size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-4 p-4 pb-20">
        {/* Sentiment Hero — full width */}
        <div className="col-span-12">
          <SentimentPanel
            temperature={temperature}
            limitUp={limitUpCount}
            limitDown={limitDownCount}
            upCount={upCount}
            downCount={downCount}
            volume="-"
            continuousRate={limitSummary.consec > 0 ? `${((limitSummary.consec / Math.max(limitUpCount, 1)) * 100).toFixed(1)}%` : '0%'}
          />
        </div>

        {/* 4 panels — 3 cols each */}
        <div className="col-span-12 lg:col-span-3 h-[480px] group relative">
          <MarketWidthPanel
            limitUpCount={limitUpCount}
            limitDownCount={limitDownCount}
            consecCount={limitSummary.consec}
            brokeCount={limitSummary.up_open}
            topStocks={topLimitStocks}
          />
          <button onClick={() => openDrawer('market')} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">行情详情 →</button>
        </div>

        <div className="col-span-12 lg:col-span-3 h-[480px] group relative">
          <SectorFlowPanel />
          <button onClick={() => openDrawer('market')} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">行情详情 →</button>
        </div>

        <div className="col-span-12 lg:col-span-3 h-[480px] group relative">
          <AINewsPanel />
          <button onClick={() => openDrawer('intel')} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">情报详情 →</button>
        </div>

        <div className="col-span-12 lg:col-span-3 h-[480px] group relative">
          <AssetPanel />
          <button onClick={() => openDrawer('watchlist')} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">持仓详情 →</button>
        </div>
      </div>

      <AIChat />
      <AppDrawer />
    </div>
  )
}
