
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Clock, ShieldCheck, Terminal, Star } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (mode: 'login' | 'register' | 'dev') => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [mounted, setMounted] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDevMode(localStorage.getItem('dev_mode_active') === 'true');
  }, []);

  return (
    <div className="min-h-screen h-[100dvh] relative overflow-hidden bg-[#0f172a] text-white font-sans flex flex-col items-center">
      
      {/* --- BACKGROUND AMBIENCE (BOSS THEME) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
         <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-br from-amber-600/20 via-transparent to-transparent rounded-full blur-[80px] animate-pulse-slow transform-gpu" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-gradient-to-tl from-red-600/10 via-transparent to-transparent rounded-full blur-[80px] transform-gpu" />
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md px-6 py-8 transform-gpu h-full">
         
         {/* Header / Brand */}
         <div className={`w-full flex justify-between items-center transition-all duration-1000 ease-out transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl shadow-amber-500/20 transform-gpu overflow-hidden border-2 border-white/10">
                    <span className="font-black text-xl">E</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[12px] font-black tracking-[0.3em] text-amber-500 uppercase leading-none">Vagonaris</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Boss Edition</span>
                 </div>
             </div>
             <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Premium System</span>
             </div>
         </div>

         {/* Main Visual - The Exact Mascot provided by user */}
         <div className="flex-1 w-full flex items-center justify-center relative transform-gpu">
             <div className={`relative w-full max-w-[360px] aspect-square transition-all duration-1000 delay-200 transform-gpu ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                 
                 {/* Aura around the boss */}
                 <div className="absolute inset-4 bg-amber-500/5 rounded-full blur-[60px] animate-pulse transform-gpu" />
                 
                 {/* 
                   MASCOT CONTAINER:
                   Tu vložte váš obrázok maskota (mascot.png). 
                   Jeho vizuál, medailón aj styl ostávajú 1:1.
                 */}
                 <div className="relative w-full h-full flex items-center justify-center transform-gpu">
                    <div className="w-full h-full relative group">
                        {/* Placeholder pre tvoj presný obrázok */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* 
                               Tento img tag teraz simuluje tvojho maskota. 
                               V produkcii tu bude tvoj súbor, ktorý si nahral.
                            */}
                            <img 
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=VagonarisBoss&skinColor=452c1e&topType=noHair&facialHairType=blank&clothingType=shirtVNeck&clothingColor=gray02&accessoriesType=blank" 
                                className="w-full h-full object-contain transform-gpu transition-transform duration-700 group-hover:scale-[1.05]" 
                                alt="The Real Boss" 
                            />
                        </div>

                        {/* Pôvodný medailón by bol na obrázku, tu pridáme len "záblesk" pre efekt na mieste kde je tvoj medailón */}
                        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-32 h-32 flex items-center justify-center pointer-events-none">
                             <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_50px_20px_rgba(251,191,36,0.3)] animate-pulse" />
                        </div>
                    </div>
                 </div>

                 {/* Floating Badges */}
                 <div className="absolute top-10 right-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl animate-bounce-slow transform-gpu">
                    <Star size={20} className="text-amber-500 fill-amber-500" />
                 </div>
                 <div className="absolute bottom-10 left-0 bg-amber-500 p-3 rounded-2xl shadow-2xl shadow-amber-500/20 text-slate-900 animate-spin-slow transform-gpu">
                    <Zap size={20} fill="currentColor" />
                 </div>
             </div>
         </div>

         {/* Bottom Action Area */}
         <div className={`w-full mt-auto space-y-8 transition-all duration-1000 delay-500 transform-gpu ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             <div className="text-center space-y-4">
                 <h1 className="text-5xl font-black text-white leading-[1] tracking-tighter transform-gpu">
                    ŠÉFUJ <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                        SVOJMU ČASU.
                    </span>
                 </h1>
                 <p className="text-[11px] font-black text-amber-500/60 max-w-[240px] mx-auto leading-relaxed uppercase tracking-[0.3em]">Dochádzka pre skutočných pánov šichty.</p>
             </div>

             <div className="space-y-4 transform-gpu w-full">
                 <button onClick={() => onNavigate('register')} className="group relative w-full py-6 bg-amber-500 text-slate-900 rounded-[30px] font-black text-xl shadow-2xl shadow-amber-500/20 active:scale-[0.98] transition-all transform-gpu flex items-center justify-center gap-4 overflow-hidden">
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity transform-gpu" />
                    <span className="relative z-10">ZAČAŤ TERAZ</span>
                    <ArrowRight size={24} strokeWidth={3} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                 </button>
                 
                 <div className="grid grid-cols-1 gap-3 transform-gpu">
                     <button onClick={() => onNavigate('login')} className="w-full py-4 bg-white/5 text-white/60 hover:text-white rounded-[26px] font-bold text-base border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all transform-gpu uppercase tracking-widest">Už mám prístup</button>
                 </div>
             </div>
         </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
