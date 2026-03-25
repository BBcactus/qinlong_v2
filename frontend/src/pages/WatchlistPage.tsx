import { useEffect, useState } from 'react'
import { Table, Button, Tag, Typography, Space, Modal, Form, Input, message, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, StarOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

export default function WatchlistPage() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/watchlist')
      setData(r.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    const values = await form.validateFields()
    await axios.post('/api/watchlist', values)
    message.success('标的已添加至擒龙池')
    setOpen(false)
    form.resetFields()
    load()
  }

  const remove = async (code: string) => {
    await axios.delete(`/api/watchlist/${code}`)
    message.success('已从擒龙池移除')
    load()
  }

  const cols = [
    {
      title: '标的名称',
      key: 'stock',
      width: 200,
      render: (_: any, r: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <StarOutlined style={{ fontSize: 16 }} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white">{r.stock_name}</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{r.code6}</span>
          </div>
        </div>
      ),
    },
    {
      title: '监控状态',
      dataIndex: 'status',
      width: 120,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'blue' : 'default'} className="border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase">
          {s === 'active' ? 'Active' : 'Archived'}
        </Tag>
      ),
    },
    {
      title: '核心标签',
      dataIndex: 'tags',
      render: (tags: string) => (
        <Space size={4} wrap>
          {(tags || '').split(/[，,]/).filter(Boolean).map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 bg-white/5 text-slate-400 border border-white/10 rounded-md font-black italic uppercase">
              #{t.trim()}
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: '研判备注',
      dataIndex: 'note',
      render: (v: string) => <Text className="text-slate-400 text-xs italic">{v || '-'}</Text>,
    },
    {
      title: '加入时间',
      dataIndex: 'add_date',
      width: 150,
      render: (v: string) => <span className="font-mono text-[11px] text-slate-500">{v}</span>
    },
    {
      title: '管理',
      key: 'action',
      width: 100,
      render: (_: any, row: any) => (
        <Tooltip title="移除">
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => remove(row.code6)}
            className="hover:bg-red-500/10"
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            Dragon <span className="text-blue-500">Pool</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            擒龙核心股票池 · 实时监控与量化过滤
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: 14 }} />
            <input 
              type="text" 
              placeholder="快速检索..." 
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 w-64 transition-all"
            />
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setOpen(true)}
            className="h-10 px-6 font-black uppercase tracking-widest text-[11px]"
          >
            添加标的
          </Button>
        </div>
      </div>

      <div className="glass-card p-6">
        <Table 
          dataSource={data} 
          rowKey="id" 
          columns={cols} 
          size="middle" 
          loading={loading}
          pagination={{ pageSize: 20, className: 'custom-pagination' }}
        />
      </div>

      <Modal 
        title={
          <div className="flex items-center gap-2 text-white italic font-black uppercase tracking-widest">
            <PlusOutlined className="text-blue-500" /> 添加核心标的
          </div>
        }
        open={open} 
        onOk={add} 
        onCancel={() => setOpen(false)}
        okText="确认添加"
        cancelText="取消"
        className="glass-modal"
        centered
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item 
            name="code" 
            label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">股票代码</span>}
            rules={[{ required: true }]}
          >
            <Input 
              prefix={<InfoCircleOutlined className="text-slate-500" style={{ fontSize: 14 }} />}
              placeholder="例：600000" 
              className="glass-input h-12"
            />
          </Form.Item>
          <Form.Item 
            name="tags" 
            label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">特征标签</span>}
          >
            <Input 
              placeholder="低空经济, 华为概念, 龙头" 
              className="glass-input h-12"
            />
          </Form.Item>
          <Form.Item 
            name="note" 
            label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">研判备注</span>}
          >
            <Input.TextArea 
              rows={3}
              placeholder="输入该标的的逻辑支撑或关注要点..." 
              className="glass-input pt-3"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
