import { useState, useEffect } from 'react'
import {
  Tabs, Table, Button, Modal, Form, Input, InputNumber,
  Switch, Select, Popconfirm, message, Tag, Space, Typography
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, CloudServerOutlined, BulbOutlined } from '@ant-design/icons'
import api from '../api/client'

const { Text } = Typography

type Provider = {
  id: number; name: string; base_url: string; model_id: string
  api_key_env: string; is_default: boolean; has_key: boolean
}
type Skill = {
  id: number; name: string; description: string; system_prompt: string
  provider_id: number; provider_name: string; model_id: string
  temperature: number; max_tokens: number; enabled: boolean
}

function ProviderTab() {
  const [data, setData] = useState<Provider[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [form] = Form.useForm()

  const load = () => api.get('/settings/providers').then(r => setData(r.data.data))
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); form.resetFields(); setOpen(true) }
  const openEdit = (row: Provider) => {
    setEditing(row)
    form.setFieldsValue({ ...row, api_key: '' })
    setOpen(true)
  }

  const save = async () => {
    const vals = await form.validateFields()
    if (editing) {
      await api.patch(`/settings/providers/${editing.id}`, vals)
    } else {
      await api.post('/settings/providers', vals)
    }
    message.success('配置已更新')
    setOpen(false)
    load()
  }

  const del = async (id: number) => {
    await api.delete(`/settings/providers/${id}`)
    message.success('已删除提供商')
    load()
  }

  const cols = [
    {
      title: '服务商',
      key: 'name',
      render: (_: any, r: Provider) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <CloudServerOutlined />
          </div>
          <span className="font-black text-white">{r.name}</span>
        </div>
      )
    },
    { title: 'Endpoint', dataIndex: 'base_url', key: 'base_url', ellipsis: true, className: 'font-mono text-xs text-slate-500' },
    { title: '默认模型', dataIndex: 'model_id', key: 'model_id', className: 'font-mono text-xs text-blue-400 font-bold' },
    {
      title: '鉴权状态',
      key: 'key',
      render: (_: unknown, r: Provider) => r.has_key
        ? <Tag color="blue" className="border-none rounded-full px-3 text-[10px] font-black uppercase">Configured</Tag>
        : <Tag color="error" className="border-none rounded-full px-3 text-[10px] font-black uppercase">Missing Key</Tag>
    },
    {
      title: '主路线',
      key: 'is_default',
      render: (_: unknown, r: Provider) => r.is_default ? <Tag color="cyan" className="border-none rounded-full px-3 text-[10px] font-black uppercase italic">Default</Tag> : null
    },
    {
      title: '管理', key: 'action',
      render: (_: unknown, r: Provider) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} className="text-slate-400 hover:text-white" />
          <Popconfirm title="确认删除该 AI 提供商？" onConfirm={() => del(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} className="hover:bg-red-500/10" />
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="h-10 px-6 font-black uppercase tracking-widest text-[11px]">新增提供商</Button>
      </div>
      <Table rowKey="id" dataSource={data} columns={cols} pagination={false} size="middle" className="glass-table" />
      <Modal title={editing ? '编辑 AI 提供商' : '新增 AI 提供商'} open={open} onOk={save} onCancel={() => setOpen(false)} centered destroyOnClose className="glass-modal">
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">提供商名称</span>} rules={[{ required: true }]}>
            <Input placeholder="Anthropic / DeepSeek / OpenAI" className="glass-input h-12" />
          </Form.Item>
          <Form.Item name="base_url" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">接口地址</span>} rules={[{ required: true }]}>
            <Input placeholder="https://api.anthropic.com/v1" className="glass-input h-12" />
          </Form.Item>
          <Form.Item name="model_id" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">默认模型 ID</span>} rules={[{ required: true }]}>
            <Input placeholder="claude-3-5-sonnet-20240620" className="glass-input h-12" />
          </Form.Item>
          <Form.Item name="api_key" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{editing ? 'API Key (留空保持不变)' : 'API Key'}</span>}>
            <Input.Password placeholder="sk-..." className="glass-input h-12" />
          </Form.Item>
          <Form.Item name="is_default" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">设为全局默认提供商</span>} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function SkillTab({ providers }: { providers: Provider[] }) {
  const [data, setData] = useState<Skill[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [form] = Form.useForm()

  const load = () => api.get('/settings/skills').then(r => setData(r.data.data))
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); form.resetFields(); setOpen(true) }
  const openEdit = (row: Skill) => { setEditing(row); form.setFieldsValue(row); setOpen(true) }

  const save = async () => {
    const vals = await form.validateFields()
    if (editing) {
      await api.patch(`/settings/skills/${editing.id}`, vals)
    } else {
      await api.post('/settings/skills', vals)
    }
    message.success('技能配置已保存')
    setOpen(false)
    load()
  }

  const del = async (id: number) => {
    await api.delete(`/settings/skills/${id}`)
    message.success('技能已移除')
    load()
  }

  const cols = [
    {
      title: '技能名称',
      key: 'name',
      render: (_: any, r: Skill) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <BulbOutlined />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white">{r.name}</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{r.description}</span>
          </div>
        </div>
      )
    },
    { title: '提供商', dataIndex: 'provider_name', key: 'provider_name', className: 'text-xs font-bold text-slate-400' },
    { title: '模型 ID', dataIndex: 'model_id', key: 'model_id', className: 'font-mono text-[10px] text-blue-500' },
    { title: 'Temp', dataIndex: 'temperature', key: 'temperature', width: 70, className: 'font-mono text-xs' },
    {
      title: '状态', key: 'enabled',
      render: (_: unknown, r: Skill) => r.enabled 
        ? <Tag color="success" className="border-none rounded-full px-3 text-[10px] font-black uppercase">Active</Tag> 
        : <Tag className="border-none rounded-full px-3 text-[10px] font-black uppercase bg-white/5 text-slate-600">Disabled</Tag>
    },
    {
      title: '管理', key: 'action',
      render: (_: unknown, r: Skill) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} className="text-slate-400 hover:text-white" />
          <Popconfirm title="确认删除该 AI 技能？" onConfirm={() => del(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} className="hover:bg-red-500/10" />
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="h-10 px-6 font-black uppercase tracking-widest text-[11px]">新增技能</Button>
      </div>
      <Table rowKey="id" dataSource={data} columns={cols} pagination={false} size="middle" />
      <Modal title={editing ? '编辑 AI 技能' : '新增 AI 技能'} open={open} onOk={save} onCancel={() => setOpen(false)} centered destroyOnClose width={700} className="glass-modal">
        <Form form={form} layout="vertical" className="mt-6 grid grid-cols-2 gap-x-6">
          <Form.Item className="col-span-2" name="name" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">技能名称</span>} rules={[{ required: true }]}><Input className="glass-input h-12" /></Form.Item>
          <Form.Item className="col-span-2" name="description" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">功能说明</span>}><Input className="glass-input h-12" /></Form.Item>
          <Form.Item name="provider_id" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">绑定提供商</span>} rules={[{ required: true }]}>
            <Select options={providers.map(p => ({ value: p.id, label: `${p.name} (${p.model_id})` }))} className="glass-select h-12" />
          </Form.Item>
          <Form.Item name="model_id" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">覆盖模型 ID (可选)</span>}>
            <Input placeholder="不填则使用提供商默认模型" className="glass-input h-12" />
          </Form.Item>
          <Form.Item className="col-span-2" name="system_prompt" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Prompt (灵魂提示词)</span>}>
            <Input.TextArea rows={6} className="glass-input pt-4" />
          </Form.Item>
          <Form.Item name="temperature" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temperature</span>} initialValue={0.7}>
            <InputNumber min={0} max={2} step={0.1} className="w-full glass-input" />
          </Form.Item>
          <Form.Item name="enabled" label={<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">立即启用</span>} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    api.get('/settings/providers').then(r => setProviders(r.data.data))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            System <span className="text-blue-500">Control</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            终端系统设置 · AI 提供商、技能及 Agent 核心配置
          </Text>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full">
          <SettingOutlined className="text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase">Configuration</span>
        </div>
      </div>

      <div className="glass-card p-6 min-h-[600px]">
        <Tabs defaultActiveKey="providers" destroyInactiveTabPane className="settings-tabs" items={[
          { 
            key: 'providers', 
            label: <span className="font-black uppercase tracking-widest text-[11px] px-4">AI 提供商</span>, 
            children: <ProviderTab /> 
          },
          { 
            key: 'skills', 
            label: <span className="font-black uppercase tracking-widest text-[11px] px-4">技能配置</span>, 
            children: <SkillTab providers={providers} /> 
          },
        ]} />
      </div>
    </div>
  )
}
