import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface PlateRow {
  plate_code: string
  plate_name: string
  change_rate: number | null
  main_inflow: number | null
  main_inflow_rate: number | null
  leading_stock: string | null
}

export const SectorFlowPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [plates, setPlates] = useState<PlateRow[]>([]);

  useEffect(() => {
    api.get('/market/hot-plates', { params: { plate_type: 'industry' } })
      .then(r => {
        const data: PlateRow[] = r.data.data ?? []
        data.sort((a, b) => (b.main_inflow ?? 0) - (a.main_inflow ?? 0))
        setPlates(data.slice(0, 10))
      })
      .catch(() => {})
  }, [])

  const inflow = plates.filter(p => (p.main_inflow ?? 0) >= 0)
  const outflow = [...plates]
    .sort((a, b) => (a.main_inflow ?? 0) - (b.main_inflow ?? 0))
    .filter(p => (p.main_inflow ?? 0) < 0)
  const displayData = activeTab === 'in' ? inflow : outflow

  const toYi = (val: number | null) => val == null ? 0 : Math.abs(val / 10000)

  return (
    <div className="glass-card h-full flex flex-col border-white/5 shadow-none bg-white/2 backdrop-blur-3xl">
      <div className="flex border-b border-white/5 bg-white/2">
        <button
          onClick={() => setActiveTab('in')}
          className={cn(
            "flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all",
            activeTab === 'in' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          主力净流入
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={cn(
            "flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all",
            activeTab === 'out' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          )}
        >
          主力净流出
        </button>
      </div>
      <div className="flex-1 p-3 overflow-hidden">
        {displayData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs">暂无数据</div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] text-slate-500 border-b border-white/5 uppercase font-black tracking-widest">
                  <th className="pb-2">板块名称</th>
                  <th className="pb-2 text-right">净流入</th>
                  <th className="pb-2 text-right">领涨股</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {displayData.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-black text-slate-200">{item.plate_name}</td>
                    <td className="py-2.5 text-right">
                      <span className={cn(
                        "font-mono font-black",
                        activeTab === 'in' ? "text-red-500" : "text-green-500"
                      )}>
                        {activeTab === 'in' ? '+' : '-'}{toYi(item.main_inflow).toFixed(1)}亿
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 font-black italic">
                        {item.leading_stock ?? '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
