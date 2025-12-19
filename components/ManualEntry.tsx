
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AttendanceRecord, ShiftConfig } from '../types';
import { Clock, ChevronRight, ChevronLeft, Sun, Moon, Briefcase, Coffee, Sparkles, X, Check, Share2, TrendingUp, TrendingDown, CalendarDays, AlertTriangle, Rocket, Train, Trash2, Calendar, Zap } from 'lucide-react';

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

const useCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const start = 0;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(start + (end - start) * ease);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

const SHIFT_ICONS: Record<string, React.ReactNode> = {
  'R': <Sun size={14} />,
  'P': <Zap size={14} />,
  'N': <Moon size={14} />,
  'V': <Coffee size={14} />
};

const ManualEntry: React.FC<ManualEntryProps> = ({ onSave, onDelete, user, records = [], shiftConfig }) => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const visibleRecords = isExpanded ? currentMonthRecords : currentMonthRecords.slice(0, 2);

  const getShiftForDate = (dateStr: string) => {
    if (!shiftConfig.isActive || !shiftConfig.cycle || shiftConfig.cycle.length === 0) return 'V';
    const [y, m, d] = dateStr.split('-').map(Number);
    const checkDate = new Date(y, m - 1, d);
    const startDate = new Date(shiftConfig.startDate);
    checkDate.setHours(0,0,0,0);
    startDate.setHours(0,0,0,0);
    const diffTime = checkDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycleLength = shiftConfig.cycle.length;
    let position = diffDays % cycleLength;
    if (position < 0) position += cycleLength;
    return shiftConfig.cycle[position];
  };

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
    const percentage = totalWorkedHours > 0 ? (totalNormHoursAccumulated / totalWorkedHours) * 100 : 0;
    const balance = totalNormHoursAccumulated - totalWorkedHours;
    let fund = 0;
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        if (shiftConfig.isActive && shiftConfig.cycle) {
            const checkDate = new Date(date.getFullYear(), date.getMonth(), d);
            const startDateObj = new Date(shiftConfig.startDate);
            checkDate.setHours(0,0,0,0);
            startDateObj.setHours(0,0,0,0);
            const diffDays = Math.floor((checkDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
            let position = diffDays % shiftConfig.cycle.length;
            if (position < 0) position += shiftConfig.cycle.length;
            if (shiftConfig.cycle[position] !== 'V') fund += (shiftConfig.shiftLength || 8);
        } else {
            const day = new Date(date.getFullYear(), date.getMonth(), d).getDay();
            if (day !== 0 && day !== 6) fund += 8;
        }
    }
    return { worked: totalWorkedHours, target: totalNormHoursAccumulated, percentage: Math.round(percentage), balance, fund };
  }, [currentMonthRecords, date, shiftConfig]);

  const animatedPercentage = useCounter(monthlyStats.percentage, 1000);
  const animatedWorked = useCounter(monthlyStats.worked, 1000);

  const getTheme = (pct: number) => {
      if (pct > 100) return { type: 'green', primaryColor: '#38A169', lightBg: '#F0FFF4', gradientStart: '#68D391', gradientEnd: '#2F855A', headerIcon: '🚀', footerText: 'Skvelý výkon', statusIcon: <Rocket size={12} className="text-[#38A169]" />, glow: 'radial-gradient(circle, rgba(104, 211, 145, 0.4) 0%, rgba(56, 161, 105, 0.1) 60%, rgba(255,255,255,0) 80%)', noEffects: false };
      if (pct >= 95) return { type: 'blue', primaryColor: '#3182CE', lightBg: '#EBF8FF', gradientStart: '#63B3ED', gradientEnd: '#2B6CB0', headerIcon: '✓', footerText: 'Plnenie plánu', statusIcon: <Check size={12} strokeWidth={4} className="text-[#3182CE]" />, glow: 'none', noEffects: true };
      return { type: 'red', primaryColor: '#E93B3B', lightBg: '#FFF5F5', gradientStart: '#FF6B6B', gradientEnd: '#C53030', headerIcon: '!', footerText: 'Pozor na výkon', statusIcon: <AlertTriangle size={12} className="text-[#E93B3B]" />, glow: 'radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, rgba(233, 59, 59, 0.1) 60%, rgba(255,255,255,0) 80%)', noEffects: false };
  };

  const theme = getTheme(monthlyStats.percentage);
  const dateBadgeText = `${["JAN", "FEB", "MAR", "APR", "MÁJ", "JÚN", "JÚL", "AUG", "SEP", "OKT", "NOV", "DEC"][date.getMonth()]} ${date.getFullYear()}`;
  const strokeDashoffset = (2 * Math.PI * 60) - (Math.max(0, Math.min(animatedPercentage, 100)) / 100) * (2 * Math.PI * 60);

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
      setSummaryData({ workedFormatted: `${h}h ${mCalc}m`, efficiency: Math.round(workedDecimal > 0 ? (norm / workedDecimal) * 100 : 0), balanceFormatted: `${(norm - workedDecimal) >= 0 ? '+' : '-'}${Math.floor(Math.abs(norm - workedDecimal))}h ${Math.round((Math.abs(norm - workedDecimal) - Math.floor(Math.abs(norm - workedDecimal))) * 60)}m`, isPositive: (norm - workedDecimal) >= 0, normDecimal: norm });
      setIsAnalyzing(false); setShowSummary(true);
    }, 1200);
  };

  const handleFinalSave = () => {
    triggerHaptic();
    onSave({ id: crypto.randomUUID(), date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, arrivalTime, departureTime, breakDuration: parseInt(breakMinutes), normHours: parseFloat(normHours), totalWorked: summaryData.workedFormatted, balance: summaryData.balanceFormatted, isPositiveBalance: summaryData.isPositive });
    setShowSummary(false);
  };

  const formatRecordDate = (dateStr: string) => {
    const d = new Date(dateStr.split('-').map(Number)[0], dateStr.split('-').map(Number)[1] - 1, dateStr.split('-').map(Number)[2]);
    const today = new Date(); today.setHours(0,0,0,0);
    return d.getTime() === today.getTime() ? 'Dnes' : d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="pt-2 px-4 pb-24 animate-fade-in font-sans w-full max-w-full overflow-x-hidden">
      <div className="flex justify-between items-center mb-4 pt-2">
         <div>
            <div className="flex items-center gap-2 mb-1">
               <Train size={18} className="text-blue-600" />
               <span className="text-[10px] font-bold text-gray-500 tracking-widest">VAGONARIS TRACKER</span>
            </div>
            <h1 className="text-lg font-light text-gray-800 leading-tight">
              Ahoj, <span className="font-bold text-gray-900">{user.name?.split(' ')[0] || 'Tester'}</span>
            </h1>
         </div>
      </div>

      <button onClick={() => setIsDatePickerOpen(true)} className="w-full bg-white rounded-[24px] p-4 mb-4 flex items-center justify-between shadow-lg shadow-blue-900/5 cursor-pointer active:scale-[0.98] transition-all group">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
               <Calendar size={18} />
            </div>
            <div className="text-left">
               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Dnešný dátum</div>
               <div className="text-sm font-bold text-gray-900">{formattedDate}</div>
            </div>
         </div>
         <ChevronRight className="text-gray-300" size={18} />
      </button>

      <div className="grid grid-cols-2 gap-3 mb-3">
         <div className="relative bg-white rounded-[24px] p-4 shadow-lg shadow-blue-900/5 overflow-hidden active:bg-gray-50 transition-colors">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Príchod</div>
            <div className="text-xl font-light text-gray-800 mb-1">{arrivalTime}</div>
            <div className="absolute bottom-3 right-3 text-gray-300"><Sun size={18} /></div>
            <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
         <div className="relative bg-white rounded-[24px] p-4 shadow-lg shadow-blue-900/5 overflow-hidden active:bg-gray-50 transition-colors">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odchod</div>
            <div className="text-xl font-light text-gray-800 mb-1">{departureTime}</div>
            <div className="absolute bottom-3 right-3 text-gray-300"><Moon size={18} /></div>
            <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
         <div className="bg-white rounded-[20px] px-4 py-3 flex flex-col justify-center shadow-lg shadow-blue-900/5 border border-transparent focus-within:border-blue-100 transition-all">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Norma (h)</label>
            <input type="number" value={normHours} onChange={(e) => setNormHours(e.target.value)} className="w-full text-lg font-light text-gray-800 bg-transparent outline-none" />
         </div>
         <div className="bg-white rounded-[20px] px-4 py-3 flex flex-col justify-center shadow-lg shadow-blue-900/5 border border-transparent focus-within:border-orange-100 transition-all">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pauza (m)</label>
            <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="w-full text-lg font-light text-gray-800 bg-transparent outline-none" />
         </div>
      </div>

      <button onClick={handleAnalyze} disabled={isAnalyzing} className={`w-full relative py-4 rounded-[20px] overflow-hidden group transition-all duration-500 shadow-xl mb-6 ${isAnalyzing ? 'opacity-90 scale-95' : 'active:scale-95'}`}>
         <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b]" />
         <div className="relative z-10 flex items-center justify-center gap-3 text-white">
            {isAnalyzing ? <span className="font-bold tracking-wider text-xs uppercase">Analyzujem...</span> : <><span className="font-bold text-base tracking-wide">Vytvoriť Záznam</span><Sparkles size={18} /></>}
         </div>
      </button>

      <div className={`w-full rounded-[32px] p-5 shadow-xl relative overflow-hidden bg-white mb-6 transition-all duration-500 ${theme.noEffects ? 'no-effects' : ''}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md transition-colors" style={{ backgroundColor: theme.lightBg, color: theme.primaryColor }}>{theme.headerIcon}</div>
                  <div className="text-sm font-black text-[#2D3748] leading-tight uppercase tracking-tighter">MESAČNÝ<br />VÝKON</div>
              </div>
              <div className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm border" style={{ borderColor: theme.lightBg, color: theme.primaryColor }}>{dateBadgeText}</div>
          </div>
          <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <div className="absolute w-full h-full rounded-full animate-pulse-slow opacity-20" style={{ background: theme.glow }} />
                  <svg width="112" height="112" viewBox="0 0 160 160" className="transform -rotate-90">
                      <circle cx="80" cy="80" r="60" fill="none" stroke="#EDF2F7" strokeWidth="12" strokeLinecap="round" />
                      <circle cx="80" cy="80" r="60" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={377} strokeDashoffset={strokeDashoffset} style={{ stroke: theme.primaryColor, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))', transition: 'stroke-dashoffset 0.8s' }} />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                      <div className="text-xl font-black leading-none" style={{ color: theme.primaryColor }}>{Math.floor(animatedPercentage)}%</div>
                      <div className="text-[7px] font-bold text-gray-400 uppercase mt-1">Účinnosť</div>
                  </div>
              </div>
              <div className="flex-1 min-w-0 p-4 rounded-2xl flex flex-col justify-center h-24" style={{ backgroundColor: theme.lightBg }}>
                    <div className="text-[9px] font-black uppercase mb-1 flex justify-between items-center" style={{ color: theme.primaryColor }}>Odpracované <Clock size={12} /></div>
                    <div className="text-2xl font-black truncate" style={{ color: theme.primaryColor }}>{animatedWorked.toFixed(1)}<span className="text-xs font-bold ml-1">h</span></div>
              </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div><h4 className="text-[8px] text-gray-400 uppercase font-black">Fond</h4><p className="text-sm font-black text-gray-800">{monthlyStats.fund}h</p></div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div><h4 className="text-[8px] text-gray-400 uppercase font-black">Norma</h4><p className="text-sm font-black text-gray-800">{monthlyStats.target}h</p></div>
              </div>
          </div>
      </div>
      
      <div className="flex justify-between items-end mb-3">
         <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">História</h3>
         {currentMonthRecords.length > 2 && <button onClick={() => setIsExpanded(!isExpanded)} className="text-[10px] font-bold text-blue-600">{isExpanded ? 'Menej' : 'Všetko'}</button>}
      </div>

      <div className="space-y-2">
        {visibleRecords.length > 0 ? visibleRecords.map(record => {
           const code = getShiftForDate(record.date);
           return (
           <button key={record.id} onClick={() => setSelectedRecord(record)} className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-md border border-white active:scale-95 transition-all text-left">
              <div className={`w-1 h-8 rounded-full ${record.isPositiveBalance !== false ? 'bg-teal-400' : 'bg-rose-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-xs truncate">{formatRecordDate(record.date)}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-gray-400 uppercase font-bold">{record.totalWorked}</span>
                  <div className="flex items-center gap-1 px-1 py-0.5 bg-gray-50 rounded border border-gray-100">
                    <span className="text-[8px] font-black text-gray-500">{code}</span>
                  </div>
                </div>
              </div>
              <div className={`font-black text-[10px] px-2 py-0.5 rounded-full ${record.isPositiveBalance !== false ? 'text-teal-600 bg-teal-50' : 'text-rose-600 bg-rose-50'}`}>{record.balance}</div>
           </button>
        )}) : <div className="bg-white rounded-2xl p-4 flex items-center justify-center text-gray-400 text-xs shadow-sm italic">Žiadne záznamy</div>}
      </div>
      
      <DatePickerSheet isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={date} onSelect={(d: Date) => { setDate(d); setIsDatePickerOpen(false); }} />
      {showSummary && summaryData && <DaySummaryOverlay data={summaryData} onClose={() => setShowSummary(false)} onConfirm={handleFinalSave} arrival={arrivalTime} departure={departureTime} />}
      <RecordActionSheet isOpen={!!selectedRecord} record={selectedRecord} onClose={() => setSelectedRecord(null)} onDelete={() => selectedRecord && onDelete(selectedRecord.id)} />
    </div>
  );
};

const RecordActionSheet = ({ isOpen, record, onClose, onDelete }: any) => {
    if (!isOpen || !record) return null;
    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-end justify-center pointer-events-none">
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={onClose} />
             <div className="bg-white w-full max-w-sm rounded-t-[32px] p-6 pb-8 z-10 shadow-2xl animate-slide-up pointer-events-auto">
                 <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
                 <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold"><CalendarDays size={24} /></div>
                     <div><h3 className="text-base font-bold text-gray-900">{new Date(record.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })}</h3><div className="text-xs text-gray-500">Detail záznamu</div></div>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                     <div><div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Príchod</div><div className="text-base font-bold text-gray-800">{record.arrivalTime}</div></div>
                     <div><div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odchod</div><div className="text-base font-bold text-gray-800">{record.departureTime}</div></div>
                 </div>
                 <button onClick={() => { onDelete(); onClose(); }} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"><Trash2 size={18} /> Odstrániť</button>
                 <button onClick={onClose} className="w-full py-4 text-gray-500 font-bold text-sm">Zrušiť</button>
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
      <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
         <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={onClose} />
         <div className="bg-white w-full max-w-sm rounded-t-[32px] p-6 pb-10 z-10 animate-slide-up pointer-events-auto">
             <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-800">Vyberte dátum</h3><button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X size={18} /></button></div>
             <div className="flex justify-between items-center mb-6"><button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2"><ChevronLeft size={24} /></button><div className="font-bold text-sm uppercase tracking-widest">{["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"][month]} {year}</div><button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2"><ChevronRight size={24} /></button></div>
             <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'].map(d => <div key={d} className="text-[8px] font-black text-gray-300">{d}</div>)}
                {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => { const d = i + 1; const sel = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year; return <button key={d} onClick={() => onSelect(new Date(year, month, d))} className={`w-9 h-9 rounded-xl text-xs flex items-center justify-center ${sel ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 active:bg-gray-100'}`}>{d}</button>; })}
             </div>
         </div>
      </div>, document.body
   );
};

const DaySummaryOverlay = ({ data, onClose, onConfirm, arrival, departure }: any) => {
    const { efficiency, workedFormatted, balanceFormatted, isPositive, normDecimal } = data;
    return createPortal(
        <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col animate-fade-in pointer-events-auto overflow-y-auto">
            <div className="pt-12 px-6 pb-4 flex justify-between items-center bg-white sticky top-0 z-10"><button onClick={onClose} className="p-2 rounded-full active:bg-gray-100"><X size={24} /></button><h2 className="text-sm font-black uppercase tracking-widest">Prehľad Dňa</h2><div className="w-10" /></div>
            <div className="p-6 flex-1 flex flex-col items-center">
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    <svg width="192" height="192" viewBox="0 0 240 240" className="transform -rotate-90">
                        <circle cx="120" cy="120" r="90" stroke="#f3f4f6" strokeWidth="18" fill="none" />
                        <circle cx="120" cy="120" r="90" stroke={isPositive ? '#2dd4bf' : '#f43f5e'} strokeWidth="18" fill="none" strokeDasharray={565} strokeDashoffset={565 - (Math.min(efficiency, 100) / 100) * 565} strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <div className={`text-4xl font-black ${isPositive ? 'text-teal-500' : 'text-rose-500'}`}>{efficiency}%</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Výkon</div>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-6 py-3 rounded-full mb-8 shadow-sm ${isPositive ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}><span className="font-black text-xl">{balanceFormatted}</span></div>
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center"><div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Odpracované</div><div className="text-xl font-black text-gray-800">{workedFormatted}</div></div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center"><div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Norma</div><div className="text-xl font-black text-gray-800">{normDecimal}h</div></div>
                </div>
            </div>
            <div className="p-6 bg-white border-t border-gray-100 safe-area-pb"><button onClick={onConfirm} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Check size={20} /> Uložiť</button></div>
        </div>, document.body
    );
};

export default ManualEntry;
