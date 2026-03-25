import { useState, useEffect } from 'react'
import { Bot, ChevronDown, ChevronUp, RefreshCw, Newspaper, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import api from '../api/client'

interface NewsItem {
  id?: number
  time?: string
  title?: string
  content?: string
  tags?: string[]
  aiAnalysis?: string
  source?: string
}

export default function IntelPage() {
  const [tab, setTab] = useState<'cls' | 'headlines'>('cls')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const mockCls: NewsItem[] = [
    { id: 1, time: '10:45', content: '【低空经济板块持续拉升】中信海直午后触及涨停，万丰奥威、莱斯信息涨超8%。', tags: ['低空经济', '龙头'], aiAnalysis: '低空经济作为今年政策主线，资金参与度极高。中信海直作为领涨龙头，其封板力度将决定板块的持续性。' },
    { id: 2, time: '10:32', content: '【半导体封测概念走强】长电科技、通富微电等快速跟涨。', tags: ['半导体', '国产替代'], aiAnalysis: '国产替代逻辑支撑，叠加周期回升，封测环节弹性较大。' },
    { id: 3, time: '10:15', content: '【机构资金净流入TOP5】宁德时代、比亚迪、中芯国际、紫光国微、澜起科技。', tags: ['机构动向', '北向资金'], aiAnalysis: '机构资金集中布局科技成长和新能源方向，显示中长期配置信心。' },
    { id: 4, time: '09:55', content: '【市场情绪升温】沪深两市涨停板数量已达86只，炸板率23%，连板晋级率61%。', tags: ['市场情绪', '涨停'], aiAnalysis: '涨停数量和晋级率同步走强，市场做多情绪高涨，适合追高强势票。' },
  ]

  const mockHeadlines: NewsItem[] = [
    { id: 5, time: '09:30', title: '国务院：加快推进低空经济基础设施建设', content: '国务院发布关于促进低空经济高质量发展的指导意见，明确2025年底前完成主要城市低空空域管理改革试点。', tags: ['政策', '低空经济'], source: '新华社' },
    { id: 6, time: '08:45', title: '美联储官员：年内降息预期维持两次', content: '美联储理事沃勒表示，若通胀继续降温，支持年内降息两次，美股期货小幅上涨。', tags: ['美联储', '宏观'], source: '彭博社' },
    { id: 7, time: '08:20', title: 'A股北向资金：昨日净买入52亿元', content: '北向资金昨日大幅净买入52亿元，其中沪股通净买入31亿元，深股通净买入21亿元，连续三日净流入。', tags: ['北向资金', '外资'], source: '交易所公告' },
  ]

  const fetchNews = async () => {
    setLoading(true)
    try {
      const r = await api.get('/news/latest')
      if (r.data?.data?.length) setNews(r.data.data)
    } catch {
      // use mock data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const displayData = news.length > 0 ? news : (tab === 'cls' ? mockCls : mockHeadlines)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            情报 <span className="text-blue-500">Terminal</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">实时资讯 · CLS电报 · 头条重磅</p>
        </div>
        <button
          onClick={fetchNews}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex mb-6 glass-card overflow-hidden p-1 gap-1">
        <button
          onClick={() => setTab('cls')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
            tab === 'cls' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Radio size={12} /> 财联社电报
        </button>
        <button
          onClick={() => setTab('headlines')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
            tab === 'headlines' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Newspaper size={12} /> 头条重磅
        </button>
      </div>

      {/* News list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {displayData.map((item, i) => (
          <motion.div
            key={item.id ?? i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-5 border-l-2 border-blue-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              {item.time && (
                <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {item.time}
                </span>
              )}
              {item.source && (
                <span className="text-[10px] font-black text-slate-500 uppercase">{item.source}</span>
              )}
              <div className="flex gap-1.5">
                {(item.tags ?? []).map(tag => (
                  <span key={tag} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {item.title && (
              <div className="font-black text-white mb-1">{item.title}</div>
            )}
            <div className="text-sm text-slate-300 leading-relaxed">{item.content}</div>

            {item.aiAnalysis && (
              <>
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : (item.id ?? null))}
                  className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors group"
                >
                  <div className="w-5 h-5 bg-blue-500/20 rounded-md flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Bot size={12} />
                  </div>
                  AI 深度解析
                  {expandedId === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[12px] text-blue-100/80 leading-relaxed italic font-bold">
                        <span className="text-blue-500 mr-2 opacity-50">"</span>
                        {item.aiAnalysis}
                        <span className="text-blue-500 ml-2 opacity-50">"</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
