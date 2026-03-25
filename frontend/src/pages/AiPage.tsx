import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Select, Avatar } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography
const { TextArea } = Input

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好，我是您的 A 股盘面军师。我可以为您分析实时行情、解析个股异动逻辑，或提供短线交易建议。今天有什么想聊的？' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [skill, setSkill] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const r = await axios.post('/api/ai/chat', { message: input, skill_name: skill })
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: r.data.data?.content ?? r.data.data?.text ?? JSON.stringify(r.data.data) 
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，军师现在有点忙，请稍后再试。' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            AI <span className="text-blue-500">Strategist</span>
          </h1>
          <Text className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            智能盘面军师 · 深度量化逻辑解析
          </Text>
        </div>
        <div className="flex items-center gap-4">
          <Select
            placeholder="切换专业技能"
            allowClear
            className="w-48 glass-select"
            onChange={setSkill}
            options={[
              { value: 'market_analysis', label: '📊 市场整体分析' },
              { value: 'stock_analysis', label: '🔍 个股异动解析' },
              { value: 'dragon_detect', label: '🐉 擒龙潜力挖掘' },
            ]}
          />
        </div>
      </div>

      <div className="flex-1 glass-card flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-50" />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar 
                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                className={msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 text-blue-400'}
                size="large"
              />
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl text-[13px] leading-relaxed font-bold shadow-xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] font-mono text-slate-600 uppercase">
                  {msg.role === 'assistant' ? 'Strategist AI' : 'Commander'}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 animate-pulse">
              <Avatar icon={<RobotOutlined />} className="bg-slate-800 text-blue-400" size="large" />
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="relative">
            <TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入您的指令，如：'分析今日低空经济板块的资金流向'..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); send() } }}
              className="glass-input pr-24 py-4 resize-none"
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={send} 
                loading={loading}
                className="h-10 px-6 font-black uppercase italic"
              >
                Send
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <span className="flex items-center gap-1"><BulbOutlined style={{ fontSize: 12 }} /> AI Assisted</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>Connected to Claude 3.5 Sonnet</span>
          </div>
        </div>
      </div>
    </div>
  )
}
