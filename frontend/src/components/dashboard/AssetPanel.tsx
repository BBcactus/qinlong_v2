import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Wallet, List, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface WatchItem { id: number; stock_name: string; code6: string; add_date: string; note: string }
interface HoldItem { id: number; stock_name: string; code6: string; quantity: number; cost_basis: number }

export const AssetPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equity' | 'watch' | 'hold'>('equity');
  const [watchList, setWatchList] = useState<WatchItem[]>([]);
  const [holdList, setHoldList] = useState<HoldItem[]>([]);

  useEffect(() => {
    api.get('/watchlist/').then(r => setWatchList(r.data.data ?? [])).catch(() => {})
    api.get('/positions/').then(r => setHoldList(r.data.data ?? [])).catch(() => {})
  }, [])

  const equityOption = {
    backgroundColor: 'transparent',
    grid: { top: 10, bottom: 20, left: 10, right: 10 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [
      {
        data: [100, 102, 98, 105, 110, 108, 115, 120, 118, 125],
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#ef4444', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'transparent' }
            ]
          }
        }
      }
    ]
  };

  return (
    <div className="glass-card h-full flex flex-col border-white/5 shadow-none bg-white/2 backdrop-blur-3xl">
      <div className="flex border-b border-white/5 bg-white/2">
        <button 
          onClick={() => setActiveTab('equity')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5",
            activeTab === 'equity' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Wallet size={12} /> 当日收益
        </button>
        <button 
          onClick={() => setActiveTab('watch')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5",
            activeTab === 'watch' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <List size={12} /> 自选池
        </button>
        <button 
          onClick={() => setActiveTab('hold')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-1.5",
            activeTab === 'hold' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Briefcase size={12} /> 持仓
        </button>
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        {activeTab === 'equity' && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">总资产净值</div>
                <div className="text-2xl font-mono font-black text-white italic">¥1,254,800.00</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-red-500 flex items-center gap-1">
                  <TrendingUp size={16} /> +5.24%
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500 mt-1">+¥62,500.00</div>
              </div>
            </div>
            <div className="flex-1 min-h-[140px]">
              <ReactECharts option={equityOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        )}
        {(activeTab === 'watch') && (
          <div className="flex-1 overflow-y-auto">
            {watchList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <List size={32} className="opacity-10 mb-2" />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">自选池为空</div>
              </div>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead><tr className="text-[9px] text-slate-500 border-b border-white/5 uppercase font-black tracking-widest">
                  <th className="pb-2">名称</th><th className="pb-2 text-right">代码</th>
                </tr></thead>
                <tbody>{watchList.map(w => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 font-black text-slate-200">{w.stock_name}</td>
                    <td className="py-2 text-right font-mono text-slate-400">{w.code6}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
        {(activeTab === 'hold') && (
          <div className="flex-1 overflow-y-auto">
            {holdList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <Briefcase size={32} className="opacity-10 mb-2" />
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">暂无持仓</div>
              </div>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead><tr className="text-[9px] text-slate-500 border-b border-white/5 uppercase font-black tracking-widest">
                  <th className="pb-2">名称</th><th className="pb-2 text-right">数量</th><th className="pb-2 text-right">现价</th>
                </tr></thead>
                <tbody>{holdList.map(h => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 font-black text-slate-200">{h.stock_name}</td>
                    <td className="py-2 text-right font-mono text-slate-400">{h.quantity}</td>
                    <td className="py-2 text-right font-mono text-red-400">{h.cost_basis}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
