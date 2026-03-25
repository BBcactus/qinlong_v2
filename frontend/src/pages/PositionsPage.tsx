import { useEffect, useState } from 'react'
import { Table, Tag, Typography, Statistic, Row, Col, Progress } from 'antd'
import axios from 'axios'
import { Wallet, TrendingUp, Target, BarChart3 } from 'lucide-react'

const { Text } = Typography

export default function PositionsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/positions')
      setData(r.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openPositions = data.filter(p => p.status === 'open')
  const totalCost = openPositions.reduce((s, p) => s + (p.cost_basis ?? 0) * (p.quantity ?? 0), 0)

  const cols = [
    {
      title: '持仓标的',
      key: 'stock',
      width: 200,
      render: (_: any, r: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Wallet size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white">{r.stock_name}</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{r.code6}</span>
          </div>
        </div>
      ),
    },
    {
      title: '买入/成本',
      key: 'price',
      width: 150,
      render: (_: any, r: any) => (
        <div className="flex flex-col">
          <span className="text-xs text-white font-mono font-bold">{r.buy_price?.toFixed(3)}</span>
          <span className="text-[10px] text-slate-500 font-mono italic">Cost: {r.cost_basis?.toFixed(3)}</span>
        </div>
      ),
    },
    {
      title: '持有数量',
      dataIndex: 'quantity',
      width: 100,
      render: (v: number) => <span className="font-mono text-white font-black">{v}</span>,
    },
    {
      title: '持仓状态',
      dataIndex: 'status',
      width: 120,
      render: (s: string) => (
        <Tag color={s === 'open' ? 'orange' : 'default'} className="border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
          {s === 'open' ? 'In Position' : 'Closed'}
        </Tag>
      ),
    },
    {
      title: '买入日期',
      dataIndex: 'buy_date',
      width: 120,
      render: (v: string) => <span className="text-xs text-slate-400 font-mono">{v}</span>
    },
    {
      title: '盈亏研判',
      dataIndex: 'note',
      render: (v: string) => <Text className="text-slate-300 text-xs italic">{v || '无备注'}</Text>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            Active <span className="text-blue-500">Positions</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            实盘持仓管理 · 实时风险敞口监控
          </Text>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Portfolio</span>
          </div>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={6}>
          <div className="glass-card p-6 bg-gradient-to-br from-blue-600/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-blue-400" size={18} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">持仓标的数</span>
            </div>
            <Statistic value={openPositions.length} suffix="Targets" valueStyle={{ color: '#fff', fontWeight: 900, fontStyle: 'italic' }} />
          </div>
        </Col>
        <Col span={6}>
          <div className="glass-card p-6 bg-gradient-to-br from-orange-600/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-orange-400" size={18} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">持仓总成本</span>
            </div>
            <Statistic value={totalCost} precision={0} prefix="¥" valueStyle={{ color: '#fff', fontWeight: 900, fontStyle: 'italic' }} />
          </div>
        </Col>
        <Col span={12}>
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-red-400" size={18} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">仓位占用率 (Estimate)</span>
              </div>
              <Progress 
                percent={65} 
                strokeColor={{ '0%': '#2563eb', '100%': '#60a5fa' }} 
                trailColor="rgba(255,255,255,0.05)"
                showInfo={false}
              />
            </div>
            <div className="ml-12 text-right">
              <div className="text-2xl font-black text-white italic">65.4%</div>
              <div className="text-[10px] font-black text-slate-600 uppercase">Margin Used</div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="glass-card p-6">
        <Table 
          dataSource={data} 
          rowKey="id" 
          columns={cols} 
          size="middle" 
          loading={loading}
          pagination={{ pageSize: 15, className: 'custom-pagination' }}
        />
      </div>
    </div>
  )
}
