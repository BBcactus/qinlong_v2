import { useState } from 'react'
import { X, BarChart3, Newspaper, Bot, Star, Clock, Settings, LayoutDashboard } from 'lucide-react'
import { ConfigProvider, theme } from 'antd'
import { useDrawer, DrawerTab } from '../context/DrawerContext'
import MarketDetailPage from '../pages/MarketDetailPage'
import IntelPage from '../pages/IntelPage'
import AIMasterPage from '../pages/AIMasterPage'
import WatchlistPage from '../pages/WatchlistPage'
import PositionsPage from '../pages/PositionsPage'
import SchedulerPage from '../pages/SchedulerPage'
import SettingsPage from '../pages/SettingsPage'

const TABS: { key: DrawerTab; label: string; icon: React.ReactNode }[] = [
  { key: 'market',    label: '行情详情', icon: <BarChart3 size={15} /> },
  { key: 'intel',     label: '情报中心', icon: <Newspaper size={15} /> },
  { key: 'ai',        label: 'AI军师',   icon: <Bot size={15} /> },
  { key: 'watchlist', label: '自选持仓', icon: <Star size={15} /> },
  { key: 'scheduler', label: '定时任务', icon: <Clock size={15} /> },
  { key: 'settings',  label: '配置',     icon: <Settings size={15} /> },
]

function WatchlistPortfolio() {
  const [active, setActive] = useState('watchlist')
  const subTabs = [
    { key: 'watchlist', label: '自选股' },
    { key: 'positions', label: '持仓' },
    { key: 'account',   label: '账户' },
  ]
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/5 mb-4">
        {subTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              active === t.key
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {active === 'watchlist' && <WatchlistPage />}
        {active === 'positions' && <PositionsPage />}
        {active === 'account' && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="text-5xl font-black italic text-slate-800 mb-3">账户</div>
              <div className="text-xs text-slate-600">多账户管理 · 开发中</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TabContent({ tab }: { tab: DrawerTab }) {
  switch (tab) {
    case 'market':    return <MarketDetailPage />
    case 'intel':     return <IntelPage />
    case 'ai':        return <AIMasterPage />
    case 'watchlist': return <WatchlistPortfolio />
    case 'scheduler': return <SchedulerPage />
    case 'settings':  return <SettingsPage />
    default:          return null
  }
}

export function AppDrawer() {
  const { open, tab, openDrawer, closeDrawer } = useDrawer()

  return (
    <ConfigProvider theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#2563eb',
        colorBgBase: '#020617',
        colorBgContainer: 'rgba(255, 255, 255, 0.05)',
        colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        fontFamily: "'Inter', 'PingFang SC', sans-serif",
      },
    }}>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: '90vw',
          background: 'rgba(2, 6, 23, 0.97)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Drawer header / tab bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-black/20 shrink-0">
          <button
            onClick={closeDrawer}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mr-2 shrink-0"
          >
            <LayoutDashboard size={12} /> 仪表盘
          </button>

          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => openDrawer(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  tab === t.key
                    ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={closeDrawer}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <TabContent tab={tab} />
        </div>
      </div>
    </ConfigProvider>
  )
}
