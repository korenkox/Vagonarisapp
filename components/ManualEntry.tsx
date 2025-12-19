
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AttendanceRecord, ShiftConfig } from '../types';
import { Clock, ChevronRight, Sun, Moon, Coffee, Sparkles, X, Check, TrendingUp, Calendar, Zap, Rocket, AlertTriangle, MessageSquare, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ManualEntryProps {
  onSave: (record: AttendanceRecord) => void;
  onDelete: (id: string) => void;
  user: { name?: string };
  records: AttendanceRecord[];
  shiftConfig: ShiftConfig;
}

const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
    }
};

const ManualEntry: React.FC<ManualEntryProps> = ({ onSave, onDelete, user, records = [], shiftConfig }) => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [arrivalTime, setArrivalTime] = useState('06:00');
  const [departureTime, setDepartureTime] = useState('14:30');
  const [normHours, setNormHours] = useState('8');
  const [breakMinutes, setBreakMinutes] = useState('30');

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const formattedDate = date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });

  const currentMonthRecords = records.filter(record => {
      if (!record.date) return false;
      const [y, m] = record.date.split('-').map(Number);
      return y === date.getFullYear() && m === (date.getMonth() + 1);
  });

  const monthlyStats = useMemo(() => {
    let totalWorkedMinutes = 0;
    let totalNormHoursAccumulated = 0;
    currentMonthRecords.forEach(r => {
       if (r.totalWorked) {
           const hMatch = r.totalWorked.match(/(\d+)h/);
           const mMatch = r.totalWorked.match(/(\d+)m/);
           totalWorkedMinutes += ((hMatch ? parseInt(hMatch[1]) : 0) * 60) + (mMatch ? parseInt(mMatch[1]) : 0);
       }
       if (r.normHours) totalNormHoursAccumulated += r.normHours;
    });
    const totalWorkedHours = totalWorkedMinutes / 60;
    const fund = 160; // Default work fund estimate
    const percentage = fund > 0 ? Math.round((totalWorkedHours / fund) * 100) : 0;
    return { worked: totalWorkedHours, target: totalNormHoursAccumulated, percentage, fund };
  }, [currentMonthRecords]);

  const getBossInsight = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    triggerHaptic();
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Si legendárny šéf (Vagonaris Boss). Si sebavedomý, úspešný a tvoj štýl je priamočiary, trochu drsný, ale motivačný 'boss style'. 
      Máš pred sebou dochádzku zamestnanca ${user.name}: 
      Odpracované tento mesiac: ${monthlyStats.worked.toFixed(1)}h z fondu ${monthlyStats.fund}h. 
      Aktuálna efektivita: ${monthlyStats.percentage}%.
      Daj mu jeden krátky, úderný "boss" komentár v slovenčine. Buď vtipný, použi výrazy ako "zlatá reťaz", "vagonaris", "šichta", "profit". Max 2 vety.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiInsight(response.text || "Rob ďalej, profit nečaká!");
    } catch (error) {
      setAiInsight("Dnes mi nejde signál na zlatej reťazi, makaj!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnalyze = () => {
    triggerHaptic();
    setIsAnalyzing(true);
    setTimeout(() => {
      const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
      let start = parseTime(arrivalTime), end = parseTime(departureTime);
      if (end < start) end += 24;
      const workedDecimal = Math.max(0, (end - start) - (parseInt(breakMinutes) / 60));
      const h = Math.floor(workedDecimal), mCalc = Math.round((workedDecimal - h) * 60);
      const norm = parseFloat(normHours);
      setSummaryData({ 
        workedFormatted: `${h}h ${mCalc}m`, 
        efficiency: Math.round(workedDecimal > 0 ? (norm / workedDecimal) * 100 : 0), 
        balanceFormatted: `${(workedDecimal - norm) >= 0 ? '+' : '-'}${Math.floor(Math.abs(workedDecimal - norm))}h ${Math.round((Math.abs(workedDecimal - norm) - Math.floor(Math.abs(workedDecimal - norm))) * 60)}m`, 
        isPositive: (workedDecimal - norm) >= 0, 
        normDecimal: norm 
      });
      setIsAnalyzing(false); 
      setShowSummary(true);
    }, 1000);
  };

  const handleFinalSave = () => {
    triggerHaptic();
    onSave({ 
      id: crypto.randomUUID(), 
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, 
      arrivalTime, 
      departureTime, 
      breakDuration: parseInt(breakMinutes), 
      normHours: parseFloat(normHours), 
      totalWorked: summaryData.workedFormatted, 
      balance: summaryData.balanceFormatted, 
      isPositiveBalance: summaryData.isPositive 
    });
    setShowSummary(false);
  };

  return (
    <div className="pt-2 px-4 pb-24 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Boss Branding */}
      <div className="flex justify-between items-center mb-6 pt-4">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg boss-glow-amber overflow-hidden border border-white/20">
               <img src="mascot.svg" className="w-full h-full p-2" alt="Boss" />
            </div>
            <div>
               <h1 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">VAGONARIS <span className="text-amber-500">BOSS</span></h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sledovanie zisku a času</p>
            </div>
         </div>
         <button onClick={getBossInsight} disabled={isAiLoading} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-amber-500 active:scale-90 transition-all">
            {isAiLoading ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <BrainCircuit size={20} />}
         </button>
      </div>

      {/* AI Insight Bubble */}
      {aiInsight && (
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30 animate-slide-up relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 cursor-pointer text-slate-500" onClick={() => setAiInsight(null)}><X size={14} /></div>
            <div className="flex gap-3 items-start">
                <MessageSquare size={18} className="text-amber-500 mt-1 shrink-0" />
                <p className="text-sm font-medium text-amber-100 italic">"{aiInsight}"</p>
            </div>
        </div>
      )}

      {/* Date Picker Button */}
      <button onClick={() => setIsDatePickerOpen(true)} className="w-full glass-card rounded-[28px] p-5 mb-5 flex items-center justify-between active:scale-[0.98] transition-all">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-amber-500">
               <Calendar size={22} />
            </div>
            <div className="text-left">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Aktuálna šichta</div>
               <div className="text-base font-black text-white">{formattedDate}</div>
            </div>
         </div>
         <ChevronRight className="text-slate-600" size={20} />
      </button>

      {/* Time Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
         <div className="relative glass-card rounded-[28px] p-5 overflow-hidden group">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nástup</div>
            <div className="text-2xl font-black text-white mb-1">{arrivalTime}</div>
            <div className="absolute bottom-4 right-4 text-slate-600 group-hover:text-amber-500 transition-colors"><Sun size={20} /></div>
            <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
         <div className="relative glass-card rounded-[28px] p-5 overflow-hidden group">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Padla</div>
            <div className="text-2xl font-black text-white mb-1">{departureTime}</div>
            <div className="absolute bottom-4 right-4 text-slate-600 group-hover:text-amber-500 transition-colors"><Moon size={20} /></div>
            <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
      </div>

      {/* Norm & Break */}
      <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="glass-card rounded-[24px] px-5 py-4 focus-within:ring-2 ring-amber-500/50 transition-all">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Norma (h)</label>
            <input type="number" value={normHours} onChange={(e) => setNormHours(e.target.value)} className="w-full text-xl font-black text-white bg-transparent outline-none" />
         </div>
         <div className="glass-card rounded-[24px] px-5 py-4 focus-within:ring-2 ring-blue-500/50 transition-all">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Pauza (min)</label>
            <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="w-full text-xl font-black text-white bg-transparent outline-none" />
         </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleAnalyze} 
        disabled={isAnalyzing} 
        className={`w-full relative py-5 rounded-[28px] overflow-hidden group transition-all duration-300 shadow-2xl mb-8 ${isAnalyzing ? 'scale-95 opacity-80' : 'active:scale-95'}`}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700" />
         <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
         <div className="relative z-10 flex items-center justify-center gap-3 text-slate-900">
            {isAnalyzing ? (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span className="font-black tracking-widest uppercase text-xs">Počítam profit...</span>
                </div>
            ) : (
                <>
                    <span className="font-black text-lg tracking-tight uppercase">ZAPÍSAŤ ŠICHTU</span>
                    <Zap size={20} fill="currentColor" />
                </>
            )}
         </div>
      </button>

      {/* Monthly Stats Summary */}
      <div className="glass-card rounded-[32px] p-6 mb-4 relative overflow-hidden group border-amber-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                      <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Mesačný Progress</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Cesta k zlatej reťazi</p>
                  </div>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest border border-white/5">
                {monthlyStats.percentage}%
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-1">Odpracované</span>
                  <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{monthlyStats.worked.toFixed(1)}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">hod</span>
                  </div>
              </div>
              <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-1">Zvyšok Fondu</span>
                  <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{Math.max(0, monthlyStats.fund - monthlyStats.worked).toFixed(1)}</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">hod</span>
                  </div>
              </div>
          </div>

          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, monthlyStats.percentage)}%` }}
              />
          </div>
      </div>

      {showSummary && summaryData && (
        <DaySummaryOverlay 
            data={summaryData} 
            onClose={() => setShowSummary(false)} 
            onConfirm={handleFinalSave} 
            arrival={arrivalTime} 
            departure={departureTime} 
        />
      )}
      
      <DatePickerSheet 
        isOpen={isDatePickerOpen} 
        onClose={() => setIsDatePickerOpen(false)} 
        selectedDate={date} 
        onSelect={(d: Date) => { setDate(d); setIsDatePickerOpen(false); }} 
      />
    </div>
  );
};

const DaySummaryOverlay = ({ data, onClose, onConfirm }: any) => {
    const { efficiency, workedFormatted, balanceFormatted, isPositive, normDecimal } = data;
    return createPortal(
        <div className="fixed inset-0 z-[1000] glass-card flex flex-col animate-fade-in pointer-events-auto overflow-y-auto bg-[#0f172a]/95">
            <div className="pt-12 px-6 pb-4 flex justify-between items-center bg-[#0f172a] sticky top-0 z-10">
                <button onClick={onClose} className="p-2 rounded-full active:bg-white/10"><X size={28} className="text-white" /></button>
                <h2 className="text-sm font-black uppercase tracking-widest text-amber-500">BOSS PREHĽAD</h2>
                <div className="w-10" />
            </div>
            
            <div className="p-8 flex-1 flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 flex items-center justify-center mb-10">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-[40px] animate-pulse" />
                    <svg width="224" height="224" viewBox="0 0 240 240" className="transform -rotate-90">
                        <circle cx="120" cy="120" r="100" stroke="rgba(255,255,255,0.05)" strokeWidth="20" fill="none" />
                        <circle 
                            cx="120" cy="120" r="100" 
                            stroke={isPositive ? '#f59e0b' : '#ef4444'} 
                            strokeWidth="20" fill="none" 
                            strokeDasharray={628} 
                            strokeDashoffset={628 - (Math.min(efficiency, 100) / 100) * 628} 
                            strokeLinecap="round" 
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <div className={`text-5xl font-black ${isPositive ? 'text-white' : 'text-red-500'} tracking-tighter`}>{efficiency}%</div>
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mt-1">EFEKTIVITA</div>
                    </div>
                </div>

                <div className={`flex items-center gap-3 px-8 py-4 rounded-[32px] mb-10 shadow-2xl ${isPositive ? 'bg-amber-500 text-slate-900' : 'bg-red-600 text-white'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">BILANCIA:</span>
                    <span className="font-black text-2xl tracking-tighter">{balanceFormatted}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="glass-card p-6 rounded-[32px] flex flex-col items-center border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Makal si</div>
                        <div className="text-2xl font-black text-white">{workedFormatted}</div>
                    </div>
                    <div className="glass-card p-6 rounded-[32px] flex flex-col items-center border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Plán bol</div>
                        <div className="text-2xl font-black text-white">{normDecimal}h</div>
                    </div>
                </div>
            </div>

            <div className="p-8 pb-12 bg-[#0f172a] border-t border-white/5 safe-area-pb">
                <button onClick={onConfirm} className="w-full py-6 bg-amber-500 text-slate-900 rounded-[32px] font-black text-xl shadow-[0_20px_40px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-tight">
                    <Check size={28} strokeWidth={3} /> POTVRDIŤ PROFIT
                </button>
            </div>
        </div>, document.body
    );
};

const DatePickerSheet = ({ isOpen, onClose, selectedDate, onSelect }: any) => {
   const [viewDate, setViewDate] = useState(selectedDate || new Date());
   useEffect(() => { if (isOpen && selectedDate) setViewDate(selectedDate); }, [isOpen, selectedDate]);
   const year = viewDate.getFullYear(), month = viewDate.getMonth();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const startDay = (new Date(year, month, 1).getDay() || 7) - 1;
   if (!isOpen) return null;
   return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-end justify-center">
         <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={onClose} />
         <div className="bg-[#0f172a] border-t border-white/10 w-full max-w-lg rounded-t-[40px] p-8 pb-12 z-10 animate-slide-up">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">KALENDÁR ŠICHITY</h3>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400"><X size={20} /></button>
             </div>
             
             <div className="grid grid-cols-7 gap-y-3 place-items-center mb-4">
                {['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'].map(d => <div key={d} className="text-[10px] font-black text-slate-600 tracking-widest">{d}</div>)}
                {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => { 
                    const d = i + 1; 
                    const sel = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year; 
                    return (
                        <button 
                            key={d} 
                            onClick={() => onSelect(new Date(year, month, d))} 
                            className={`w-11 h-11 rounded-2xl text-sm font-bold flex items-center justify-center transition-all ${sel ? 'bg-amber-500 text-slate-900 shadow-lg boss-glow-amber' : 'text-slate-400 hover:bg-white/5 active:bg-white/10'}`}
                        >
                            {d}
                        </button>
                    ); 
                })}
             </div>
         </div>
      </div>, document.body
   );
};

export default ManualEntry;
