
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShiftConfig, AttendanceRecord, ShiftTimes } from '../types';
import { Zap, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase, Settings2, Moon, Sun, Coffee, X, Check, Repeat, CalendarDays, LucideProps } from 'lucide-react';

interface MonthOverviewProps {
  config: ShiftConfig;
  onUpdateConfig: (config: ShiftConfig) => void;
  records: AttendanceRecord[];
}

const SHIFT_STYLES: Record<string, { bg: string, text: string, glow: string, border: string, icon: React.ReactNode, label: string, cardBg: string, accent: string }> = {
  'R': { bg: 'bg-amber-100', text: 'text-amber-600', glow: 'shadow-amber-500/20', border: 'border-amber-200', icon: <Sun size={20} />, label: 'Ranná', cardBg: 'bg-amber-50', accent: 'bg-amber-500' },
  'P': { bg: 'bg-blue-100', text: 'text-blue-600', glow: 'shadow-blue-500/20', border: 'border-blue-200', icon: <Zap size={20} />, label: 'Poobedná', cardBg: 'bg-blue-50', accent: 'bg-blue-500' },
  'N': { bg: 'bg-slate-900', text: 'text-white', glow: 'shadow-slate-900/20', border: 'border-slate-800', icon: <Moon size={20} />, label: 'Nočná', cardBg: 'bg-slate-100', accent: 'bg-slate-900' },
  'V': { bg: 'bg-gray-100', text: 'text-gray-400', glow: 'shadow-transparent', border: 'border-gray-200', icon: <Coffee size={20} />, label: 'Voľno', cardBg: 'bg-gray-50', accent: 'bg-gray-300' }
};

const MonthOverview: React.FC<MonthOverviewProps> = ({ config, onUpdateConfig, records }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const MONTH_NAMES = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];

  const getShiftCodeForDay = (day: number) => {
    if (!config.isActive || !config.cycle || config.cycle.length === 0) return 'V';
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
     switch(code) {
         case 'R': return { start: '06:00', end: '14:00' };
         case 'P': return { start: '14:00', end: '22:00' };
         case 'N': return { start: '22:00', end: '06:00' };
         default: return null;
     }
  };

  const selectedShift = getSelectedShift();
  const selectedTimes = getShiftTimes(getShiftCodeForDay(selectedDay));

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
            if (code !== 'V') fund += (config.shiftLength || 8);
        } else {
             const day = new Date(year, month, d).getDay();
             if (day !== 0 && day !== 6) fund += 8;
        }
    }

    const workedHours = workedMinutes / 60;
    const percentage = fund > 0 ? Math.round((workedHours / fund) * 100) : 0;

    return { workedHours: parseFloat(workedHours.toFixed(1)), fund, percentage };
  }, [records, year, month, config, daysInMonth]); 

  return (
    <div className="pt-12 px-6 pb-32 animate-fade-in font-sans">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500 border border-gray-100">
            <CalendarIcon size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Prehľad</span>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Môj Kalendár</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
        >
          <Settings2 size={24} />
        </button>
      </header>

      <div className="flex items-center justify-between mb-8 px-2">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm text-blue-500 font-bold tracking-[0.3em] uppercase">{MONTH_NAMES[month]}</span>
          <span className="text-xs text-slate-400 font-semibold">{year}</span>
        </div>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="w-full mb-8">
        <div className="grid grid-cols-7 mb-6 text-center">
          {['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'].map((day, i) => (
            <div key={day} className={`text-[10px] font-bold ${i >= 5 ? 'text-rose-500' : 'text-slate-400'} uppercase tracking-widest`}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-5 text-center">
          {Array.from({ length: startingDay }).map((_, i) => (<div key={`empty-${i}`} />))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const isSelected = selectedDay === d;
            const shiftCode = getShiftCodeForDay(d);
            const style = SHIFT_STYLES[shiftCode] || SHIFT_STYLES['V'];
            const isWork = shiftCode !== 'V';
            
            return (
              <div key={d} className="flex items-center justify-center relative">
                <button
                  onClick={() => setSelectedDay(d)}
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all relative z-10
                    ${isSelected 
                        ? 'bg-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' 
                        : isWork 
                          ? 'text-slate-700 font-bold' 
                          : 'text-slate-400'
                    }
                  `}
                >
                  {d}
                  {!isSelected && isWork && (
                    <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${style.accent}`} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] mb-6 border border-gray-50">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Briefcase size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mesačný fond</span>
          </div>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{stats.percentage}%</span>
        </div>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-light text-slate-900">{stats.fund}</span>
          <span className="text-lg text-slate-400 font-medium">hod</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.percentage}%` }}></div>
        </div>
        <div className="mt-3 flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Odpracované: {stats.workedHours}h</span>
          <span>Cieľ: {stats.fund}h</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-50 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Detail Dňa</h3>
            <p className="text-lg font-bold text-slate-900">{selectedDay}. {MONTH_NAMES[month]} {year}</p>
          </div>
          <div className={`p-3 rounded-2xl ${selectedShift.bg} ${selectedShift.text} shadow-sm border ${selectedShift.border}`}>
            {selectedShift.icon}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Typ zmeny</span>
            <span className={`text-sm font-bold bg-white px-4 py-1.5 rounded-xl shadow-sm border border-gray-100 ${selectedShift.text} flex items-center gap-2`}>
              {React.isValidElement(selectedShift.icon) && React.cloneElement(selectedShift.icon as React.ReactElement<LucideProps>, { size: 14 })}
              <span className="opacity-60">{getShiftCodeForDay(selectedDay)} -</span>
              {selectedShift.label}
            </span>
          </div>
          {selectedShift.label !== 'Voľno' && selectedTimes && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Príchod</span>
                <span className="text-lg font-bold text-slate-900">{selectedTimes.start}</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Odchod</span>
                <span className="text-lg font-bold text-slate-900">{selectedTimes.end}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShiftSettingsSheet 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config} 
        onSave={onUpdateConfig} 
      />
    </div>
  );
};

const ScreenshotStepper = ({ label, value, onIncrement, onDecrement, unit }: any) => (
    <div className="flex flex-col items-center justify-center py-2 px-1">
        <div className="text-3xl font-black text-slate-800 mb-1 flex items-baseline">
          {value}
          {unit && <span className="text-xs font-bold text-slate-300 ml-0.5">{unit}</span>}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onDecrement} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-300 border border-slate-100 shadow-sm active:scale-90 transition-all text-xl font-bold">-</button>
          <button onClick={onIncrement} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-300 border border-slate-100 shadow-sm active:scale-90 transition-all text-xl font-bold">+</button>
        </div>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</span>
    </div>
);

const ShiftSettingsSheet = ({ isOpen, onClose, config, onSave }: any) => {
    const [isActive, setIsActive] = useState(config?.isActive ?? false);
    const [workDays, setWorkDays] = useState(5);
    const [restDays, setRestDays] = useState(2);
    const [shiftLength, setShiftLength] = useState(8);
    
    const getTodayString = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const [startDate, setStartDate] = useState(config?.startDate || getTodayString());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [shiftTimes, setShiftTimes] = useState<ShiftTimes>({ 'R': { start: '06:00', end: '14:00' }, 'P': { start: '14:00', end: '22:00' }, 'N': { start: '22:00', end: '06:00' } });
    const [shiftPattern, setShiftPattern] = useState<string[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
    const [viewDate, setViewDate] = useState(new Date(startDate));

    useEffect(() => {
        if(isOpen && config) {
            setIsActive(config.isActive); 
            setStartDate(config.startDate); 
            setViewDate(new Date(config.startDate));
            setShiftLength(config.shiftLength || 8);
            if (config.shiftTimes) setShiftTimes(config.shiftTimes);
            const currentCycle = config.cycle || [];
            const w = currentCycle.filter((c:string) => c !== 'V').length;
            const r = currentCycle.filter((c:string) => c === 'V').length;
            const existingPattern = currentCycle.filter((c:string) => c !== 'V');
            setShiftPattern(existingPattern.length > 0 ? existingPattern : Array(5).fill('R'));
            setWorkDays(w || 5); setRestDays(r || 2);
        }
    }, [isOpen, config]);

    useEffect(() => {
        setShiftPattern(prev => workDays > prev.length ? [...prev, ...Array(workDays - prev.length).fill('R')] : prev.slice(0, workDays));
        if (selectedSlotIndex >= workDays) setSelectedSlotIndex(Math.max(0, workDays - 1));
    }, [workDays]);

    const handleShiftTypeSelect = (type: string) => { 
      const newPattern = [...shiftPattern]; 
      newPattern[selectedSlotIndex] = type; 
      setShiftPattern(newPattern); 
      if (selectedSlotIndex < workDays - 1) setSelectedSlotIndex(prev => prev + 1); 
    };

    const handleSave = () => { 
      const newCycle = [ ...shiftPattern, ...Array(Math.max(0, Number(restDays))).fill('V') ]; 
      onSave({ ...config, isActive, startDate, cycle: newCycle, shiftLength, shiftTimes }); 
      onClose(); 
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const MONTH_NAMES = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
    const DAYS = ['PO', 'UT', 'ST', 'ŠT', 'PI', 'SO', 'NE'];

    const changeViewMonth = (offset: number) => { 
        setViewDate(new Date(year, month + offset, 1)); 
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-[40px] shadow-2xl z-10 flex flex-col max-h-[95vh] animate-slide-up overflow-hidden max-w-lg">
                 <div className="flex justify-between items-center px-8 pt-8 pb-3">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Nastavenie Turnusu</h3>
                    <button onClick={onClose} className="w-9 h-9 bg-slate-50 rounded-full text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
                      <X size={18} />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto px-8 py-2 space-y-5 no-scrollbar">
                     {!isActive && (
                       <button onClick={() => setIsActive(true)} className="w-full py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4 animate-scale-in text-sm">
                         <Repeat size={18} /> Zapnúť turnusový režim
                       </button>
                     )}

                     <div className={`space-y-5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-[#f8fafc] rounded-[32px] p-4 border border-slate-100 shadow-sm">
                          <ScreenshotStepper label="Dni v práci" value={workDays} onIncrement={() => setWorkDays(d => d + 1)} onDecrement={() => setWorkDays(d => Math.max(1, d - 1))} />
                          <ScreenshotStepper label="Dni voľna" value={restDays} onIncrement={() => setRestDays(d => d + 1)} onDecrement={() => setRestDays(d => Math.max(0, d - 1))} />
                          <ScreenshotStepper label="Dĺžka smeny" value={shiftLength} unit="h" onIncrement={() => setShiftLength((l: number) => parseFloat((Math.min(24, l + 0.25)).toFixed(2)))} onDecrement={() => setShiftLength((l: number) => parseFloat((Math.max(1, l - 0.25)).toFixed(2)))} />
                        </div>

                        <div>
                             <div className="flex items-center justify-between mb-2 px-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">EDITOR CYKLU</label>
                               <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Deň {selectedSlotIndex + 1}</span>
                             </div>
                             <div className="flex gap-2.5 overflow-x-auto pt-4 pb-6 no-scrollbar snap-x px-2">
                                {shiftPattern.map((code, index) => {
                                  const isActiveSlot = index === selectedSlotIndex;
                                  return (
                                    <button 
                                      key={index} 
                                      onClick={() => setSelectedSlotIndex(index)} 
                                      className={`
                                        flex-shrink-0 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center transition-all snap-start relative
                                        ${isActiveSlot ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10 scale-110' : 'border-slate-100 bg-slate-50/50 text-slate-300'}
                                      `}
                                    >
                                      <div className={`${isActiveSlot ? 'text-blue-500' : 'text-slate-300'} flex items-center justify-center`}>
                                        {React.isValidElement(SHIFT_STYLES[code].icon) && React.cloneElement(SHIFT_STYLES[code].icon as React.ReactElement<LucideProps>, { size: 16 })}
                                      </div>
                                      <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 rounded-full ${isActiveSlot ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{code}</span>
                                      {isActiveSlot && (
                                        <div className="absolute -bottom-1.5 w-4 h-1 bg-blue-500 rounded-full" />
                                      )}
                                    </button>
                                  );
                                })}
                             </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5 px-1 py-2">
                          {(['R', 'P', 'N', 'V'] as const).map(type => {
                            const isSelected = shiftPattern[selectedSlotIndex] === type;
                            return (
                              <button 
                                key={type} 
                                onClick={() => handleShiftTypeSelect(type)} 
                                className={`
                                  flex flex-col items-center gap-1.5 p-2 rounded-[28px] border-2 transition-all h-20 justify-center
                                  ${isSelected 
                                    ? 'border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm scale-105' 
                                    : 'border-slate-100 bg-white text-slate-400'
                                  }
                                `}
                              >
                                <div className={`flex items-center gap-1.5 transition-transform duration-300 ${isSelected ? 'scale-110 text-blue-500' : 'text-slate-300'}`}>
                                  {React.isValidElement(SHIFT_STYLES[type].icon) && React.cloneElement(SHIFT_STYLES[type].icon as React.ReactElement<LucideProps>, { size: 14 })}
                                  <span className="text-xs font-black">{type}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-center leading-none mt-1">{SHIFT_STYLES[type].label}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="px-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-2 pl-1">ZAČIATOK CYKLU</label>
                             <button 
                                onClick={() => setIsDatePickerOpen(true)} 
                                className="w-full bg-[#f8fafc] rounded-[24px] p-4 flex items-center justify-between border border-slate-100 shadow-sm active:bg-slate-100 transition-colors"
                             >
                               <span className="text-sm font-bold text-slate-700">
                                 {new Date(startDate).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}
                               </span>
                               <CalendarDays size={18} className="text-blue-500" />
                             </button>
                        </div>
                     </div>
                 </div>

                 <div className="p-6 bg-white border-t border-slate-50 shadow-[0_-15px_40px_-20px_rgba(0,0,0,0.15)]" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
                     <button 
                        onClick={handleSave} 
                        className="w-full py-6 bg-slate-900 text-white rounded-[26px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/30 active:scale-[0.96] transition-all transform-gpu"
                     >
                        <Check size={28} strokeWidth={4} /> Uložiť nastavenia
                     </button>
                 </div>
            </div>

            {isDatePickerOpen && createPortal(
              <div className="fixed inset-0 z-[10001] flex items-end justify-center">
                 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in" onClick={() => setIsDatePickerOpen(false)} />
                 <div className="bg-white w-full max-w-lg rounded-t-[40px] p-6 pb-10 animate-slide-up z-10 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-slate-900 text-xl tracking-tight">Vyberte štart cyklu</h4>
                        <button onClick={() => setIsDatePickerOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-6 px-2">
                        <button onClick={() => changeViewMonth(-1)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-600"><ChevronLeft size={24} /></button>
                        <div className="text-lg font-black text-slate-900 uppercase tracking-wider">{MONTH_NAMES[month]} {year}</div>
                        <button onClick={() => changeViewMonth(1)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors text-slate-600"><ChevronRight size={24} /></button>
                    </div>

                    <div className="grid grid-cols-7 mb-4 text-center">
                        {DAYS.map((d, i) => (
                            <div key={d} className={`text-[10px] font-black ${i >= 5 ? 'text-rose-400' : 'text-slate-300'} uppercase tracking-[0.2em]`}>{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-3 place-items-center mb-8">
                        {Array.from({ length: startDay }).map((_, i) => (<div key={`empty-${i}`} />))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = new Date(startDate).getDate() === day && new Date(startDate).getMonth() === month && new Date(startDate).getFullYear() === year;
                            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                            
                            return (
                                <button 
                                    key={day} 
                                    onClick={() => {
                                        const y = year;
                                        const m = String(month + 1).padStart(2, '0');
                                        const d = String(day).padStart(2, '0');
                                        setStartDate(`${y}-${m}-${d}`);
                                        setIsDatePickerOpen(false);
                                    }} 
                                    className={`
                                        w-11 h-11 rounded-[14px] flex items-center justify-center text-sm transition-all relative
                                        ${isSelected 
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 font-black scale-110 z-10' 
                                            : isToday 
                                                ? 'bg-blue-50 text-blue-600 font-bold' 
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    {day}
                                    {isToday && !isSelected && <div className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full" />}
                                </button>
                            );
                        })}
                    </div>

                    <button onClick={() => setIsDatePickerOpen(false)} className="w-full py-5 bg-slate-100 rounded-[24px] font-black text-slate-500 text-base uppercase tracking-widest active:bg-slate-200 transition-colors">Zavrieť</button>
                 </div>
              </div>, document.body
            )}
        </div>, document.body
    );
};

export default MonthOverview;
