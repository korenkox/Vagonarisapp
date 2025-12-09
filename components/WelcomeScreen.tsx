
import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Zap, ShieldCheck, Sparkles, Clock, Calendar, Users } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (mode: 'login' | 'register') => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Simulate dynamic productivity fluctuation
    const interval = setInterval(() => {
        const time = Date.now() / 1000;
        // Smooth sine wave oscillation between ~74% and ~98%
        const val = 86 + Math.sin(time * 2) * 12; 
        setSimulatedProgress(val);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // SVG Maths
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * simulatedProgress) / 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-white text-gray-900 font-sans selection:bg-blue-100">
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Top Gradient Mesh */}
         <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[60%] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow" />
         
         {/* Bottom Accent */}
         <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-gradient-to-tl from-teal-400/10 to-transparent rounded-full blur-[80px]" />
         
         {/* Texture */}
         <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
           }}
         />
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 min-h-screen flex flex-col px-6 pt-12 pb-10 max-w-lg mx-auto">
         
         {/* Header / Brand */}
         <div className={`transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="flex items-center gap-2 mb-6">
                 <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
                     <Activity size={20} />
                 </div>
                 <span className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">Dochádzka Pro</span>
             </div>
         </div>

         {/* Main Visual - The 3D Composition */}
         <div className="flex-1 flex flex-col justify-center items-center py-8">
             <div className={`relative w-full aspect-square max-w-[320px] transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                 
                 {/* Main Circle Background REMOVED to show background animations */}
                 {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white rounded-full shadow-[0_40px_80px_-20px_rgba(59,130,246,0.3)] border border-white/80" /> */}
                 
                 {/* Orbiting Elements */}
                 <div className="absolute inset-0 animate-spin-slow">
                     {/* 1. Zap (Top) */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-amber-500">
                         <Zap size={24} fill="currentColor" />
                     </div>
                     {/* 2. Clock (Bottom Left) */}
                     <div className="absolute bottom-12 left-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl shadow-lg flex items-center justify-center text-blue-600 border border-white">
                         <Clock size={20} />
                     </div>
                 </div>
                 
                 <div className="absolute inset-8 animate-reverse-spin">
                     {/* 3. Shield (Bottom Right) */}
                     <div className="absolute bottom-0 right-1/4 translate-y-4 w-10 h-10 bg-gray-900 rounded-xl shadow-lg flex items-center justify-center text-white">
                         <ShieldCheck size={20} />
                     </div>
                     {/* 4. Calendar (Top Right) */}
                     <div className="absolute top-10 right-0 w-9 h-9 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center text-indigo-500">
                         <Calendar size={18} />
                     </div>
                     {/* 5. Users (Left) */}
                     <div className="absolute top-1/2 left-[-10px] -translate-y-1/2 w-9 h-9 bg-teal-50 border border-teal-100 rounded-lg shadow-sm flex items-center justify-center text-teal-600">
                         <Users size={18} />
                     </div>
                 </div>

                 {/* Center Stats Card Lookalike */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] flex flex-col items-center text-center">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Produktivita</div>
                      
                      {/* Dynamic Circular Graph */}
                      <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                          <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                              <defs>
                                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#a855f7" />
                                  </linearGradient>
                              </defs>
                              {/* Track */}
                              <circle 
                                cx="50" cy="50" r={radius} 
                                stroke="#f3f4f6" strokeWidth="8" fill="transparent" 
                              />
                              {/* Progress */}
                              <circle 
                                cx="50" cy="50" r={radius} 
                                stroke="url(#circleGradient)" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-75 ease-linear"
                              />
                          </svg>
                          
                          {/* Inner Text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-gray-900 tracking-tighter">
                                  {Math.round(simulatedProgress)}%
                              </span>
                          </div>
                      </div>
                      
                      <div className="text-[9px] font-medium text-gray-400">
                          Analýza v reálnom čase
                      </div>
                 </div>
             </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`mt-auto space-y-6 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             
             <div className="text-center space-y-3 mb-8">
                 <h1 className="text-4xl font-light text-gray-900 leading-[1.1]">
                    Budúcnosť <br />
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        tvojho času.
                    </span>
                 </h1>
                 <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Sleduj dochádzku, spravuj zmeny a analyzuj výkon tímu v jednej aplikácii.
                 </p>
             </div>

             <div className="space-y-3">
                 <button 
                    onClick={() => onNavigate('register')}
                    className="group relative w-full py-4 bg-gray-900 text-white rounded-[24px] font-bold text-lg overflow-hidden shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black transition-transform group-hover:scale-105" />
                    
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer" />

                    <div className="relative flex items-center justify-center gap-2">
                        <span>Začať</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform opacity-60 ml-1" />
                    </div>
                 </button>

                 <button 
                    onClick={() => onNavigate('login')}
                    className="w-full py-4 bg-white text-gray-700 rounded-[24px] font-bold text-lg border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
                 >
                    Mám účet
                 </button>
             </div>
         </div>

      </div>

      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 2s infinite;
        }
        .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
        }
        .animate-reverse-spin {
            animation: reverse-spin 25s linear infinite;
        }
        .animate-pulse-slow {
            animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
