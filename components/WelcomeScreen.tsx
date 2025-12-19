
import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Zap, ShieldCheck, Sparkles, Clock, Calendar, Users, Terminal } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (mode: 'login' | 'register' | 'dev') => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDevMode(localStorage.getItem('dev_mode_active') === 'true');
    
    const interval = setInterval(() => {
        const time = Date.now() / 1000;
        const val = 86 + Math.sin(time * 2) * 12; 
        setSimulatedProgress(val);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * simulatedProgress) / 100;

  return (
    <div className="min-h-screen h-[100dvh] relative overflow-hidden bg-white text-gray-900 font-sans selection:bg-blue-100 transform-gpu flex flex-col">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
         <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[60%] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-[40px] animate-pulse-slow transform-gpu" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-gradient-to-tl from-teal-400/10 to-transparent rounded-full blur-[40px] transform-gpu" />
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-safe-top pb-10 max-w-lg mx-auto w-full transform-gpu">
         
         {/* Header / Brand */}
         <div className={`pt-8 transition-all duration-1000 ease-out transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20 transform-gpu">
                     <Activity size={18} />
                 </div>
                 <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">Dochádzka Pro</span>
             </div>
         </div>

         {/* Main Visual - Centered flexibly */}
         <div className="flex-1 flex flex-col justify-center items-center py-4 transform-gpu">
             <div className={`relative w-full aspect-square max-w-[260px] xs:max-w-[300px] transition-all duration-1000 delay-200 transform-gpu ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 
                 {/* Floating Elements with tighter constraints */}
                 <div className="absolute inset-0 animate-spin-slow will-change-transform transform-gpu">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-amber-500 transform-gpu">
                         <Zap size={20} fill="currentColor" />
                     </div>
                     <div className="absolute bottom-10 left-0 w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center text-blue-600 border border-white transform-gpu">
                         <Clock size={18} />
                     </div>
                 </div>
                 
                 <div className="absolute inset-6 animate-reverse-spin will-change-transform transform-gpu">
                     <div className="absolute bottom-0 right-0 translate-x-2 translate-y-2 w-10 h-10 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center text-white transform-gpu">
                         <ShieldCheck size={18} />
                     </div>
                     <div className="absolute top-6 right-[-8px] w-8 h-8 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-indigo-500 transform-gpu">
                         <Calendar size={16} />
                     </div>
                     <div className="absolute top-1/2 left-[-15px] -translate-y-1/2 w-8 h-8 bg-teal-50 border border-teal-100 rounded-lg shadow-sm flex items-center justify-center text-teal-600 transform-gpu">
                         <Users size={16} />
                     </div>
                 </div>

                 {/* Central Circle */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] flex flex-col items-center text-center transform-gpu">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Produktivita</div>
                      <div className="relative w-28 h-28 xs:w-32 xs:h-32 flex items-center justify-center mb-1 transform-gpu">
                          <svg className="w-full h-full transform -rotate-90 drop-shadow-md transform-gpu" viewBox="0 0 100 100">
                              <defs>
                                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#a855f7" />
                                  </linearGradient>
                              </defs>
                              <circle cx="50" cy="50" r={radius} stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="50" cy="50" r={radius} 
                                stroke="url(#circleGradient)" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-75 ease-linear will-change-transform transform-gpu"
                              />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center transform-gpu">
                              <span className="text-2xl xs:text-3xl font-bold text-gray-900 tracking-tighter">
                                  {Math.round(simulatedProgress)}%
                              </span>
                          </div>
                      </div>
                 </div>
             </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`mt-auto space-y-5 transition-all duration-1000 delay-500 transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="text-center space-y-2">
                 <h1 className="text-3xl xs:text-4xl font-light text-gray-900 leading-tight transform-gpu">
                    Budúcnosť <br />
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        tvojho času.
                    </span>
                 </h1>
             </div>

             <div className="space-y-3 transform-gpu w-full">
                 <button onClick={() => onNavigate('register')} className="group relative w-full py-4 bg-gray-900 text-white rounded-[22px] font-bold text-lg overflow-hidden shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all transform-gpu">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black transition-transform group-hover:scale-105 transform-gpu" />
                    <div className="relative flex items-center justify-center gap-2 transform-gpu">
                        <span>Začať</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform opacity-60 ml-1" />
                    </div>
                 </button>
                 <div className="grid grid-cols-1 gap-2.5 transform-gpu">
                     <button onClick={() => onNavigate('login')} className="w-full py-4 bg-white text-gray-700 rounded-[22px] font-bold text-lg border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all transform-gpu">Mám účet</button>
                     {isDevMode && (<button onClick={() => onNavigate('dev')} className="w-full py-3 bg-amber-50 text-amber-600 rounded-[18px] font-bold text-xs border border-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 animate-fade-in transform-gpu"><Terminal size={14} /> Vstúpiť ako Vývojár</button>)}
                 </div>
             </div>
         </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: translate3d(0,0,0) rotate(0deg); } to { transform: translate3d(0,0,0) rotate(360deg); } }
        @keyframes reverse-spin { from { transform: translate3d(0,0,0) rotate(360deg); } to { transform: translate3d(0,0,0) rotate(0deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.5; transform: translate3d(0,0,0) scale(1); } 50% { opacity: 0.8; transform: translate3d(0,0,0) scale(1.05); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-reverse-spin { animation: reverse-spin 25s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .pt-safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
