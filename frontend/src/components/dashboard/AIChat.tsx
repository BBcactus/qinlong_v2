import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Plus, MessageSquare, History, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  suggestedStocks?: { name: string; code: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  lastUpdated: number;
  messages: ChatMessage[];
}

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([{
    id: '1',
    title: '默认会话',
    lastUpdated: Date.now(),
    messages: [{ role: 'ai', content: '您好，我是您的盘面军师。今天想聊聊哪些板块或个股？', timestamp: Date.now() }]
  }]);
  const [activeSessionId, setActiveSessionId] = useState('1');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId)!;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isOpen]);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: '新会话 ' + (sessions.length + 1),
      lastUpdated: Date.now(),
      messages: [{ role: 'ai', content: '您好，我是您的盘面军师。今天想聊聊哪些板块或个股？', timestamp: Date.now() }]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() }
        : s
    ));
    setInput('');
    setIsTyping(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg.content, context: {} });
      const reply: string = res.data.data?.reply ?? res.data.data ?? '（无回复）';
      const aiMsg: ChatMessage = { role: 'ai', content: reply, timestamp: Date.now() };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() }
          : s
      ));
    } catch {
      const aiMsg: ChatMessage = { role: 'ai', content: '接口暂时不可用，请稍后再试。', timestamp: Date.now() };
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() }
          : s
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col"
          >
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl" onClick={() => setIsOpen(false)} />

            <div className="relative flex-1 flex overflow-hidden p-4 lg:p-8 pb-32">
              {/* Sidebar */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 border border-white/10 bg-white/5 backdrop-blur-md rounded-[32px] flex flex-col hidden lg:flex mr-6 shadow-2xl overflow-hidden"
              >
                <div className="p-6">
                  <button onClick={handleNewChat} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                    <Plus size={18} /> 开启新对话
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                  <div className="flex items-center gap-2 px-2 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <History size={12} /> 历史会话
                  </div>
                  {sessions.map(s => (
                    <button key={s.id} onClick={() => setActiveSessionId(s.id)} className={cn("w-full p-3 rounded-xl text-left transition-all flex items-center gap-3", activeSessionId === s.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5")}>
                      <MessageSquare size={16} className={activeSessionId === s.id ? "text-blue-400" : "text-slate-600"} />
                      <div className="flex-1 truncate">
                        <div className="text-xs font-black truncate">{s.title}</div>
                        <div className="text-[10px] opacity-40 mt-0.5">{new Date(s.lastUpdated).toLocaleDateString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Chat Area */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex-1 flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
              >
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Bot size={20} className="text-blue-400" />
                    <h3 className="text-sm font-black text-white tracking-wide uppercase italic">AI 盘面军师 v2.5</h3>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {activeSession.messages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", msg.role === 'ai' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400")}>
                        {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                      </div>
                      <div className={cn("flex flex-col gap-3 max-w-[80%]", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn("p-4 rounded-3xl text-sm leading-relaxed shadow-xl font-bold", msg.role === 'ai' ? "bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5" : "bg-blue-600 text-white rounded-tr-none")}>
                          {msg.content}
                        </div>
                        {msg.role === 'ai' && msg.suggestedStocks && (
                          <div className="mt-2 w-full max-w-sm bg-black/40 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                              <span className="flex items-center gap-2"><PlusCircle size={12} /> 发现潜力标的</span>
                            </div>
                            <div className="space-y-2">
                              {msg.suggestedStocks.map((stock, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-black text-[10px]">{stock.name[0]}</div>
                                    <div>
                                      <div className="text-xs font-black text-white">{stock.name}</div>
                                      <div className="text-[9px] text-slate-500 font-mono">{stock.code}</div>
                                    </div>
                                  </div>
                                  <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white transition-all"><Plus size={14} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse"><Bot size={20} /></div>
                      <div className="bg-slate-800/80 p-4 rounded-3xl rounded-tl-none flex gap-1 items-center">
                        {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-8 pointer-events-none">
        <motion.div layout className={cn("w-full max-w-4xl h-16 glass-card rounded-full flex items-center px-3 gap-3 pointer-events-auto transition-all duration-300 shadow-2xl", isOpen ? "border-blue-500/50 ring-4 ring-blue-500/10" : "hover:border-white/20")}>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300", isOpen ? "bg-blue-600 text-white" : "bg-blue-600/20 text-blue-400")} onClick={() => setIsOpen(true)}>
            <Bot size={20} />
          </div>
          <input 
            type="text" 
            placeholder={isOpen ? "输入您的问题..." : "问问军师：今天早盘的资金主线是什么？"} 
            className="flex-1 bg-transparent border-none outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-sm text-white placeholder:text-slate-500 px-2 font-bold"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            onFocus={() => setIsOpen(true)}
          />
          <button onClick={handleSend} className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg"><Send size={18} /></button>
          {isOpen && <button onClick={() => setIsOpen(false)} className="w-10 h-10 hover:bg-white/10 text-slate-400 rounded-full flex items-center justify-center transition-all"><X size={18} /></button>}
        </motion.div>
      </div>
    </>
  );
};
