
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
    <div className="min-h-screen h-[100dvh] relative overflow-hidden bg-white text-gray-900 font-sans flex flex-col items-center">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
         <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-[60px] animate-pulse-slow transform-gpu" />
         <div className="absolute bottom-[-5%] right-[-5%] w-[80%] h-[40%] bg-gradient-to-tl from-teal-400/10 to-transparent rounded-full blur-[60px] transform-gpu" />
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md px-6 py-8 transform-gpu h-full">
         
         {/* Header / Brand */}
         <div className={`w-full transition-all duration-1000 ease-out transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="flex items-center gap-2.5 mb-2">
                 <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-900/10 transform-gpu">
                     <Activity size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-[0.25em] text-gray-400 uppercase leading-none">Dochádzka Pro</span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Vagonaris Edition</span>
                 </div>
             </div>
         </div>

         {/* Main Visual - Stable Centering */}
         <div className="flex-1 w-full flex items-center justify-center relative transform-gpu">
             <div className={`relative w-full max-w-[280px] aspect-square flex items-center justify-center transition-all duration-1000 delay-200 transform-gpu ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 
                 {/* Floating Elements - Orbiting central point */}
                 <div className="absolute inset-0 animate-spin-slow pointer-events-none transform-gpu">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-amber-500 border border-gray-50 transform-gpu">
                         <Zap size={22} fill="currentColor" />
                     </div>
                     <div className="absolute bottom-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center text-blue-600 border border-white transform-gpu">
                         <Clock size={18} />
                     </div>
                 </div>
                 
                 <div className="absolute inset-8 animate-reverse-spin pointer-events-none transform-gpu">
                     <div className="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 rounded-2xl shadow-xl flex items-center justify-center text-white transform-gpu">
                         <ShieldCheck size={20} />
                     </div>
                     <div className="absolute top-0 right-0 w-8 h-8 bg-white border border-gray-100 rounded-xl shadow-md flex items-center justify-center text-indigo-500 transform-gpu">
                         <Calendar size={16} />
                     </div>
                 </div>

                 {/* Central Progress Circle */}
                 <div className="relative flex flex-col items-center justify-center z-20 transform-gpu">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 opacity-60">Produktivita</div>
                      <div className="relative w-36 h-36 xs:w-40 xs:h-40 flex items-center justify-center transform-gpu">
                          <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl transform-gpu" viewBox="0 0 100 100">
                              <defs>
                                  <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#8b5cf6" />
                                  </linearGradient>
                                  <filter id="glow">
                                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                      <feMerge>
                                          <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                      </feMerge>
                                  </filter>
                              </defs>
                              <circle cx="50" cy="50" r={radius} stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="50" cy="50" r={radius} 
                                stroke="url(#welcomeGradient)" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                filter="url(#glow)"
                                className="transition-all duration-75 ease-linear transform-gpu"
                              />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center transform-gpu">
                              <span className="text-4xl font-black text-gray-900 tracking-tighter">
                                  {Math.round(simulatedProgress)}<span className="text-xl opacity-20 ml-0.5">%</span>
                              </span>
                          </div>
                      </div>
                 </div>
             </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`w-full mt-auto space-y-6 transition-all duration-1000 delay-500 transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="text-center space-y-3">
                 <h1 className="text-4xl font-light text-gray-900 leading-[1.1] tracking-tight transform-gpu">
                    Budúcnosť <br />
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        tvojho času.
                    </span>
                 </h1>
                 <p className="text-xs font-medium text-gray-400 max-w-[200px] mx-auto leading-relaxed">Sledujte svoj výkon a tímu s precíznosťou profesionálov.</p>
             </div>

             <div className="space-y-3 transform-gpu w-full">
                 <button onClick={() => onNavigate('register')} className="group relative w-full py-5 bg-gray-900 text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all transform-gpu flex items-center justify-center gap-3 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity transform-gpu" />
                    <span className="relative z-10">Začať teraz</span>
                    <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                 </button>
                 
                 <div className="grid grid-cols-1 gap-3 transform-gpu">
                     <button onClick={() => onNavigate('login')} className="w-full py-4 bg-white text-gray-700 rounded-[24px] font-bold text-base border border-gray-100 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all transform-gpu">Mám účet</button>
                     {isDevMode && (
                        <button onClick={() => onNavigate('dev')} className="w-full py-3 bg-amber-50 text-amber-600 rounded-[20px] font-bold text-[10px] border border-amber-100 uppercase tracking-widest flex items-center justify-center gap-2 animate-fade-in transform-gpu">
                            <Terminal size={14} /> Developer Access
                        </button>
                     )}
                 </div>
             </div>
         </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.02); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        .animate-reverse-spin { animation: reverse-spin 30s linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
        .pt-safe-top { padding-top: max(1.5rem, env(safe-area-inset-top)); }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
