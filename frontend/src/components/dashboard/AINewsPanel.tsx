// TODO: wire to /intel/telegrams when backend news endpoint is available
import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export const AINewsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'news' | 'headlines'>('news');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mockNews = [
    { id: 1, time: '10:45', content: '【低空经济板块持续拉升】中信海直午后触及涨停，万丰奥威、莱斯信息涨超8%。', aiAnalysis: '低空经济作为今年政策主线，资金参与度极高。中信海直作为领涨龙头，其封板力度将决定板块的持续性。', tags: ['低空经济', '龙头'] },
    { id: 2, time: '10:32', content: '【半导体封测概念走强】长电科技、通富微电等快速跟涨。', aiAnalysis: '国产替代逻辑支撑，叠加周期回升，封测环节弹性较大。', tags: ['半导体', '国产替代'] }
  ];

  return (
    <div className="glass-card h-full flex flex-col border-white/5 shadow-none bg-white/2 backdrop-blur-3xl">
      <div className="flex border-b border-white/5 bg-white/2">
        <button 
          onClick={() => setActiveTab('news')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all",
            activeTab === 'news' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          财联社电报
        </button>
        <button 
          onClick={() => setActiveTab('headlines')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all",
            activeTab === 'headlines' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          头条重磅
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
        {mockNews.map((item) => (
          <div key={item.id} className="relative pl-6 border-l-2 border-blue-500/30">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{item.time}</span>
              <div className="flex gap-2">
                {item.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-white/5 text-slate-500 rounded-md font-black uppercase tracking-tighter border border-white/5 italic">#{tag}</span>
                ))}
              </div>
            </div>
            <p className="text-[13px] text-slate-200 leading-relaxed font-bold tracking-wide">
              {item.content}
            </p>
            
            <button 
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
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
          </div>
        ))}
      </div>
    </div>
  );
};
