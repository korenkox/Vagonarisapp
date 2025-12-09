
import React from 'react';
import { User } from '../types';
import { Shield, Bell, Settings, LogOut, ChevronRight, User as UserIcon } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
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
        
        <button className="px-6 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-blue-100 transition-colors relative z-10">
          Premium Účet
        </button>
      </div>

      {/* Settings Section */}
      <div className="space-y-6">
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

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-4">Aplikácia</h3>
        
        <div className="bg-white/60 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/50 shadow-sm">
          <button className="w-full p-5 flex items-center justify-between hover:bg-white/50 transition-colors border-b border-gray-100/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                <Settings size={20} />
              </div>
              <span className="font-bold text-gray-700">Všeobecné</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button 
            onClick={onLogout}
            className="w-full p-5 flex items-center justify-between hover:bg-red-50/50 transition-colors group"
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
    </div>
  );
};

export default Profile;
