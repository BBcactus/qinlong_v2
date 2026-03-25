import { useEffect, useState } from 'react'
import { Table, Button, Typography, Tag, message, Tooltip } from 'antd'
import { ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons'
import api from '../api/client'

const { Text } = Typography

interface Job {
  id: string
  name: string
  next_run_time: string | null
  trigger: string
  pending: boolean
}

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState<Record<string, boolean>>({})

  const fetchJobs = () => {
    setLoading(true)
    api.get('/scheduler/jobs')
      .then(r => setJobs(r.data.data ?? []))
      .catch(() => message.error('获取任务列表失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchJobs() }, [])

  const triggerJob = (id: string) => {
    setRunning(prev => ({ ...prev, [id]: true }))
    api.post(`/scheduler/jobs/${id}/run`)
      .then(() => message.success(`任务 [${id}] 已手动触发`))
      .catch(() => message.error(`触发失败`))
      .finally(() => setRunning(prev => ({ ...prev, [id]: false })))
  }

  const columns = [
    {
      title: '任务名称/ID',
      key: 'task',
      width: 250,
      render: (_: any, r: Job) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.pending ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
            <SyncOutlined spin={running[r.id]} style={{ fontSize: 14 }} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white italic">{r.name || 'Unnamed Task'}</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{r.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: '调度规则',
      dataIndex: 'trigger',
      width: 150,
      render: (v: string) => <Tag className="bg-white/5 border-white/10 text-slate-400 font-mono text-[10px]">{v}</Tag>,
    },
    {
      title: '下次运行',
      dataIndex: 'next_run_time',
      width: 200,
      render: (v: string | null) => v ? (
        <div className="flex items-center gap-2 text-blue-400">
          <ClockCircleOutlined style={{ fontSize: 12 }} />
          <span className="font-mono text-xs font-bold">{new Date(v).toLocaleString('zh-CN')}</span>
        </div>
      ) : <span className="text-slate-600 italic text-xs">Not Scheduled</span>,
    },
    {
      title: '状态',
      dataIndex: 'pending',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'orange' : 'green'} className="border-none px-3 py-0.5 rounded-full text-[10px] font-black uppercase">
          {v ? 'Pending' : 'Scheduled'}
        </Tag>
      ),
    },
    {
      title: '管理操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Job) => (
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={running[record.id]}
          onClick={() => triggerJob(record.id)}
          className="h-8 px-4 font-black text-[10px] uppercase italic"
        >
          Run Now
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            Task <span className="text-blue-500">Scheduler</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            自动化任务调度系统 · 后台数据同步与量化计算
          </Text>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip title="刷新列表">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchJobs} 
              loading={loading}
              className="w-10 h-10 flex items-center justify-center bg-white/5 border-white/5 hover:bg-white/10"
            />
          </Tooltip>
        </div>
      </div>

      <div className="glass-card p-6">
        <Table
          dataSource={jobs}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
          <InfoCircleOutlined style={{ fontSize: 24 }} />
        </div>
        <div>
          <div className="text-sm font-black text-white italic uppercase tracking-wider">调度引擎状态: 运行中 (Active)</div>
          <div className="text-xs text-slate-500 mt-1 font-bold">所有自动化爬虫、数据清洗及 AI 分析任务均按照预设规则正常运行。</div>
        </div>
      </div>
    </div>
  )
}

function InfoCircleOutlined({ style }: { style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 1024 1024" 
      width="1em" 
      height="1em" 
      fill="currentColor" 
      style={style}
    >
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
      <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" />
    </svg>
  )
}
