
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AttendanceRecord, ShiftConfig } from '../types';
import { Clock, ChevronRight, ChevronLeft, Sun, Moon, Briefcase, Coffee, Sparkles, X, Check, Share2, TrendingUp, TrendingDown, ArrowRight, Activity, Zap } from 'lucide-react';

interface ManualEntryProps {
  onSave: (record: AttendanceRecord) => void;
  user: { name?: string };
  records: AttendanceRecord[];
  shiftConfig: ShiftConfig;
}

const ManualEntry: React.FC<ManualEntryProps> = ({ onSave, user, records = [], shiftConfig }) => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State for expanding history
  const [isExpanded, setIsExpanded] = useState(false);

  // State for inputs
  const [arrivalTime, setArrivalTime] = useState('06:00');
  const [departureTime, setDepartureTime] = useState('14:30');
  const [normHours, setNormHours] = useState('8');
  const [breakMinutes, setBreakMinutes] = useState('30');

  // State for TimePicker
  const [activePicker, setActivePicker] = useState<'arrival' | 'departure' | null>(null);

  // State for Summary View
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const formattedDate = date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });

  // Reset expansion when month changes
  useEffect(() => {
    setIsExpanded(false);
  }, [date.getMonth(), date.getFullYear()]);

  // Filter records based on the selected date (Month view context)
  const currentMonthRecords = records.filter(record => {
      if (!record.date) return false;
      const [y, m] = record.date.split('-').map(Number);
      return y === date.getFullYear() && m === (date.getMonth() + 1);
  });

  const visibleRecords = isExpanded ? currentMonthRecords : currentMonthRecords.slice(0, 2);

  // --- Monthly Stats Calculation (REAL Performance Logic) ---
  const monthlyStats = useMemo(() => {
    // 1. Calculate Total Worked Minutes in current month
    let totalWorkedMinutes = 0;
    // 2. Calculate Total Norm Hours (Target) from RECORDS ONLY
    let totalNormHoursAccumulated = 0;

    currentMonthRecords.forEach(r => {
       // Sum Worked
       if (r.totalWorked) {
           const hMatch = r.totalWorked.match(/(\d+)h/);
           const mMatch = r.totalWorked.match(/(\d+)m/);
           const h = hMatch ? parseInt(hMatch[1]) : 0;
           const m = mMatch ? parseInt(mMatch[1]) : 0;
           totalWorkedMinutes += (h * 60) + m;
       }
       // Sum Norms (Critical Input)
       if (r.normHours) {
           totalNormHoursAccumulated += r.normHours;
       }
    });

    const totalWorkedHours = totalWorkedMinutes / 60;
    
    // Performance % = (Norm / Worked) * 100
    // "Why is performance 70% when I have +7h?" -> Fix to reflect positive balance (saved time) as high efficiency (>100%)
    const percentage = totalWorkedHours > 0 ? (totalNormHoursAccumulated / totalWorkedHours) * 100 : 0;
    
    // Balance = Norm - Worked (Inverted Logic as requested: Positive = Saved/Remaining/Under Budget)
    const balance = totalNormHoursAccumulated - totalWorkedHours; 

    return {
        worked: totalWorkedHours,
        target: totalNormHoursAccumulated,
        percentage: Math.round(percentage),
        balance: balance
    };
  }, [currentMonthRecords]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      // Logic Calculation
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
      };

      let start = parseTime(arrivalTime);
      let end = parseTime(departureTime);
      
      // Handle night shift (crossing midnight)
      if (end < start) {
        end += 24;
      }

      const brk = parseInt(breakMinutes) / 60;
      const norm = parseFloat(normHours);

      const workedDecimal = Math.max(0, (end - start) - brk);
      const h = Math.floor(workedDecimal);
      const m = Math.round((workedDecimal - h) * 60);

      // Efficiency for single day (Task Efficiency: Norm / Worked)
      const efficiency = workedDecimal > 0 ? (norm / workedDecimal) * 100 : 0;
      
      // Balance: Norm - Worked
      const balanceDecimal = norm - workedDecimal;
      
      const balanceH = Math.floor(Math.abs(balanceDecimal));
      const balanceM = Math.round((Math.abs(balanceDecimal) - balanceH) * 60);

      setSummaryData({
        workedFormatted: `${h}h ${m}m`,
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

    // Helper to format local date as YYYY-MM-DD
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
    
    // Reset view
    setShowSummary(false);
  };

  // Helper to format date for list
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
    <div className="pt-8 px-6 pb-32 animate-fade-in font-sans relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
         <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="bg-gray-900 text-white p-1.5 rounded-lg">
                  <Clock size={16} />
               </div>
               <span className="text-xs font-bold text-gray-500 tracking-widest">TIMETRACKER</span>
            </div>
            <h1 className="text-2xl font-light text-gray-800 leading-tight">
              Dobrý deň, <span className="font-bold text-gray-900">{user.name || 'Tester'}</span>
            </h1>
         </div>
      </div>

      {/* Date Card */}
      <button 
        onClick={() => setIsDatePickerOpen(true)}
        className="w-full bg-white rounded-[32px] p-5 mb-6 flex items-center justify-between shadow-lg shadow-blue-900/5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group"
      >
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div className="text-left">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Dnešný dátum</div>
               <div className="text-lg font-bold text-gray-900">{formattedDate}</div>
            </div>
         </div>
         <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
      </button>

      {/* Time Inputs Row */}
      <div className="flex gap-4 mb-4">
         {/* Arrival */}
         <button 
            type="button"
            onClick={() => setActivePicker('arrival')}
            className="flex-1 bg-white rounded-[32px] p-6 shadow-lg shadow-blue-900/5 relative overflow-hidden group cursor-pointer hover:shadow-xl active:scale-95 transition-all text-left w-full"
         >
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-teal-500 transition-colors">Príchod</div>
            <div className="text-3xl font-extralight text-gray-800 mb-1 pointer-events-none">{arrivalTime}</div>
            
            <div className="absolute bottom-4 right-4 text-gray-300 group-hover:text-teal-500 opacity-100 group-hover:scale-110 group-active:rotate-45 transition-all duration-300">
               <Sun size={24} />
            </div>
            
            {/* Decoration */}
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-teal-50 rounded-full blur-xl pointer-events-none group-hover:bg-teal-100 transition-colors" />
         </button>

         {/* Departure */}
         <button 
            type="button"
            onClick={() => setActivePicker('departure')}
            className="flex-1 bg-white rounded-[32px] p-6 shadow-lg shadow-blue-900/5 relative overflow-hidden group cursor-pointer hover:shadow-xl active:scale-95 transition-all text-left w-full"
         >
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Odchod</div>
            <div className="text-3xl font-extralight text-gray-800 mb-1 pointer-events-none">{departureTime}</div>
            
            <div className="absolute bottom-4 right-4 text-gray-300 group-hover:text-indigo-500 opacity-100 group-hover:scale-110 group-active:-rotate-45 transition-all duration-300">
               <Moon size={24} />
            </div>
            
            {/* Decoration */}
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-50 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-100 transition-colors" />
         </button>
      </div>

      {/* Secondary Inputs Row */}
      <div className="flex gap-4 mb-8">
         {/* Normohodiny Input - Toned Down */}
         <div className="flex-1 bg-white rounded-[24px] px-6 py-4 flex flex-col justify-center shadow-lg shadow-blue-900/5 relative overflow-hidden group transition-all hover:shadow-xl border border-transparent focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-50/50">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-4 right-4 text-gray-200 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                <Briefcase size={20} strokeWidth={2} />
            </div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10 group-focus-within:text-blue-500 transition-colors duration-300">
                Normohodiny
            </label>
            <div className="flex items-baseline gap-1 relative z-10">
               <input 
                  type="number" 
                  value={normHours}
                  onChange={(e) => setNormHours(e.target.value)}
                  className="w-full text-xl font-light text-gray-800 bg-transparent outline-none p-0 m-0 placeholder-gray-300"
               />
               <span className="text-sm text-gray-400 font-medium">hod</span>
            </div>
         </div>

         {/* Prestávka Input */}
         <div className="flex-1 bg-white rounded-[24px] px-6 py-4 flex flex-col justify-center shadow-lg shadow-blue-900/5 relative overflow-hidden group transition-all hover:shadow-xl border border-transparent focus-within:border-orange-100 focus-within:ring-4 focus-within:ring-orange-50/50">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-orange-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
            <div className="absolute top-4 right-4 text-gray-200 group-hover:text-orange-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
                <Coffee size={20} strokeWidth={2} />
            </div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10 group-focus-within:text-orange-500 transition-colors duration-300">Prestávka</label>
            <div className="flex items-baseline gap-1 relative z-10">
               <input 
                  type="number" 
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                  className="w-full text-xl font-light text-gray-800 bg-transparent outline-none p-0 m-0 placeholder-gray-300"
               />
               <span className="text-sm text-gray-400 font-medium">min</span>
            </div>
         </div>
      </div>

      {/* Main Action - Premium Button */}
      <button 
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className={`w-full relative py-5 rounded-[24px] overflow-hidden group transition-all duration-500
            shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] 
            ${isAnalyzing ? 'cursor-not-allowed opacity-90' : 'hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] hover:scale-[1.01] active:scale-[0.98]'}
            mb-10
        `}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] transition-all duration-500" />
         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer transition-all duration-500" />
         <div className="absolute inset-0 rounded-[24px] border border-white/10 group-hover:border-white/20 transition-all duration-500" />

         <div className="relative z-10 flex items-center justify-center gap-3 text-white">
            {isAnalyzing ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-bold tracking-wider text-sm uppercase">Analyzujem...</span>
                </>
            ) : (
                <>
                    <span className="font-bold text-lg tracking-wide">Vytvoriť Prehľad</span>
                    <Sparkles size={20} className="text-blue-300 group-hover:text-white group-hover:rotate-12 transition-all duration-300" />
                </>
            )}
         </div>
         {isAnalyzing && (
             <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-teal-400 animate-[width_1.5s_ease-in-out_forwards] w-full" />
         )}
      </button>

      {/* --- BRUTAL MONTHLY PERFORMANCE CHART (OPTIMIZED) --- */}
      <div className="mb-10 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="relative w-full rounded-[40px] bg-white/60 backdrop-blur-xl border border-white p-1 overflow-hidden shadow-2xl shadow-blue-900/10 group">
              {/* Animated Background Mesh - Toned down opacity */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-teal-300 rounded-full blur-[60px] animate-pulse" />
                  <div className="absolute bottom-[-20%] left-[-20%] w-[300px] h-[300px] bg-purple-300 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
              </div>

              <div className="bg-white/40 rounded-[36px] p-6 relative z-10">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                           <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                                <Activity size={18} />
                           </div>
                           <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Mesačný Výkon</span>
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                          {date.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
                      </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mb-8">
                       {/* The Ring */}
                       <div className="relative w-32 h-32 flex-shrink-0">
                           {/* SVG Circle */}
                           <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 160 160">
                               <defs>
                                   <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                       <stop offset="0%" stopColor="#2dd4bf" />
                                       <stop offset="50%" stopColor="#3b82f6" />
                                       <stop offset="100%" stopColor="#8b5cf6" />
                                   </linearGradient>
                               </defs>
                               {/* Track */}
                               <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="12" fill="transparent" className="opacity-60" />
                               {/* Progress */}
                               <circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="url(#performanceGradient)" 
                                    strokeWidth="12" 
                                    fill="transparent" 
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 70}
                                    strokeDashoffset={(2 * Math.PI * 70) * (1 - Math.min(monthlyStats.percentage, 100) / 100)}
                                    className="transition-all duration-1000 ease-out"
                               />
                           </svg>
                           {/* Inner Content */}
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                               <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 tracking-tighter">
                                   {monthlyStats.percentage}%
                               </span>
                               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                   Účinnosť
                               </span>
                           </div>
                       </div>

                       {/* Stats Column - Cleaned up */}
                       <div className="flex flex-col gap-3 flex-1 min-w-0">
                           <div className="group/stat relative overflow-hidden bg-white/50 hover:bg-white rounded-2xl p-3 border border-white/50 transition-all duration-300">
                               <div className="relative z-10">
                                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odpracované</div>
                                   <div className="text-2xl font-black text-gray-800 flex items-baseline gap-1">
                                       {monthlyStats.worked.toFixed(1)}
                                       <span className="text-xs text-gray-400 font-bold">h</span>
                                   </div>
                               </div>
                           </div>
                           
                           <div className="group/stat relative overflow-hidden bg-white/30 hover:bg-white rounded-2xl p-3 border border-white/30 transition-all duration-300">
                               <div className="relative z-10">
                                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Súčet Noriem</div>
                                   <div className="text-2xl font-black text-gray-400 flex items-baseline gap-1">
                                       {monthlyStats.target}
                                       <span className="text-xs text-gray-300 font-bold">h</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                  </div>

                  {/* Balance Indicator */}
                  <div className="p-1 bg-white/50 rounded-[20px] border border-white">
                      <div className="bg-white rounded-[16px] p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${monthlyStats.balance >= 0 ? 'bg-teal-50 text-teal-500' : 'bg-rose-50 text-rose-500'}`}>
                                  {monthlyStats.balance >= 0 ? <Zap size={18} fill="currentColor" /> : <TrendingDown size={18} />}
                              </div>
                              <div>
                                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bilancia</div>
                                  <div className={`text-lg font-black ${monthlyStats.balance >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                                      {monthlyStats.balance > 0 ? '+' : ''}{monthlyStats.balance.toFixed(1)}h
                                  </div>
                              </div>
                          </div>
                          
                          <div className="text-right opacity-60">
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Vzorec</div>
                              <div className="text-[10px] font-bold text-gray-500 mt-0.5 bg-gray-100 px-2 py-1 rounded-md inline-block">
                                  Norma - Odpracované
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Recent Records */}
      <div className="flex justify-between items-end mb-4">
         <h3 className="text-lg font-bold text-gray-800">Posledné záznamy</h3>
         {currentMonthRecords.length > 2 && (
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
                {isExpanded ? 'Zobraziť menej' : 'Zobraziť všetko'}
            </button>
         )}
      </div>

      <div className="space-y-3">
        {visibleRecords && visibleRecords.length > 0 ? visibleRecords.map(record => (
           <div key={record.id} className="bg-white rounded-[24px] p-5 flex items-center gap-4 shadow-lg shadow-blue-900/5 border border-white">
              <div className={`w-1.5 h-12 rounded-full ${record.isPositiveBalance !== false ? 'bg-teal-400' : 'bg-rose-400'}`} />
              <div className="flex-1">
                 <div className="font-bold text-gray-900">{formatRecordDate(record.date)}</div>
                 <div className="text-xs text-gray-400">{record.totalWorked} odpracované</div>
              </div>
              {record.balance && (
                <div className={`font-bold text-sm px-3 py-1 rounded-full ${record.isPositiveBalance !== false ? 'text-teal-600 bg-teal-50' : 'text-rose-600 bg-rose-50'}`}>
                   {record.balance}
                </div>
              )}
           </div>
        )) : (
          <div className="bg-white rounded-[24px] p-5 flex items-center justify-center text-gray-400 text-sm shadow-sm">
             Žiadne záznamy pre tento mesiac
          </div>
        )}
      </div>
      
      {/* Bottom Spacer for Nav */}
      <div className="h-8" />
      
      {/* Time Picker Sheet (Portal) */}
      <TimePickerSheet 
         isOpen={!!activePicker} 
         onClose={() => setActivePicker(null)} 
         title={activePicker === 'arrival' ? 'Nastaviť príchod' : 'Nastaviť odchod'}
         value={activePicker === 'arrival' ? arrivalTime : departureTime}
         onChange={(val: string) => activePicker === 'arrival' ? setArrivalTime(val) : setDepartureTime(val)}
      />

      {/* Date Picker Sheet (Portal) */}
      <DatePickerSheet 
         isOpen={isDatePickerOpen}
         onClose={() => setIsDatePickerOpen(false)}
         selectedDate={date}
         onSelect={(d: Date) => {
            setDate(d);
            setIsDatePickerOpen(false);
         }}
      />

      {/* Day Summary Overlay (Portal) */}
      {showSummary && summaryData && (
          <DaySummaryOverlay 
            data={summaryData} 
            onClose={() => setShowSummary(false)}
            onConfirm={handleFinalSave}
            arrival={arrivalTime}
            departure={departureTime}
          />
      )}

      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

// --- Custom Mobile-First Time Picker Sheet ---
const TimePickerSheet = ({ isOpen, onClose, title, value, onChange }: any) => {
   const [hours, setHours] = useState(0);
   const [minutes, setMinutes] = useState(0);
   
   // Sync with incoming value
   useEffect(() => {
     if (isOpen && value) {
       const [h, m] = value.split(':').map(Number);
       setHours(h || 0);
       setMinutes(m || 0);
     }
   }, [isOpen, value]);
 
   // Auto-scroll logic (ref based)
   const hoursRef = useRef<HTMLDivElement>(null);
   const minutesRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     if (isOpen) {
       // Timeout to allow render before scroll
       setTimeout(() => {
          if (hoursRef.current) {
             const hEl = hoursRef.current.querySelector(`[data-value="${hours}"]`);
             hEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          if (minutesRef.current) {
             const mEl = minutesRef.current.querySelector(`[data-value="${minutes}"]`);
             mEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
       }, 100);
     }
   }, [isOpen]);
 
   const handleConfirm = () => {
      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      onChange(`${hStr}:${mStr}`);
      onClose();
   };
 
   const hourOptions = Array.from({length: 24}, (_, i) => i);
   const minuteOptions = Array.from({length: 60}, (_, i) => i);
 
   if (!isOpen) return null;
 
   return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
         {/* Backdrop */}
         <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={onClose}
         />
         
         {/* Sheet */}
         <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up relative overflow-hidden">
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-gray-800 tracking-tight">{title}</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                   <X size={20} className="text-gray-500" />
                </button>
             </div>
 
             {/* Picker Wheel Area */}
             <div className="relative h-56 flex justify-center gap-2 mb-8 select-none">
                {/* Center Highlight Bar (The "Lens") */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-14 bg-gray-50 rounded-xl pointer-events-none border-y border-gray-100 z-0" />
 
                {/* Hours Column */}
                <div 
                   ref={hoursRef}
                   className="w-24 h-full overflow-y-auto no-scrollbar py-[84px] text-center snap-y snap-mandatory relative z-10 mask-gradient"
                >
                   {hourOptions.map(h => (
                      <div 
                         key={h}
                         data-value={h}
                         onClick={() => setHours(h)}
                         className={`h-14 flex items-center justify-center text-3xl transition-all snap-center cursor-pointer
                            ${h === hours ? 'font-bold text-gray-900 scale-110' : 'font-light text-gray-300 scale-90'}
                         `}
                      >
                         {h.toString().padStart(2, '0')}
                      </div>
                   ))}
                </div>
 
                {/* Colon */}
                <div className="flex items-center justify-center pb-2 text-2xl font-bold text-gray-300 relative z-10">:</div>
 
                {/* Minutes Column */}
                <div 
                   ref={minutesRef}
                   className="w-24 h-full overflow-y-auto no-scrollbar py-[84px] text-center snap-y snap-mandatory relative z-10 mask-gradient"
                >
                   {minuteOptions.map(m => (
                      <div 
                         key={m}
                         data-value={m}
                         onClick={() => setMinutes(m)}
                         className={`h-14 flex items-center justify-center text-3xl transition-all snap-center cursor-pointer
                            ${m === minutes ? 'font-bold text-gray-900 scale-110' : 'font-light text-gray-300 scale-90'}
                         `}
                      >
                         {m.toString().padStart(2, '0')}
                      </div>
                   ))}
                </div>
             </div>
 
             {/* Confirm Button */}
             <button 
                onClick={handleConfirm}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20"
             >
                Potvrdiť čas
             </button>
         </div>

         <style>{`
            .mask-gradient {
               mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
               -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
            }
            .animate-slide-up {
               animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideUp {
               from { transform: translateY(100%); }
               to { transform: translateY(0); }
            }
         `}</style>
      </div>,
      document.body
   );
}

// --- Date Picker Sheet ---
const DatePickerSheet = ({ isOpen, onClose, selectedDate, onSelect }: any) => {
   const [viewDate, setViewDate] = useState(selectedDate || new Date());

   useEffect(() => {
     if (isOpen && selectedDate) {
       setViewDate(selectedDate);
     }
   }, [isOpen, selectedDate]);

   const year = viewDate.getFullYear();
   const month = viewDate.getMonth();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const firstDayOfMonth = new Date(year, month, 1).getDay();
   // 0=Sun, 1=Mon... We want 0=Mon, 6=Sun. 
   // If firstDay is 0(Sun) -> 6. If 1(Mon) -> 0.
   const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

   const MONTH_NAMES = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
   const DAYS = ['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'];

   const changeMonth = (offset: number) => {
      setViewDate(new Date(year, month + offset, 1));
   };

   if (!isOpen) return null;

   return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
         <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={onClose}
         />
         <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up">
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-gray-800 tracking-tight">Vyberte dátum</h3>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                   <X size={20} className="text-gray-500" />
                </button>
             </div>

             {/* Calendar Header */}
             <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-lg font-bold text-gray-900">
                    {MONTH_NAMES[month]} {year}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ChevronRight size={24} />
                </button>
             </div>

             {/* Days Header */}
             <div className="grid grid-cols-7 mb-2 text-center">
                {DAYS.map((d, i) => (
                    <div key={d} className={`text-xs font-bold ${i >= 5 ? 'text-red-400' : 'text-gray-300'}`}>
                        {d}
                    </div>
                ))}
             </div>

             {/* Days Grid */}
             <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                    
                    return (
                        <button
                            key={day}
                            onClick={() => onSelect(new Date(year, month, day))}
                            className={`
                                w-10 h-10 rounded-xl flex items-center justify-center text-sm transition-all
                                ${isSelected 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold scale-110' 
                                    : isToday 
                                        ? 'bg-blue-50 text-blue-600 font-bold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
             </div>
             
             <div className="h-6" /> {/* Spacer */}
         </div>
         
         {/* Reuse Styles for animation */}
         <style>{`
            .animate-slide-up {
               animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideUp {
               from { transform: translateY(100%); }
               to { transform: translateY(0); }
            }
         `}</style>
      </div>,
      document.body
   );
};

// --- Day Summary Overlay with Playful Graph ---
const DaySummaryOverlay = ({ data, onClose, onConfirm, arrival, departure }: any) => {
    const { efficiency, workedFormatted, balanceFormatted, isPositive, normDecimal, workedDecimal } = data;
    const [animatedEfficiency, setAnimatedEfficiency] = useState(0);

    // Animation Effect
    useEffect(() => {
        let start = 0;
        const end = efficiency;
        const duration = 1500;
        const incrementTime = 16; // 60fps
        const step = (end - start) * (incrementTime / duration);

        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setAnimatedEfficiency(end);
                clearInterval(timer);
            } else {
                setAnimatedEfficiency(Math.round(start));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [efficiency]);

    // Graph calculations
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    // Cap at 100% for the main circle visually, but use full number for text
    const visualPercent = Math.min(animatedEfficiency, 100); 
    const strokeDashoffset = circumference - (visualPercent / 100) * circumference;

    const themeColor = isPositive ? 'text-teal-500' : 'text-rose-500';
    const gradientId = isPositive ? 'gradientSuccess' : 'gradientWarning';

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
            {/* Header */}
            <div className="pt-12 px-6 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X size={26} className="text-gray-800" />
                </button>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Denný Prehľad</h2>
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <Share2 size={24} className="text-gray-500" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-24">
                
                {/* Hero Graph Section */}
                <div className="relative flex items-center justify-center mb-12">
                    {/* SVG Graph */}
                    <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
                        {/* Background Circle */}
                        <circle cx="120" cy="120" r={radius} stroke="#f3f4f6" strokeWidth="20" fill="transparent" />
                        {/* Progress Circle */}
                        <circle 
                            cx="120" cy="120" r={radius} 
                            stroke={`url(#${gradientId})`}
                            strokeWidth="20" 
                            fill="transparent"
                            strokeLinecap="round"
                            style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                        {/* Gradients */}
                        <defs>
                            <linearGradient id="gradientSuccess" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#2dd4bf" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                            <linearGradient id="gradientWarning" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Central Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <div className={`text-5xl font-bold tracking-tighter mb-1 ${themeColor}`}>
                            {animatedEfficiency}%
                        </div>
                        <div className={`text-sm font-bold uppercase tracking-widest ${isPositive ? 'text-teal-600/60' : 'text-rose-500/60'}`}>
                            Výkon
                        </div>
                    </div>

                    {/* Celebration Confetti if > 100% */}
                    {isPositive && efficiency >= 100 && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                            <div className="absolute bottom-1/4 right-10 w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
                            <div className="absolute top-10 right-1/4 w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                        </div>
                    )}
                </div>

                {/* Balance Pill */}
                <div className="flex justify-center mb-10">
                    <div className={`
                        flex items-center gap-2 px-6 py-3 rounded-full shadow-lg border-2
                        ${isPositive 
                            ? 'bg-teal-50 border-teal-100 text-teal-700' 
                            : 'bg-rose-50 border-rose-100 text-rose-700'}
                    `}>
                        {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        <span className="font-bold text-lg">{balanceFormatted}</span>
                        <span className="text-xs font-semibold uppercase opacity-60 ml-1">Bilancia</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-[24px] p-5">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Odpracované</div>
                        <div className="text-2xl font-bold text-gray-900">{workedFormatted}</div>
                    </div>
                    <div className="bg-gray-50 rounded-[24px] p-5">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Norma</div>
                        <div className="text-2xl font-bold text-gray-900">{normDecimal}h</div>
                    </div>
                </div>

                {/* Visual Timeline */}
                <div className="bg-gray-50 rounded-[24px] p-6 mb-8">
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Časová os</div>
                     <div className="flex items-center justify-between text-sm font-bold text-gray-700">
                         <span>{arrival}</span>
                         <div className="flex-1 h-2 bg-gray-200 rounded-full mx-4 relative overflow-hidden">
                             <div className="absolute inset-0 bg-blue-500 opacity-20" />
                             {/* Worked part */}
                             <div className="absolute inset-y-0 left-0 bg-blue-500 w-[80%] rounded-full" />
                         </div>
                         <span>{departure}</span>
                     </div>
                </div>

            </div>

            {/* Bottom Action */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-20">
                 <button 
                    onClick={onConfirm}
                    className="w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                 >
                    <Check size={20} />
                    Uložiť záznam
                 </button>
            </div>
        </div>,
        document.body
    );
};

export default ManualEntry;
