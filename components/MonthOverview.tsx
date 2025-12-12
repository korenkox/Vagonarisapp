
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShiftConfig, AttendanceRecord, ShiftTimes } from '../types';
import { Zap, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase, Settings2, Info, Moon, Sun, Coffee, X, Check, Repeat, CalendarDays, Timer, ArrowRight } from 'lucide-react';

interface MonthOverviewProps {
  config: ShiftConfig;
  onUpdateConfig: (config: ShiftConfig) => void;
  records: AttendanceRecord[];
}

const SHIFT_STYLES: Record<string, { bg: string, text: string, glow: string, border: string, icon: React.ReactNode, label: string, cardBg: string }> = {
  'R': { bg: 'bg-amber-100', text: 'text-amber-600', glow: 'shadow-amber-500/30', border: 'border-amber-200', icon: <Sun size={20} />, label: 'Ranná', cardBg: 'bg-amber-50' },
  'P': { bg: 'bg-indigo-100', text: 'text-indigo-600', glow: 'shadow-indigo-500/30', border: 'border-indigo-200', icon: <Moon size={20} />, label: 'Poobedná', cardBg: 'bg-indigo-50' },
  'N': { bg: 'bg-slate-200', text: 'text-slate-700', glow: 'shadow-slate-500/30', border: 'border-slate-300', icon: <Zap size={20} />, label: 'Nočná', cardBg: 'bg-slate-100' },
  'V': { bg: 'bg-white', text: 'text-gray-400', glow: 'shadow-gray-200/50', border: 'border-gray-200', icon: <Coffee size={20} />, label: 'Voľno', cardBg: 'bg-gray-50' }
};

const MonthOverview: React.FC<MonthOverviewProps> = ({ config, onUpdateConfig, records }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust starting day: 0 (Sun) -> 6, 1 (Mon) -> 0
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const MONTH_NAMES = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];

  const getShiftCodeForDay = (day: number) => {
    // If not active, show free/empty
    if (!config.isActive) return 'V';
    
    // Real calculation if active
    if (!config.cycle || config.cycle.length === 0) return 'V';
    
    const checkDate = new Date(year, month, day);
    const startDate = new Date(config.startDate);
    checkDate.setHours(0,0,0,0);
    startDate.setHours(0,0,0,0);
    
    const diffTime = checkDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const cycleLength = config.cycle.length;
    let position = diffDays % cycleLength;
    if (position < 0) position += cycleLength;
    
    return config.cycle[position];
  };
  
  const getSelectedShift = () => {
      const code = getShiftCodeForDay(selectedDay);
      return SHIFT_STYLES[code] || SHIFT_STYLES['V'];
  }

  const getShiftTimes = (code: string) => {
     if (config.shiftTimes && (code === 'R' || code === 'P' || code === 'N')) {
        return config.shiftTimes[code];
     }
     // Fallback defaults
     switch(code) {
         case 'R': return { start: '06:00', end: '14:00' };
         case 'P': return { start: '14:00', end: '22:00' };
         case 'N': return { start: '22:00', end: '06:00' };
         default: return null;
     }
  };

  const selectedShift = getSelectedShift();
  const selectedTimes = getShiftTimes(getShiftCodeForDay(selectedDay));

  // --- Calculate Monthly Stats ---
  const stats = useMemo(() => {
    let workedMinutes = 0;
    const currentMonthRecords = records.filter(r => {
        if (!r.date) return false;
        const [rYear, rMonth] = r.date.split('-').map(Number);
        return rYear === year && rMonth === (month + 1);
    });

    currentMonthRecords.forEach(r => {
        if (r.totalWorked) {
            const hMatch = r.totalWorked.match(/(\d+)h/);
            const mMatch = r.totalWorked.match(/(\d+)m/);
            const h = hMatch ? parseInt(hMatch[1]) : 0;
            const m = mMatch ? parseInt(mMatch[1]) : 0;
            workedMinutes += (h * 60) + m;
        }
    });

    let fund = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        if (config.isActive) {
            const code = getShiftCodeForDay(d);
            if (code !== 'V') {
                fund += (config.shiftLength || 8);
            }
        } else {
             const date = new Date(year, month, d);
             const day = date.getDay();
             if (day !== 0 && day !== 6) {
                 fund += 8;
             }
        }
    }

    const workedHours = Math.floor(workedMinutes / 60);
    const percentage = fund > 0 ? Math.round((workedMinutes / 60 / fund) * 100) : 0;

    return {
        workedHours,
        fund,
        percentage
    };
  }, [records, year, month, config, daysInMonth]); 

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < startingDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-12" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDay === d;
      const shiftCode = getShiftCodeForDay(d);
      const style = SHIFT_STYLES[shiftCode] || SHIFT_STYLES['V'];
      const isFree = shiftCode === 'V';
      
      cells.push(
        <div key={d} className="flex flex-col items-center justify-center mb-2 relative group perspective-500">
          <button
            onClick={() => setSelectedDay(d)}
            className={`
              w-10 h-12 rounded-2xl flex flex-col items-center justify-center text-sm transition-all duration-300 relative z-10
              ${isSelected 
                  ? 'bg-white text-gray-900 shadow-xl shadow-blue-500/20 scale-110 border-2 border-blue-500' 
                  : isFree 
                    ? 'text-gray-400 hover:bg-white/50' 
                    : 'text-gray-800 hover:scale-105'
              }
            `}
          >
            {!isSelected && !isFree && (
               <div className={`absolute inset-0 rounded-2xl ${style.bg} shadow-md ${style.glow} opacity-90 border ${style.border}`} />
            )}
            <span className={`relative z-10 font-bold ${isSelected ? 'text-lg' : ''}`}>{d}</span>
            {(isSelected || isFree) && !isFree && (
                 <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${style.text.replace('text', 'bg')}`} />
            )}
          </button>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="pt-8 px-6 pb-32 animate-fade-in relative min-h-screen">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-3xl -ml-20 pointer-events-none" />
      <div className="flex justify-between items-center mb-8 pt-4 relative z-10">
         <div className="flex items-center gap-3">
             <div className="bg-white/80 backdrop-blur-md p-2.5 rounded-2xl shadow-sm border border-white text-blue-600"><CalendarIcon size={20} strokeWidth={2.5} /></div>
             <div><span className="text-[10px] font-bold text-gray-400 tracking-widest block uppercase">Prehľad</span><span className="text-lg font-bold text-gray-900 leading-none">Môj Kalendár</span></div>
         </div>
         <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white text-gray-400 hover:text-blue-600 transition-colors"><Settings2 size={20} /></button>
      </div>
      <div className="flex justify-between items-center mb-6 px-4">
         <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600 hover:shadow-sm"><ChevronLeft size={24} /></button>
         <div className="flex flex-col items-center"><span className="text-xl font-bold text-gray-800 tracking-tight uppercase">{MONTH_NAMES[month]}</span><span className="text-xs font-medium text-blue-500 tracking-[0.2em] bg-blue-50 px-2 py-0.5 rounded-full">{year}</span></div>
         <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600 hover:shadow-sm"><ChevronRight size={24} /></button>
      </div>
      <div className="grid grid-cols-7 mb-2 px-2">{['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'].map((day, i) => (<div key={day} className={`text-center text-[10px] font-bold ${i >= 5 ? 'text-rose-400' : 'text-gray-400'} opacity-70`}>{day}</div>))}</div>
      <div className="relative mb-8"><div className="grid grid-cols-7 relative z-10">{renderCalendar()}</div></div>
      <div className="relative w-full bg-white/60 backdrop-blur-xl border border-white/60 rounded-[32px] p-1 shadow-2xl shadow-blue-900/5 mb-10 group overflow-hidden">
         <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-[28px] p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none"><div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-b from-blue-200 to-transparent rounded-full blur-3xl animate-blob" /><div className="absolute bottom-[-50%] left-[-50%] w-full h-full bg-gradient-to-t from-purple-200 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" /></div>
            <div className="relative z-10 flex items-end justify-between"><div><div className="flex items-center gap-2 mb-1 text-blue-900/60"><Briefcase size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Mesačný fond</span></div><div className="flex items-baseline gap-1"><span className="text-5xl font-light text-gray-900 tracking-tighter transition-all group-hover:scale-105 origin-left duration-500">{stats.fund}</span><span className="text-lg font-bold text-gray-400">hod</span></div></div></div>
            <div className="mt-6"><div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Odpracované: {stats.workedHours}h</span><span>{stats.percentage}%</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, stats.percentage)}%` }} /></div></div>
         </div>
      </div>
      <div className="animate-slide-up bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-50">
          <div className="flex justify-between items-start mb-6"><div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detail dňa</div><h3 className="text-xl font-bold text-gray-900">{selectedDay}. {MONTH_NAMES[month]} {year}</h3></div><div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border ${selectedShift.border} ${selectedShift.bg} ${selectedShift.text} ${selectedShift.glow}`}>{selectedShift.icon}</div></div>
          <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${selectedShift.text.replace('text', 'bg')}`} /><span className="font-bold text-gray-700 text-sm">Typ zmeny</span></div><span className="font-bold text-gray-900">{selectedShift.label}</span></div>
              {selectedShift.label !== 'Voľno' && selectedTimes && (<div className="flex gap-4"><div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Príchod</span><span className="text-lg font-bold text-gray-900">{selectedTimes.start}</span></div><div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odchod</span><span className="text-lg font-bold text-gray-900">{selectedTimes.end}</span></div></div>)}
          </div>
      </div>
      <ShiftSettingsSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} onSave={onUpdateConfig} />
      <style>{`
        .perspective-500 { perspective: 500px; }
      `}</style>
    </div>
  );
};

const CompactStepper = ({ label, value, onIncrement, onDecrement, unit }: any) => (
    <div className="flex flex-col items-center justify-center p-2 group">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center h-8 flex items-end pb-1 group-hover:text-blue-500 transition-colors">{label}</span>
        <div className="text-3xl font-extrabold text-gray-800 mb-3 flex items-baseline gap-0.5">{value}{unit && <span className="text-xs font-bold text-gray-400 -translate-y-4">{unit}</span>}</div>
        <div className="flex items-center gap-2"><button onClick={onDecrement} className="w-10 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all active:scale-90 font-bold text-xl shadow-sm border border-gray-100">-</button><button onClick={onIncrement} className="w-10 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all active:scale-90 font-bold text-xl shadow-sm border border-gray-100">+</button></div>
    </div>
);

const ShiftSettingsSheet = ({ isOpen, onClose, config, onSave }: any) => {
    const [isActive, setIsActive] = useState(config?.isActive ?? false);
    const [workDays, setWorkDays] = useState(5);
    const [restDays, setRestDays] = useState(2);
    const [shiftLength, setShiftLength] = useState(8);
    const [startDate, setStartDate] = useState(config?.startDate || new Date().toISOString().split('T')[0]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [shiftTimes, setShiftTimes] = useState<ShiftTimes>({ 'R': { start: '06:00', end: '14:00' }, 'P': { start: '14:00', end: '22:00' }, 'N': { start: '22:00', end: '06:00' } });
    const [shiftPattern, setShiftPattern] = useState<string[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
    const slotScrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isOpen && config) {
            setIsActive(config.isActive); setStartDate(config.startDate); setShiftLength(config.shiftLength || 8);
            if (config.shiftTimes) { setShiftTimes(config.shiftTimes); }
            const currentCycle = config.cycle || [];
            const w = currentCycle.filter((c:string) => c !== 'V').length;
            const r = currentCycle.filter((c:string) => c === 'V').length;
            const existingPattern = currentCycle.filter((c:string) => c !== 'V');
            if (existingPattern.length === 0 && w > 0) { setShiftPattern(Array(w).fill('R')); } else if (existingPattern.length > 0) { setShiftPattern(existingPattern); } else { setShiftPattern(Array(5).fill('R')); }
            if (w + r > 0) { setWorkDays(w || 5); setRestDays(r || 2); }
        }
    }, [isOpen, config]);

    useEffect(() => {
        setShiftPattern(prev => { if (workDays > prev.length) { return [...prev, ...Array(workDays - prev.length).fill('R')]; } else { return prev.slice(0, workDays); } });
        if (selectedSlotIndex >= workDays) { setSelectedSlotIndex(Math.max(0, workDays - 1)); }
    }, [workDays]);

    useEffect(() => { if (slotScrollerRef.current && isActive) { const btn = slotScrollerRef.current.children[selectedSlotIndex] as HTMLElement; if (btn) { btn.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } } }, [selectedSlotIndex, isActive]);

    const handleShiftTypeSelect = (type: string) => { const newPattern = [...shiftPattern]; newPattern[selectedSlotIndex] = type; setShiftPattern(newPattern); if (selectedSlotIndex < workDays - 1) { setSelectedSlotIndex(prev => prev + 1); } };
    const handleShiftTimeChange = (type: 'R' | 'P' | 'N', field: 'start' | 'end', value: string) => { setShiftTimes(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } })); };
    const handleSave = () => { const newCycle = [ ...shiftPattern, ...Array(Math.max(0, Number(restDays))).fill('V') ]; onSave({ ...config, isActive, startDate, cycle: newCycle, shiftLength: shiftLength, shiftTimes: shiftTimes }); onClose(); };
    const handleDateSelect = (date: Date) => { const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; setStartDate(localDate); setIsDatePickerOpen(false); };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl z-10 flex flex-col max-h-[95vh] animate-sheet-up overflow-hidden sm:max-w-lg">
                 <div className="flex-shrink-0 flex justify-between items-center px-8 pt-8 pb-4 bg-white">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Nastavenie Turnusu</h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 bg-white overscroll-contain no-scrollbar">
                     {!isActive && (<button onClick={() => setIsActive(true)} className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4"><Repeat size={20} /> Zapnúť turnusový režim</button>)}
                     <div className={`space-y-8 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none filter grayscale'}`}>
                        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50 rounded-3xl p-2 border border-gray-100 shadow-sm"><CompactStepper label="PRACOVNÉ DNI" value={workDays} onIncrement={() => setWorkDays(d => d + 1)} onDecrement={() => setWorkDays(d => Math.max(1, d - 1))} /><CompactStepper label="DNI VOĽNA" value={restDays} onIncrement={() => setRestDays(d => d + 1)} onDecrement={() => setRestDays(d => Math.max(0, d - 1))} /><CompactStepper label="DĹŽKA SMENY" value={shiftLength} unit="h" onIncrement={() => setShiftLength(l => Math.min(24, l + 0.5))} onDecrement={() => setShiftLength(l => Math.max(1, l - 0.5))} /></div>
                        <div>
                             <div className="flex items-center justify-between mb-4 px-2"><label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">EDITOR SMENY</label><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">Slot {selectedSlotIndex + 1} / {workDays}</span></div>
                             <div className="bg-white rounded-[32px] p-0 py-6 border border-gray-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                                 <div className="absolute top-[60%] left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                                 <div ref={slotScrollerRef} className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar relative z-10 px-[calc(50%-2rem)] snap-x snap-mandatory scroll-smooth items-center">
                                    {shiftPattern.map((code, index) => { const style = SHIFT_STYLES[code] || SHIFT_STYLES['R']; const isSelected = index === selectedSlotIndex; return (<button key={index} onClick={() => setSelectedSlotIndex(index)} className={`flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 relative snap-center group ${isSelected ? 'scale-110 -translate-y-1 z-20' : 'scale-90 opacity-60 hover:opacity-100'}`}><div className={`text-[10px] font-bold mb-3 uppercase tracking-wider ${isSelected ? 'text-gray-400' : 'text-gray-300'}`}>D{index+1}</div><div className={`w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-300 ${isSelected ? `bg-white border-[3px] border-blue-500 shadow-xl shadow-blue-500/20 text-gray-800` : `bg-white border border-gray-200 text-gray-300`}`}><div className={`transition-colors duration-300 ${isSelected ? style.text : 'text-gray-300'}`}>{style.icon}</div></div>{isSelected && (<div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />)}</button>) })}
                                    {Array.from({length: restDays}).map((_, i) => (<div key={`rest-${i}`} className="flex-shrink-0 flex flex-col items-center justify-center scale-75 opacity-30 grayscale"><div className="text-[10px] font-bold mb-3 uppercase tracking-wider text-gray-300">V</div><div className="w-16 h-16 rounded-[20px] border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"><Coffee size={20} className="text-gray-300" /></div></div>))}
                                 </div>
                                 <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-20" /><div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-20" />
                             </div>
                             <p className="text-center text-[10px] font-medium text-gray-400 mt-3 opacity-60">Klikni na slot dňa hore a vyber typ zmeny dole.</p>
                        </div>
                        <div>
                             <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-4 px-2">VYBRAŤ TYP ZMENY</label>
                             <div className="grid grid-cols-4 gap-3">{[ { id: 'R', ...SHIFT_STYLES['R'] }, { id: 'P', ...SHIFT_STYLES['P'] }, { id: 'N', ...SHIFT_STYLES['N'] }, { id: 'V', ...SHIFT_STYLES['V'] } ].map((type) => { const isActiveForSlot = shiftPattern[selectedSlotIndex] === type.id; return (<button key={type.id} onClick={() => handleShiftTypeSelect(type.id)} className={`relative flex flex-col items-center justify-center gap-3 p-3 py-5 rounded-[24px] border transition-all duration-300 ${isActiveForSlot ? `bg-white border-blue-500 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.4)] scale-105 z-10` : `bg-gray-50/50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-1`}`}>{isActiveForSlot && (<div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm animate-scale-in"><Check size={12} strokeWidth={4} /></div>)}<div className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 ${isActiveForSlot ? `${type.bg} ${type.text} scale-110 shadow-inner` : `bg-white text-gray-300 shadow-sm`}`}>{type.icon}</div><span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isActiveForSlot ? 'text-gray-800' : 'text-gray-400'}`}>{type.label}</span></button>); })}</div>
                        </div>
                        <div className="pt-8 border-t border-gray-100 animate-fade-in-up" style={{ animationDelay: '100ms' }}><div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2"><CalendarDays size={14} strokeWidth={2.5} /> ZAČIATOK CYKLU</div><button onClick={() => setIsDatePickerOpen(true)} className="w-full bg-gray-50/80 hover:bg-white rounded-[28px] p-2 pr-6 flex items-center justify-between border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group relative overflow-hidden"><div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" /><div className="flex items-center gap-5 relative z-10"><div className="w-16 h-16 rounded-[22px] bg-white text-blue-600 flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-105 group-hover:border-blue-200 group-hover:shadow-blue-200/50 transition-all duration-500"><div className="font-bold text-2xl group-hover:scale-110 transition-transform duration-500">{startDate ? new Date(startDate).getDate() : '?'}</div></div><div className="flex flex-col items-start"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Dátum začiatku</span><div className="text-xl font-bold text-gray-900 font-mono tracking-tight group-hover:translate-x-1 transition-transform duration-300">{startDate ? new Date(startDate).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' }) : 'Vyberte dátum'}</div></div></div><div className="w-10 h-10 rounded-full bg-white text-gray-300 flex items-center justify-center shadow-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 relative z-10"><ChevronRight size={20} className="text-blue-500" /></div></button></div>
                        <div className="pt-8 border-t border-gray-100 animate-fade-in-up" style={{ animationDelay: '200ms' }}><div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2"><Clock size={14} strokeWidth={2.5} /> ČASY SMIEN</div><div className="space-y-4">{(['R', 'P', 'N'] as const).map((code, index) => { const style = SHIFT_STYLES[code]; return (<div key={code} className="group flex items-center gap-4 bg-white hover:bg-gray-50/80 rounded-[28px] p-2 pr-4 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500" style={{ animationDelay: `${300 + (index * 100)}ms` }}><div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500 relative overflow-hidden ${style.bg} ${style.text} group-hover:scale-105 group-hover:shadow-md`}><div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />{style.icon}</div><div className="w-24 font-bold text-sm text-gray-700 pl-1 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-300">{style.label}</div><div className="flex-1 flex items-center justify-end gap-3"><div className="relative group/time"><input type="time" value={shiftTimes[code].start} onChange={(e) => handleShiftTimeChange(code, 'start', e.target.value)} className="bg-gray-50 border border-transparent rounded-[14px] px-0 py-2.5 text-sm font-bold text-gray-900 w-[72px] text-center focus:ring-0 cursor-pointer group-hover/time:bg-white group-hover/time:shadow-lg group-hover/time:shadow-blue-500/10 group-hover/time:border-blue-100 group-hover/time:text-blue-600 transition-all duration-300" /></div><div className="w-4 h-0.5 bg-gray-200 rounded-full group-hover:bg-blue-200 group-hover:w-6 transition-all duration-500" /><div className="relative group/time"><input type="time" value={shiftTimes[code].end} onChange={(e) => handleShiftTimeChange(code, 'end', e.target.value)} className="bg-gray-50 border border-transparent rounded-[14px] px-0 py-2.5 text-sm font-bold text-gray-900 w-[72px] text-center focus:ring-0 cursor-pointer group-hover/time:bg-white group-hover/time:shadow-lg group-hover/time:shadow-blue-500/10 group-hover/time:border-blue-100 group-hover/time:text-blue-600 transition-all duration-300" /></div></div></div>) })}</div></div>
                     </div>
                     <div className="h-6" />
                 </div>
                 <div className="flex-shrink-0 p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 sm:pb-6 relative z-20">
                     <button onClick={handleSave} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-[20px] font-bold text-lg shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"><Check size={20} strokeWidth={3} /> Uložiť nastavenia</button>
                 </div>
            </div>
            <DatePickerSheet isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={startDate ? new Date(startDate) : new Date()} onSelect={handleDateSelect} />
        </div>, document.body
    );
};

const DatePickerSheet = ({ isOpen, onClose, selectedDate, onSelect }: any) => {
   const [viewDate, setViewDate] = useState(selectedDate || new Date());
   useEffect(() => { if (isOpen && selectedDate) { setViewDate(selectedDate); } }, [isOpen, selectedDate]);
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
      <div className="fixed inset-0 z-[10000] flex items-end justify-center pointer-events-none">
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

export default MonthOverview;
