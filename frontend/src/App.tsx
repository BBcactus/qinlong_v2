import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, ConfigProvider, theme } from 'antd'
import {
  BarChartOutlined,
  StarOutlined,
  WalletOutlined,
  RobotOutlined,
  DashboardOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { ShieldCheck, Clock, Bell, Settings } from 'lucide-react'
import MarketPage from './pages/MarketPage'
import WatchlistPage from './pages/WatchlistPage'
import PositionsPage from './pages/PositionsPage'
import AiPage from './pages/AiPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import SchedulerPage from './pages/SchedulerPage'

const { Sider, Content, Header } = Layout

const navItems = [
  { key: '/', label: '仪表盘', icon: <DashboardOutlined /> },
  { key: '/market', label: '实时行情', icon: <BarChartOutlined /> },
  { key: '/watchlist', label: '核心自选', icon: <StarOutlined /> },
  { key: '/positions', label: '实盘持仓', icon: <WalletOutlined /> },
  { key: '/ai', label: 'AI 军师', icon: <RobotOutlined /> },
  { key: '/scheduler', label: '任务调度', icon: <ClockCircleOutlined /> },
  { key: '/settings', label: '系统设置', icon: <SettingOutlined /> },
]

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [time, setTime] = useState(new Date())
  const selectedKey = navItems.find(i => i.key !== '/' && pathname.startsWith(i.key))?.key ?? '/'
  const isDashboard = pathname === '/'

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (isDashboard) return <DashboardPage />

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorBgBase: '#020617',
          colorBgContainer: 'rgba(255, 255, 255, 0.05)',
          colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          fontFamily: "'Inter', 'PingFang SC', sans-serif",
        },
        components: {
          Layout: {
            siderBg: 'rgba(2, 6, 23, 0.8)',
            headerBg: 'rgba(2, 6, 23, 0.4)',
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: '#94a3b8',
            itemSelectedColor: '#fff',
            itemSelectedBg: 'rgba(37, 99, 235, 0.2)',
            itemHoverBg: 'rgba(255, 255, 255, 0.05)',
            itemActiveBg: 'rgba(255, 255, 255, 0.05)',
          },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#020617' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
          width={240}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(2, 6, 23, 0.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="p-6 flex items-center gap-3 overflow-hidden">
            <div className="min-w-[32px] w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
               <ShieldCheck className="text-white" size={20} />
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-300">
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: -0.5, fontStyle: 'italic' }}>
                  DRAGON <span className="text-blue-500">v2.5</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Quantum Terminal</div>
              </div>
            )}
          </div>
          
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={navItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 'none', padding: '0 12px' }}
          />
          
          <div 
            className="absolute bottom-6 left-0 right-0 px-6 cursor-pointer text-slate-500 hover:text-white transition-colors flex justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
          </div>
        </Sider>
        
        <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s', background: 'transparent' }}>
          <Header style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0 32px',
            background: 'rgba(2, 6, 23, 0.4)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 90
          }}>
            <div className="flex items-center gap-4">
               {/* Breadcrumb or Page Title can go here */}
               <span className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                 {navItems.find(i => i.key === selectedKey)?.label}
               </span>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span className="text-sm font-mono font-bold">
                  {time.toLocaleTimeString([], { hour12: false })}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
                  <Bell size={20} />
                </button>
                <button 
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 border border-white/20" />
              </div>
            </div>
          </Header>
          <Content style={{ minHeight: 'calc(100vh - 64px)', background: 'transparent', position: 'relative' }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/market" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><MarketPage /></div>} />
              <Route path="/watchlist" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><WatchlistPage /></div>} />
              <Route path="/positions" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><PositionsPage /></div>} />
              <Route path="/ai" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><AiPage /></div>} />
              <Route path="/scheduler" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><SchedulerPage /></div>} />
              <Route path="/settings" element={<div className="p-6 md:p-8 max-w-[1600px] mx-auto"><SettingsPage /></div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
