
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Star, ShieldCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (mode: 'login' | 'register' | 'dev') => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen h-[100dvh] relative overflow-hidden bg-[#0f172a] text-white font-sans flex flex-col items-center">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
         <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-br from-amber-500/10 via-transparent to-transparent rounded-full blur-[120px] animate-pulse-slow" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-gradient-to-tl from-red-600/10 via-transparent to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md px-6 py-10 h-full">
         
         {/* Top Branding */}
         <div className={`w-full flex justify-between items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
             <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-amber-500 rounded-[20px] flex items-center justify-center text-slate-900 shadow-[0_0_35px_rgba(245,158,11,0.4)] border-2 border-white/20">
                    <span className="font-black text-3xl tracking-tighter">V</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[16px] font-black tracking-[0.25em] text-amber-500 uppercase leading-none">Vagonaris</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-1.5">Elite Edition</span>
                 </div>
             </div>
             <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Premium</span>
             </div>
         </div>

         {/* MASCOT SECTION */}
         <div className="flex-1 w-full flex items-center justify-center relative my-4">
             <div className={`relative w-full max-w-[340px] aspect-square transition-all duration-1000 delay-300 transform-gpu ${mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 rotate-3'}`}>
                 {/* Intense central glow */}
                 <div className="absolute inset-4 bg-amber-500/15 rounded-full blur-[100px] animate-pulse-slow" />
                 
                 {/* The Boss Mascot */}
                 <img 
                    src="mascot.png" 
                    alt="Vagonaris Boss" 
                    className="w-full h-full object-contain relative z-20 drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                 />
                 
                 {/* Floating Badges */}
                 <div className="absolute top-8 right-0 bg-slate-900/90 backdrop-blur-xl p-4 rounded-[24px] border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.3)] animate-float">
                    <Zap size={28} className="text-amber-500 fill-amber-500" />
                 </div>
                 <div className="absolute bottom-10 left-0 bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-[20px] border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.2)] animate-float animation-delay-2000">
                    <ShieldCheck size={24} className="text-blue-500" />
                 </div>
             </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`w-full mt-auto space-y-10 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
             <div className="text-center space-y-6">
                 <h1 className="text-[48px] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                    DOCHÁDZKA <br />
                    <span className="boss-gradient-text drop-shadow-[0_4px_10px_rgba(245,158,11,0.3)]">
                        PRE BOSSOV.
                    </span>
                 </h1>
                 <p className="text-[12px] font-black text-white/30 max-w-[280px] mx-auto leading-relaxed uppercase tracking-[0.4em]">
                    Navrhnuté pre elitu slovenskej šichty.
                 </p>
             </div>

             <div className="space-y-4 w-full">
                 <button onClick={() => onNavigate('register')} className="group relative w-full py-7 bg-amber-500 text-slate-900 rounded-[35px] font-black text-2xl shadow-[0_25px_50px_rgba(245,158,11,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-5 overflow-hidden uppercase tracking-tight">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-25 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-shine" />
                    <span>VSTÚPIŤ DO TÍMU</span>
                    <ArrowRight size={28} strokeWidth={4} className="group-hover:translate-x-3 transition-transform" />
                 </button>
                 
                 <button onClick={() => onNavigate('login')} className="w-full py-5 bg-white/5 text-white/40 hover:text-white hover:border-white/20 rounded-[30px] font-black text-xs border border-white/5 hover:bg-white/10 transition-all uppercase tracking-[0.35em] backdrop-blur-sm">
                    UŽ MÁM SVOJ REZERVÉ
                 </button>
             </div>
         </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(2deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes shine { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(250%) skewX(-20deg); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-shine { animation: shine 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
