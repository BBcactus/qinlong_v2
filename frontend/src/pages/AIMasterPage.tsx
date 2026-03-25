import { useState } from 'react'
import { Bot, Cpu, Zap, Users, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

const AGENTS = [
  { id: 'market-analyst', name: '盘面军师', desc: '实时分析大盘情绪、板块轮动、资金流向', icon: '📊' },
  { id: 'stock-picker', name: '选股猎手', desc: '基于动量、量价、连板逻辑筛选个股', icon: '🎯' },
  { id: 'risk-guard', name: '风控卫士', desc: '监控持仓风险、止损建议、仓位管理', icon: '🛡️' },
  { id: 'news-reader', name: '情报官', desc: '解读新闻政策、挖掘题材逻辑', icon: '📡' },
]

const SKILLS = [
  { id: 'market-overview', name: '大盘扫描', color: 'blue' },
  { id: 'limit-analysis', name: '涨停分析', color: 'red' },
  { id: 'sector-flow', name: '板块轮动', color: 'purple' },
  { id: 'news-parse', name: '新闻解读', color: 'cyan' },
  { id: 'position-review', name: '持仓诊断', color: 'orange' },
  { id: 'opening-plan', name: '开盘计划', color: 'green' },
  { id: 'closing-review', name: '收盘复盘', color: 'yellow' },
  { id: 'hot-money', name: '游资追踪', color: 'pink' },
]

export default function AIMasterPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('market-analyst')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['market-overview'])
  const [multiAgent, setMultiAgent] = useState(false)

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const skillColorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    pink: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          AI <span className="text-blue-500">军师</span>
        </h1>
        <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">智能决策 · 多Agent协同 · 量化分析</p>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left: Agent + Skill config */}
        <div className="flex flex-col gap-4">
          {/* Agent 选择 */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Cpu size={12} /> 选择 Agent
              </div>
              <button
                onClick={() => setMultiAgent(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all',
                  multiAgent
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-white/5 border-white/10 text-slate-500'
                )}
              >
                <Users size={10} /> 群聊模式
              </button>
            </div>
            <div className="space-y-2">
              {AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all',
                    selectedAgent === agent.id
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/3 border-white/5 hover:bg-white/8'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{agent.icon}</span>
                    <div>
                      <div className={cn('text-xs font-black', selectedAgent === agent.id ? 'text-blue-300' : 'text-slate-300')}>{agent.name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{agent.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {multiAgent && (
              <div className="mt-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-300/60 text-center">
                多 Agent 群聊即将上线
              </div>
            )}
          </div>

          {/* Skill 选择 */}
          <div className="glass-card p-5 flex flex-col gap-3 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Zap size={12} /> 选择 Skills
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => {
                const active = selectedSkills.includes(skill.id)
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all',
                      active ? skillColorMap[skill.color] : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {skill.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center + Right: Chat area placeholder */}
        <div className="col-span-2 glass-card flex flex-col items-center justify-center gap-6 text-center p-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <Bot size={40} className="text-blue-400 opacity-60" />
          </div>
          <div>
            <div className="text-lg font-black text-white/40 uppercase italic tracking-tighter">对话区</div>
            <div className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase mt-1">功能开发中，即将上线</div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <ChevronDown size={12} />
            <span>已选 Agent: <span className="text-blue-400 font-black">{AGENTS.find(a => a.id === selectedAgent)?.name}</span></span>
            <span>·</span>
            <span>已选 Skills: <span className="text-blue-400 font-black">{selectedSkills.length}</span> 个</span>
          </div>
        </div>
      </div>
    </div>
  )
}
