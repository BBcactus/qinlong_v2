import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, TrendingUp, Zap, Activity, BarChart3 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { cn } from '../../lib/utils';

interface SentimentPanelProps {
  temperature: number;
  limitUp: number;
  limitDown: number;
  upCount: number;
  downCount: number;
  volume: string;
  continuousRate: string;
}

export const SentimentPanel: React.FC<SentimentPanelProps> = ({
  temperature, limitUp, limitDown, upCount, downCount, volume, continuousRate
}) => {
  const getSentimentText = (temp: number) => {
    if (temp <= 20) return { title: '冰点期', desc: '资金缩量，大盘超跌，适合左侧低仓埋伏' };
    if (temp <= 40) return { title: '低迷期', desc: '情绪退潮，个股分化严重，多看少动' };
    if (temp <= 60) return { title: '震荡期', desc: '多云观望，板块轮动较快，注意节奏' };
    if (temp <= 75) return { title: '活跃期', desc: '晴空万里，主线清晰，赚钱效应扩散' };
    return { title: '亢奋期', desc: '全面爆发，注意高位获利了结，谨防炸板' };
  };

  const sentiment = getSentimentText(temperature);

  const chartOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 20, left: 10, right: 10 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [
      {
        data: [30, 45, 42, 58, 65, 72, 68, 85, 92],
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: temperature > 50 ? '#ff4d4f' : '#52c41a', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: temperature > 50 ? 'rgba(255, 77, 79, 0.3)' : 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'transparent' }
            ]
          }
        }
      }
    ]
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 w-full">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative flex flex-col items-center"
      >
        {/* Large Temperature Display */}
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-[96px] leading-none font-black tracking-tighter transition-all duration-1000",
            temperature > 50 ? "text-gradient-red" : "text-gradient-blue"
          )}>
            {Math.round(temperature)}
          </span>
          <span className="text-4xl font-bold text-slate-500/50 italic">°C</span>
        </div>
        
        <div className="flex flex-col items-center -mt-2">
          <h2 className="text-2xl font-black tracking-[0.2em] text-white flex items-center gap-3 uppercase italic">
            <Thermometer className={temperature > 50 ? 'text-red-500' : 'text-blue-500'} size={24} />
            {sentiment.title}
          </h2>
          <p className="text-slate-400 font-bold text-xs mt-1 tracking-widest">{sentiment.desc}</p>
        </div>
      </motion.div>

      {/* Micro Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-4xl px-4">
        <StatCard icon={<TrendingUp className="text-red-500" size={18} />} label="涨跌比" value={`${upCount}:${downCount}`} />
        <StatCard icon={<Zap className="text-yellow-500" size={18} />} label="涨/跌停" value={`${limitUp}/${limitDown}`} />
        <StatCard icon={<Activity className="text-cyan-500" size={18} />} label="连板率" value={continuousRate} />
        <StatCard icon={<BarChart3 className="text-purple-500" size={18} />} label="成交额" value={volume} />
      </div>

      {/* Trend Chart */}
      <div className="w-full max-w-xl h-20 mt-6 opacity-40">
        <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="glass-card p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all border-white/5 shadow-none group">
    <div className="mb-2 group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mb-0.5">{label}</span>
    <span className="text-sm font-mono font-black text-white">{value}</span>
  </div>
);
