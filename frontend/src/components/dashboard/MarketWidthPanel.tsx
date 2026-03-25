import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface LimitStock {
  secu_code: string;
  secu_name: string;
  last_px?: number | null;
  change?: number | null;
  limit_days?: number | null;
  pool_type?: string;
  reason?: string | null;
}

interface MarketWidthPanelProps {
  limitUpCount: number;
  limitDownCount: number;
  consecCount: number;
  brokeCount: number;
  topStocks: LimitStock[];
}

const DIST_LABELS = ['>-10%', '-8%', '-6%', '-4%', '-2%', '平盘', '+2%', '+4%', '+6%', '+8%', '>+10%'];
function breadthToBuckets(b: Record<string, number | null>): number[] {
  return [
    b.down_10 ?? 0,
    b.down_8 ?? 0,
    b.down_6 ?? 0,
    b.down_4 ?? 0,
    b.down_2 ?? 0,
    b.flat_num ?? 0,
    b.up_2 ?? 0,
    b.up_4 ?? 0,
    b.up_6 ?? 0,
    b.up_8 ?? 0,
    b.up_10 ?? 0,
  ];
}

export const MarketWidthPanel: React.FC<MarketWidthPanelProps> = ({
  limitUpCount, limitDownCount, consecCount, brokeCount, topStocks
}) => {
  const [activeTab, setActiveTab] = useState<'dist' | 'pool'>('dist');
  const [distData, setDistData] = useState<number[]>([]);

  useEffect(() => {
    api.get('/market/breadth')
      .then(r => {
        const b = r.data.data;
        if (b) setDistData(breadthToBuckets(b));
      })
      .catch(() => {});
  }, []);

  const buckets = distData.length === 11 ? distData
    : [limitDownCount, 0, 0, 0, 0, 0, 0, 0, 0, 0, limitUpCount];

  const distOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 20, bottom: 40, left: 40, right: 20 },
    xAxis: {
      type: 'category',
      data: DIST_LABELS,
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        data: buckets,
        type: 'bar',
        itemStyle: {
          color: (params: any) => params.dataIndex > 5 ? '#ef4444' : params.dataIndex < 5 ? '#22c55e' : '#94a3b8',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  return (
    <div className="glass-card h-full flex flex-col border-white/5 shadow-none bg-white/2 backdrop-blur-3xl">
      <div className="grid grid-cols-4 gap-2 p-4 border-b border-white/5 bg-white/2">
        <div className="text-center">
          <div className="text-xl font-mono font-black text-red-500">{limitUpCount}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">涨停</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono font-black text-green-500">{limitDownCount}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">跌停</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono font-black text-yellow-500">{consecCount}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">连板</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono font-black text-slate-400">{brokeCount}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">炸板</div>
        </div>
      </div>

      <div className="flex border-b border-white/5">
        {(['dist', 'pool'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all",
              activeTab === tab ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab === 'dist' ? '涨跌分布' : '核心龙头池'}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        {activeTab === 'dist' ? (
          <div className="h-full">
            <ReactECharts option={distOption} style={{ height: '100%', width: '100%' }} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {topStocks.map((stock, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{stock.secu_name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{stock.secu_code}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 font-black uppercase tracking-tighter italic">
                        {stock.pool_type === 'up' ? '核心' : '观察'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-base font-black font-mono",
                      (stock.change ?? 0) >= 0 ? "text-red-500" : "text-green-500"
                    )}>
                      {(stock.change ?? 0) > 0 ? '+' : ''}{(stock.change ?? 0).toFixed(2)}%
                    </div>
                    {(stock.limit_days ?? 0) > 1 && (
                      <div className="text-[10px] font-black text-orange-400 mt-0.5">{stock.limit_days}连板</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {topStocks.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">暂无实时标的</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
