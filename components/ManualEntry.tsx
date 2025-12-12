
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AttendanceRecord, ShiftConfig } from '../types';
import { Clock, ChevronRight, ChevronLeft, Sun, Moon, Briefcase, Coffee, Sparkles, X, Check, Share2, TrendingUp, TrendingDown, CalendarDays, AlertTriangle, Rocket, Train, Trash2, Calendar } from 'lucide-react';

interface ManualEntryProps {
  onSave: (record: AttendanceRecord) => void;
  onDelete: (id: string) => void;
  user: { name?: string };
  records: AttendanceRecord[];
  shiftConfig: ShiftConfig;
}

// --- Helper Hook for Counting Numbers ---
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

const ManualEntry: React.FC<ManualEntryProps> = ({ onSave, onDelete, user, records = [], shiftConfig }) => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // State for inputs
  const [arrivalTime, setArrivalTime] = useState('06:00');
  const [departureTime, setDepartureTime] = useState('14:30');
  const [normHours, setNormHours] = useState('8');
  const [breakMinutes, setBreakMinutes] = useState('30');

  // State for Summary View
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  // State for managing record details/deletion
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const formattedDate = date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    setIsExpanded(false);
  }, [date.getMonth(), date.getFullYear()]);

  const currentMonthRecords = records.filter(record => {
      if (!record.date) return false;
      const [y, m] = record.date.split('-').map(Number);
      return y === date.getFullYear() && m === (date.getMonth() + 1);
  });

  const visibleRecords = isExpanded ? currentMonthRecords : currentMonthRecords.slice(0, 2);

  // --- Monthly Stats Calculation ---
  const monthlyStats = useMemo(() => {
    let totalWorkedMinutes = 0;
    let totalNormHoursAccumulated = 0;

    currentMonthRecords.forEach(r => {
       if (r.totalWorked) {
           const hMatch = r.totalWorked.match(/(\d+)h/);
           const mMatch = r.totalWorked.match(/(\d+)m/);
           const h = hMatch ? parseInt(hMatch[1]) : 0;
           const m = mMatch ? parseInt(mMatch[1]) : 0;
           totalWorkedMinutes += (h * 60) + m;
       }
       if (r.normHours) {
           totalNormHoursAccumulated += r.normHours;
       }
    });

    const totalWorkedHours = totalWorkedMinutes / 60;
    const percentage = totalWorkedHours > 0 ? (totalNormHoursAccumulated / totalWorkedHours) * 100 : 0;
    const balance = totalNormHoursAccumulated - totalWorkedHours; 

    // Calculate Calendar Fund
    let fund = 0;
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        if (shiftConfig.isActive && shiftConfig.cycle) {
            const checkDate = new Date(date.getFullYear(), date.getMonth(), d);
            const startDateObj = new Date(shiftConfig.startDate);
            checkDate.setHours(0,0,0,0);
            startDateObj.setHours(0,0,0,0);
            const diffTime = checkDate.getTime() - startDateObj.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const cycleLength = shiftConfig.cycle.length;
            let position = diffDays % cycleLength;
            if (position < 0) position += cycleLength;
            const code = shiftConfig.cycle[position];
            if (code !== 'V') fund += (shiftConfig.shiftLength || 8);
        } else {
            const day = new Date(date.getFullYear(), date.getMonth(), d).getDay();
            if (day !== 0 && day !== 6) fund += 8;
        }
    }

    return {
        worked: totalWorkedHours,
        target: totalNormHoursAccumulated,
        percentage: Math.round(percentage),
        balance: balance,
        fund: fund
    };
  }, [currentMonthRecords, date, shiftConfig]);

  const animatedPercentage = useCounter(monthlyStats.percentage, 1000);
  const animatedWorked = useCounter(monthlyStats.worked, 1000);

  const getTheme = (pct: number) => {
      if (pct > 100) {
          return {
              type: 'green',
              primaryColor: '#38A169',
              lightBg: '#F0FFF4',
              gradientStart: '#68D391',
              gradientEnd: '#2F855A',
              iconText: '🚀',
              headerIcon: '🚀',
              footerText: 'Skvelý výkon',
              statusIcon: <Rocket size={12} className="text-[#38A169]" />,
              glow: 'radial-gradient(circle, rgba(104, 211, 145, 0.4) 0%, rgba(56, 161, 105, 0.1) 60%, rgba(255,255,255,0) 80%)',
              noEffects: false
          };
      }
      if (pct >= 95) {
          return {
              type: 'blue',
              primaryColor: '#3182CE',
              lightBg: '#EBF8FF',
              gradientStart: '#63B3ED',
              gradientEnd: '#2B6CB0',
              iconText: '✓',
              headerIcon: '✓',
              footerText: 'Plnenie plánu',
              statusIcon: <Check size={12} strokeWidth={4} className="text-[#3182CE]" />,
              glow: 'none',
              noEffects: true
          };
      }
      return {
          type: 'red',
          primaryColor: '#E93B3B',
          lightBg: '#FFF5F5',
          gradientStart: '#FF6B6B',
          gradientEnd: '#C53030',
          iconText: '!',
          headerIcon: '!',
          footerText: 'Pozor: Výkon pod limitom',
          statusIcon: <AlertTriangle size={12} className="text-[#E93B3B]" />,
          glow: 'radial-gradient(circle, rgba(255, 107, 107, 0.4) 0%, rgba(233, 59, 59, 0.1) 60%, rgba(255,255,255,0) 80%)',
          noEffects: false
      };
  };

  const theme = getTheme(monthlyStats.percentage);
  const monthNamesShort = ["JAN", "FEB", "MAR", "APR", "MÁJ", "JÚN", "JÚL", "AUG", "SEP", "OKT", "NOV", "DEC"];
  const dateBadgeText = `${monthNamesShort[date.getMonth()]} ${date.getFullYear()}`;

  // SVG Chart Calculations
  const safePercentage = Math.max(0, Math.min(animatedPercentage, 100));
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // approx 377
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
      };
      let start = parseTime(arrivalTime);
      let end = parseTime(departureTime);
      if (end < start) end += 24;
      const brk = parseInt(breakMinutes) / 60;
      const norm = parseFloat(normHours);
      const workedDecimal = Math.max(0, (end - start) - brk);
      const h = Math.floor(workedDecimal);
      const mCalc = Math.round((workedDecimal - h) * 60);
      const efficiency = workedDecimal > 0 ? (norm / workedDecimal) * 100 : 0;
      const balanceDecimal = norm - workedDecimal;
      const balanceH = Math.floor(Math.abs(balanceDecimal));
      const balanceM = Math.round((Math.abs(balanceDecimal) - balanceH) * 60);

      setSummaryData({
        workedFormatted: `${h}h ${mCalc}m`,
        efficiency: Math.round(efficiency),
        balanceFormatted: `${balanceDecimal >= 0 ? '+' : '-'}${balanceH}h ${balanceM}m`,
        isPositive: balanceDecimal >= 0,
        normDecimal: norm,
        workedDecimal: workedDecimal
      });
      setIsAnalyzing(false);
      setShowSummary(true);
    }, 1200);
  };

  const handleFinalSave = () => {
    if (!summaryData) return;
    const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onSave({
      id: crypto.randomUUID(),
      date: localDateStr,
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

  const handleDeleteRecord = (id: string) => {
      onDelete(id);
      setSelectedRecord(null);
  };

  const formatRecordDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const recordDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (recordDate.getTime() === today.getTime()) return 'Dnes';
    if (recordDate.getTime() === yesterday.getTime()) return 'Včera';
    return recordDate.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="pt-2 px-5 pb-24 animate-fade-in font-sans relative compact-mode-padding">
      <style>{`
        @keyframes pulseGlow { 0% { transform: scale(0.95); opacity: 0.2; } 50% { transform: scale(1.1); opacity: 0.5; } 100% { transform: scale(0.95); opacity: 0.2; } }
        @keyframes pulseWholeGraph { 0% { transform: rotate(-90deg) scale(1); } 50% { transform: rotate(-90deg) scale(1.05); } 100% { transform: rotate(-90deg) scale(1); } }
        @keyframes pulseText { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.08); } 100% { transform: translate(-50%, -50%) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
        @keyframes slideUpFade { to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { left: -100%; } 10% { left: 100%; } 100% { left: 100%; } }
        .chart-glow { animation: pulseGlow 2s infinite ease-in-out; }
        .svg-animate { animation: pulseWholeGraph 2s infinite ease-in-out; }
        .dashed-outer { transform-origin: 80px 80px; animation: spin 30s linear infinite; }
        .text-pulse { animation: pulseText 2s infinite ease-in-out; }
        .status-icon-anim { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards, float 3s ease-in-out 1.1s infinite; transform: scale(0); }
        .stat-shimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: shimmer 5s infinite; }
        .no-effects .chart-glow { display: none; }
        .no-effects .svg-animate { animation: none !important; transform: rotate(-90deg) !important; }
        .no-effects .dashed-outer { animation: none !important; }
        .no-effects .text-pulse { animation: none !important; }
        .stat-row-1 { opacity: 0; transform: translateY(10px); animation: slideUpFade 0.6s ease-out 0.7s forwards; }
        .stat-row-2 { opacity: 0; transform: translateY(10px); animation: slideUpFade 0.6s ease-out 0.9s forwards; }
        .label-appear { opacity: 0; transform: translateY(5px); animation: slideUpFade 0.5s ease-out 1.2s forwards; }
        .footer-appear { opacity: 0; animation: slideUpFade 1s ease-out 1.5s forwards; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-2">
         <div>
            <div className="flex items-center gap-2 mb-1">
               <Train size={20} className="text-blue-600" />
               <span className="text-[10px] font-bold text-gray-500 tracking-widest">VAGONARIS TRACKER</span>
            </div>
            <h1 className="text-xl font-light text-gray-800 leading-tight">
              Dobrý deň, <span className="font-bold text-gray-900">{user.name || 'Tester'}</span>
            </h1>
         </div>
      </div>

      {/* Date Card */}
      <button onClick={() => setIsDatePickerOpen(true)} className="w-full bg-white rounded-[28px] p-4 mb-4 flex items-center justify-between shadow-lg shadow-blue-900/5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div className="text-left">
               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Dnešný dátum</div>
               <div className="text-base font-bold text-gray-900">{formattedDate}</div>
            </div>
         </div>
         <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
      </button>

      {/* Input Rows */}
      <div className="flex gap-3 mb-3">
         <div className="relative flex-1 bg-white rounded-[28px] p-4 shadow-lg shadow-blue-900/5 overflow-hidden group hover:shadow-xl transition-all">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-teal-500 transition-colors">Príchod</div>
            <div className="text-2xl font-light text-gray-800 mb-1 pointer-events-none relative z-0">{arrivalTime}</div>
            <div className="absolute bottom-3 right-3 text-gray-300 group-hover:text-teal-500 transition-all pointer-events-none"><Sun size={20} /></div>
            <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" style={{ display: 'block' }} />
         </div>
         <div className="relative flex-1 bg-white rounded-[28px] p-4 shadow-lg shadow-blue-900/5 overflow-hidden group hover:shadow-xl transition-all">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Odchod</div>
            <div className="text-2xl font-light text-gray-800 mb-1 pointer-events-none relative z-0">{departureTime}</div>
            <div className="absolute bottom-3 right-3 text-gray-300 group-hover:text-indigo-500 transition-all pointer-events-none"><Moon size={20} /></div>
            <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" style={{ display: 'block' }} />
         </div>
      </div>

      <div className="flex gap-3 mb-5">
         <div className="flex-1 bg-white rounded-[20px] px-5 py-3 flex flex-col justify-center shadow-lg shadow-blue-900/5 border border-transparent focus-within:border-blue-100 transition-all">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Norma</label>
            <div className="flex items-baseline gap-1">
               <input type="number" value={normHours} onChange={(e) => setNormHours(e.target.value)} className="w-full text-lg font-light text-gray-800 bg-transparent outline-none p-0 m-0" />
               <span className="text-xs text-gray-400 font-medium">h</span>
            </div>
         </div>
         <div className="flex-1 bg-white rounded-[20px] px-5 py-3 flex flex-col justify-center shadow-lg shadow-blue-900/5 border border-transparent focus-within:border-orange-100 transition-all">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pauza</label>
            <div className="flex items-baseline gap-1">
               <input type="number" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="w-full text-lg font-light text-gray-800 bg-transparent outline-none p-0 m-0" />
               <span className="text-xs text-gray-400 font-medium">m</span>
            </div>
         </div>
      </div>

      <button onClick={handleAnalyze} disabled={isAnalyzing} className={`w-full relative py-4 rounded-[20px] overflow-hidden group transition-all duration-500 shadow-[0_15px_30px_-10px_rgba(15,23,42,0.3)] mb-6 ${isAnalyzing ? 'opacity-90' : 'hover:scale-[1.01]'}`}>
         <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
         <div className="relative z-10 flex items-center justify-center gap-3 text-white">
            {isAnalyzing ? <span className="font-bold tracking-wider text-xs uppercase">Analyzujem...</span> : <><span className="font-bold text-base tracking-wide">Vytvoriť Prehľad</span><Sparkles size={18} /></>}
         </div>
      </button>

      {/* --- MESAČNÝ VÝKON CARD --- */}
      <div className={`w-full rounded-[40px] p-[22px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] relative overflow-hidden bg-white mb-8 transition-all duration-500 ${theme.noEffects ? 'no-effects' : ''}`}>
          
          <div className="flex justify-between items-start mb-[20px] relative z-10">
              <div className="flex gap-[15px] items-center">
                  <div className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center font-[800] text-[1.2rem] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-colors duration-500" style={{ backgroundColor: theme.lightBg, color: theme.primaryColor }}>{theme.headerIcon}</div>
                  <div className="text-[1.15rem] font-[800] text-[#2D3748] leading-[1.2] uppercase tracking-tighter">MESAČNÝ<br />VÝKON</div>
              </div>
              <div className="px-[14px] py-[8px] rounded-[20px] text-[0.75rem] font-[800] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.03)] border transition-all duration-500" style={{ borderColor: theme.lightBg, color: theme.primaryColor, backgroundColor: 'rgba(255,255,255,0.5)' }}>{dateBadgeText}</div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2 relative z-10">
              {/* Chart - Fixed width and height to prevent squashing on PC */}
              <div className="relative w-[130px] h-[130px] flex-shrink-0 flex items-center justify-center -ml-2">
                  <div className="absolute w-full h-full rounded-full chart-glow transition-all duration-500" style={{ background: theme.glow }} />
                  {/* SVG must have preserveAspectRatio to avoid distortion */}
                  <svg width="130" height="130" viewBox="0 0 160 160" className="relative z-10 overflow-visible svg-animate" preserveAspectRatio="xMidYMid meet">
                      <defs>
                          <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF6B6B" /><stop offset="100%" stopColor="#C53030" /></linearGradient>
                          <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#63B3ED" /><stop offset="100%" stopColor="#2B6CB0" /></linearGradient>
                          <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#68D391" /><stop offset="100%" stopColor="#2F855A" /></linearGradient>
                      </defs>
                      <circle cx="80" cy="80" r="76" className="dashed-outer" fill="none" strokeWidth="1.5" strokeDasharray="3 5" style={{ stroke: theme.gradientStart, opacity: 0.4 }} />
                      <circle cx="80" cy="80" r="60" fill="none" stroke="#EDF2F7" strokeWidth="14" strokeLinecap="round" />
                      <circle 
                          cx="80" cy="80" r="60" 
                          fill="none" 
                          strokeWidth="14" 
                          strokeLinecap="round"
                          strokeDasharray={377}
                          strokeDashoffset={strokeDashoffset}
                          style={{ 
                              stroke: theme.type === 'blue' ? 'url(#gradientBlue)' : theme.type === 'green' ? 'url(#gradientGreen)' : 'url(#gradientRed)',
                              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))',
                              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
                          }}
                      />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center text-pulse">
                      <div className="text-[1.6rem] font-[800] leading-none bg-clip-text text-transparent transition-all duration-500" style={{ backgroundImage: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})` }}>
                          {Math.floor(animatedPercentage)}<span className="text-[0.9rem] text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})` }}>%</span>
                      </div>
                      <div className="text-[0.5rem] font-[700] text-[#A0AEC0] uppercase mt-[4px] tracking-[0.05em] label-appear">Účinnosť</div>
                  </div>
                  <div className="absolute top-[22px] right-[18px] w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.15)] z-30 status-icon-anim" style={{ color: theme.primaryColor }}>
                       {React.cloneElement(theme.statusIcon as React.ReactElement<any>, { size: 10 })}
                  </div>
              </div>
              
              <div className="stat-shimmer flex-1 min-w-0 p-[15px_18px] rounded-[20px] relative overflow-hidden transition-colors duration-500 flex flex-col justify-center h-[110px]" style={{ backgroundColor: theme.lightBg }}>
                    <div className="text-[0.65rem] font-[700] uppercase mb-[6px] flex justify-between items-center transition-colors duration-500" style={{ color: theme.primaryColor }}>Odpracované <Clock size={14} /></div>
                    <div className="text-[1.8rem] font-[800] inline-block transition-colors duration-500 leading-tight" style={{ color: theme.gradientEnd }}>{animatedWorked.toFixed(1)}<span className="text-[1rem] font-[600] ml-[2px]">h</span></div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
               <div className="flex justify-between items-center py-[6px] border-b border-[#F7FAFC] stat-row-2 group">
                  <div><h4 className="m-0 text-[0.7rem] text-[#A0AEC0] uppercase font-[700]">Fond</h4><p className="m-[4px_0_0_0] text-[1.1rem] font-[700] text-[#2D3748]">{monthlyStats.fund}h</p></div>
                  <Calendar size={18} className="text-[#CBD5E0] transition-colors duration-300 group-hover:text-[#E93B3B]" style={{ color: undefined }} />
              </div>
              <div className="flex justify-between items-center py-[6px] border-b border-[#F7FAFC] stat-row-1 group">
                  <div><h4 className="m-0 text-[0.7rem] text-[#A0AEC0] uppercase font-[700]">Norma</h4><p className="m-[4px_0_0_0] text-[1.1rem] font-[700] text-[#2D3748]">{monthlyStats.target}h</p></div>
                  <Briefcase size={18} className="text-[#CBD5E0] transition-colors duration-300 group-hover:text-[#E93B3B]" style={{ color: undefined }} />
              </div>
          </div>

          <div className="mt-[25px] text-center text-[0.85rem] font-[700] opacity-0 footer-appear transition-colors duration-500 relative z-10" style={{ color: theme.primaryColor, letterSpacing: '0.02em' }}>{theme.footerText}</div>
      </div>
      
      <div className="flex justify-between items-end mb-3">
         <h3 className="text-base font-bold text-gray-800">Posledné záznamy</h3>
         {currentMonthRecords.length > 2 && <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-bold text-blue-600 hover:text-blue-700">{isExpanded ? 'Zobraziť menej' : 'Zobraziť všetko'}</button>}
      </div>

      <div className="space-y-2">
        {visibleRecords.length > 0 ? visibleRecords.map(record => (
           <button key={record.id} onClick={() => setSelectedRecord(record)} className="w-full bg-white rounded-[20px] p-3 flex items-center gap-3 shadow-lg shadow-blue-900/5 border border-white hover:scale-[1.02] active:scale-95 transition-all text-left">
              <div className={`w-1 h-10 rounded-full ${record.isPositiveBalance !== false ? 'bg-teal-400' : 'bg-rose-400'}`} />
              <div className="flex-1"><div className="font-bold text-gray-900 text-sm">{formatRecordDate(record.date)}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider">{record.totalWorked} odpracované</div></div>
              {record.balance && <div className={`font-bold text-xs px-2.5 py-1 rounded-full ${record.isPositiveBalance !== false ? 'text-teal-600 bg-teal-50' : 'text-rose-600 bg-rose-50'}`}>{record.balance}</div>}
           </button>
        )) : <div className="bg-white rounded-[20px] p-4 flex items-center justify-center text-gray-400 text-sm shadow-sm">Žiadne záznamy pre tento mesiac</div>}
      </div>
      
      <div className="h-6" />
      <DatePickerSheet isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={date} onSelect={(d: Date) => { setDate(d); setIsDatePickerOpen(false); }} />
      {showSummary && summaryData && <DaySummaryOverlay data={summaryData} onClose={() => setShowSummary(false)} onConfirm={handleFinalSave} arrival={arrivalTime} departure={departureTime} />}
      <RecordActionSheet isOpen={!!selectedRecord} record={selectedRecord} onClose={() => setSelectedRecord(null)} onDelete={() => selectedRecord && handleDeleteRecord(selectedRecord.id)} />
    </div>
  );
};

const RecordActionSheet = ({ isOpen, record, onClose, onDelete }: any) => {
    if (!isOpen || !record) return null;
    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-none">
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in pointer-events-auto" onClick={onClose} />
             <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up mx-auto mb-0 sm:mb-auto pointer-events-auto">
                 <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
                 <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center font-bold text-blue-500 text-2xl"><CalendarDays size={28} /></div>
                     <div><h3 className="text-lg font-bold text-gray-900">{new Date(record.date).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}</h3><div className="text-sm text-gray-500">Detail záznamu</div></div>
                 </div>
                 <div className="bg-gray-50 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-4">
                     <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Príchod</div><div className="text-lg font-bold text-gray-800">{record.arrivalTime}</div></div>
                     <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odchod</div><div className="text-lg font-bold text-gray-800">{record.departureTime}</div></div>
                     <div className="col-span-2 pt-2 border-t border-gray-200 flex justify-between items-center"><span className="text-xs font-bold text-gray-500">Odpracované</span><span className="text-xl font-black text-blue-600">{record.totalWorked}</span></div>
                 </div>
                 <div className="space-y-3">
                    <button onClick={onDelete} className="w-full p-4 flex items-center gap-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-500 group-hover:scale-110 transition-transform"><Trash2 size={20} /></div>
                        <div className="text-left"><span className="block font-bold">Zmazať záznam</span><span className="text-xs opacity-70">Akcia je nevratná</span></div>
                    </button>
                    <button onClick={onClose} className="w-full py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors">Zavrieť</button>
                 </div>
             </div>
        </div>, document.body
    );
};

const DatePickerSheet = ({ isOpen, onClose, selectedDate, onSelect }: any) => {
   const [viewDate, setViewDate] = useState(selectedDate || new Date());
   useEffect(() => { if (isOpen && selectedDate) setViewDate(selectedDate); }, [isOpen, selectedDate]);
   const year = viewDate.getFullYear();
   const month = viewDate.getMonth();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const firstDayOfMonth = new Date(year, month, 1).getDay();
   const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
   const MONTH_NAMES = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
   const DAYS = ['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'];
   const changeMonth = (offset: number) => { setViewDate(new Date(year, month + offset, 1)); };
   if (!isOpen) return null;
   return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
         <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in pointer-events-auto" onClick={onClose} />
         <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up pointer-events-auto mx-auto">
             <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-light text-gray-800 tracking-tight">Vyberte dátum</h3><button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500" /></button></div>
             <div className="flex justify-between items-center mb-6 px-2"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronLeft size={24} /></button><div className="text-lg font-bold text-gray-900">{MONTH_NAMES[month]} {year}</div><button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><ChevronRight size={24} /></button></div>
             <div className="grid grid-cols-7 mb-2 text-center">{DAYS.map((d, i) => (<div key={d} className={`text-xs font-bold ${i >= 5 ? 'text-red-400' : 'text-gray-300'}`}>{d}</div>))}</div>
             <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {Array.from({ length: startDay }).map((_, i) => (<div key={`empty-${i}`} />))}
                {Array.from({ length: daysInMonth }).map((_, i) => { const day = i + 1; const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year; const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year; return (<button key={day} onClick={() => onSelect(new Date(year, month, day))} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-110' : isToday ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{day}</button>); })}
             </div>
             <div className="h-6" />
         </div>
      </div>, document.body
   );
};

const DaySummaryOverlay = ({ data, onClose, onConfirm, arrival, departure }: any) => {
    const { efficiency, workedFormatted, balanceFormatted, isPositive, normDecimal, workedDecimal } = data;
    const [animatedEfficiency, setAnimatedEfficiency] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = efficiency;
        const duration = 1500;
        const incrementTime = 16; 
        const step = (end - start) * (incrementTime / duration);
        const timer = setInterval(() => { start += step; if (start >= end) { setAnimatedEfficiency(end); clearInterval(timer); } else { setAnimatedEfficiency(Math.round(start)); } }, incrementTime);
        return () => clearInterval(timer);
    }, [efficiency]);
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(animatedEfficiency, 100) / 100) * circumference;
    const themeColor = isPositive ? 'text-teal-500' : 'text-rose-500';
    const gradientId = isPositive ? 'gradientSuccess' : 'gradientWarning';
    return createPortal(
        <div className="fixed inset-0 z-[100] bg-gray-100 flex justify-center animate-fade-in pointer-events-none">
            <div className="bg-white w-full max-w-lg h-full relative flex flex-col pointer-events-auto shadow-2xl">
                <div className="pt-12 px-6 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20"><button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"><X size={26} className="text-gray-800" /></button><h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Denný Prehľad</h2><button className="p-2 rounded-full hover:bg-gray-100"><Share2 size={24} className="text-gray-500" /></button></div>
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
                    <div className="relative flex items-center justify-center mb-12">
                        <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
                            <circle cx="120" cy="120" r={radius} stroke="#f3f4f6" strokeWidth="20" fill="transparent" />
                            <circle cx="120" cy="120" r={radius} stroke={`url(#${gradientId})`} strokeWidth="20" fill="transparent" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }} />
                            <defs><linearGradient id="gradientSuccess" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2dd4bf" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient><linearGradient id="gradientWarning" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#fb923c" /></linearGradient></defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><div className={`text-5xl font-bold tracking-tighter mb-1 ${themeColor}`}>{animatedEfficiency}%</div><div className={`text-sm font-bold uppercase tracking-widest ${isPositive ? 'text-teal-600/60' : 'text-rose-500/60'}`}>Výkon</div></div>
                    </div>
                    <div className="flex justify-center mb-10"><div className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg border-2 ${isPositive ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>{isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}<span className="font-bold text-lg">{balanceFormatted}</span><span className="text-xs font-semibold uppercase opacity-60 ml-1">Bilancia</span></div></div>
                    <div className="grid grid-cols-2 gap-4 mb-8"><div className="bg-gray-50 rounded-[24px] p-5"><div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Odpracované</div><div className="text-2xl font-bold text-gray-900">{workedFormatted}</div></div><div className="bg-gray-50 rounded-[24px] p-5"><div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Norma</div><div className="text-2xl font-bold text-gray-900">{normDecimal}h</div></div></div>
                    <div className="bg-gray-50 rounded-[24px] p-6 mb-8"><div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Časová os</div><div className="flex items-center justify-between text-sm font-bold text-gray-700"><span>{arrival}</span><div className="flex-1 h-2 bg-gray-200 rounded-full mx-4 relative overflow-hidden"><div className="absolute inset-0 bg-blue-500 opacity-20" /><div className="absolute inset-y-0 left-0 bg-blue-500 w-[80%] rounded-full" /></div><span>{departure}</span></div></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-20"><button onClick={onConfirm} className="w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"><Check size={20} /> Uložiť záznam</button></div>
            </div>
        </div>, document.body
    );
};

export default ManualEntry;
