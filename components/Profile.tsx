
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, Bell, Settings, LogOut, ChevronRight, User as UserIcon, Download, Terminal, Smartphone, Zap } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDevMode, setIsDevMode] = useState(() => localStorage.getItem('dev_mode_active') === 'true');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const toggleDevMode = () => {
    const newState = !isDevMode;
    setIsDevMode(newState);
    localStorage.setItem('dev_mode_active', String(newState));
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="pt-8 px-6 pb-32 animate-fade-in">
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-light text-gray-800">
          Tvoj <span className="font-bold">Profil</span>
        </h1>
      </div>

      {/* Hero Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-8 shadow-xl shadow-blue-900/5 border border-white mb-8 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-50 to-transparent opacity-50 pointer-events-none" />
        
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner relative z-10">
          <UserIcon size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 relative z-10">{user.name || 'Užívateľ'}</h2>
        <p className="text-gray-400 text-sm mb-6 relative z-10">{user.email}</p>
        
        <div className="flex gap-2 relative z-10">
            <button className="px-6 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-blue-100 transition-colors">
              Premium Účet
            </button>
            {isDevMode && (
                <div className="px-4 py-2 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 border border-amber-100">
                    <Terminal size={10} /> Dev
                </div>
            )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-6">
        
        {/* Dev Mode Section */}
        <h3 className="text-xs font-bold text-amber-500/60 uppercase tracking-widest pl-4 flex items-center gap-2">
            <Terminal size={12} /> Vývojárske nastavenia
        </h3>
        <div className="bg-amber-50/30 backdrop-blur-lg rounded-3xl overflow-hidden border border-amber-100/50 shadow-sm">
            <div className="w-full p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Zap size={20} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-gray-900 block">Developer Mode</span>
                        <span className="text-[10px] text-amber-600/70 font-bold uppercase tracking-tight">Rýchly vstup do aplikácie</span>
                    </div>
                </div>
                <button 
                    onClick={toggleDevMode}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isDevMode ? 'bg-amber-500' : 'bg-gray-200'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 transform ${isDevMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>

        {/* Install App Section */}
        {isInstallable && (
            <>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Aplikácia</h3>
                <div className="bg-white/60 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/50 shadow-sm">
                    <button 
                        onClick={handleInstallClick}
                        className="w-full p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Download size={20} />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-gray-900 block">Nainštalovať aplikáciu</span>
                            <span className="text-xs text-gray-500">Pridať na plochu telefónu</span>
                        </div>
                        </div>
                    </button>
                </div>
            </>
        )}

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Nastavenia účtu</h3>
        <div className="bg-white/60 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/50 shadow-sm">
          <button className="w-full p-5 flex items-center justify-between hover:bg-white/50 transition-colors border-b border-gray-100/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                <Shield size={20} />
              </div>
              <span className="font-bold text-gray-700">Zmena hesla</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <div className="w-full p-5 flex items-center justify-between hover:bg-white/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                <Bell size={20} />
              </div>
              <span className="font-bold text-gray-700">Notifikácie</span>
            </div>
            <div className="w-12 h-7 bg-gray-200 rounded-full p-1 cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full p-5 flex items-center justify-between bg-white/60 backdrop-blur-lg rounded-3xl border border-white/50 shadow-sm group hover:bg-red-50/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
              <LogOut size={20} />
            </div>
            <span className="font-bold text-red-500">Odhlásiť sa</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Profile;
