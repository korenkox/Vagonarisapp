
import React, { useState } from 'react';
import { User, AttendanceRecord, ShiftConfig, DashboardTab } from '../types';
import ManualEntry from './ManualEntry';
import MonthOverview from './MonthOverview';
import TeamView from './History';
import Profile from './Profile';
import { Home, Calendar, Users, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  records: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  shiftConfig: ShiftConfig;
  onUpdateShiftConfig: (config: ShiftConfig) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogout, 
  records, 
  onAddRecord,
  onDeleteRecord,
  shiftConfig,
  onUpdateShiftConfig
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('HOME');

  const renderContent = () => {
    switch (activeTab) {
      case 'HOME':
        return <ManualEntry onSave={onAddRecord} onDelete={onDeleteRecord} user={user} records={records} shiftConfig={shiftConfig} />;
      case 'CALENDAR':
        return <MonthOverview config={shiftConfig} onUpdateConfig={onUpdateShiftConfig} records={records} />;
      case 'TEAM':
        return <TeamView user={user} records={records} shiftConfig={shiftConfig} />;
      case 'PROFILE':
        return <Profile user={user} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  // Dynamic background colors based on tab
  const getGradient = () => {
    switch(activeTab) {
        case 'HOME': return 'from-teal-50 via-white to-blue-50';
        case 'CALENDAR': return 'from-indigo-50 via-white to-purple-50';
        case 'TEAM': return 'from-slate-100 via-white to-blue-50';
        case 'PROFILE': return 'from-blue-50 via-white to-teal-50';
    }
  };

  return (
    <div className={`min-h-screen relative bg-gradient-to-br ${getGradient()} transition-colors duration-1000`}>
      
      {/* 1. Grain Texture Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
           }}
      />

      {/* 2. Aurora Background Blobs - Fixed to window to prevent scrolling */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-teal-300/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* 3. Main Content Area */}
      <main className="relative z-10 flex flex-col min-h-screen pb-24">
        {renderContent()}
      </main>

      {/* 4. Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[32px] px-6 pb-5 pt-2 flex justify-between items-center transition-all duration-300 pointer-events-auto">
           
           <NavButton 
              isActive={activeTab === 'HOME'} 
              onClick={() => setActiveTab('HOME')} 
              icon={<Home size={24} strokeWidth={2.5} />} 
              label="Domov"
              activeColor="text-blue-600"
           />
           <NavButton 
              isActive={activeTab === 'CALENDAR'} 
              onClick={() => setActiveTab('CALENDAR')} 
              icon={<Calendar size={24} strokeWidth={2.5} />} 
              label="Kalendár"
              activeColor="text-indigo-600"
           />
           <NavButton 
              isActive={activeTab === 'TEAM'} 
              onClick={() => setActiveTab('TEAM')} 
              icon={<Users size={24} strokeWidth={2.5} />} 
              label="Tím"
              activeColor="text-rose-600"
           />
           <NavButton 
              isActive={activeTab === 'PROFILE'} 
              onClick={() => setActiveTab('PROFILE')} 
              icon={<UserIcon size={24} strokeWidth={2.5} />} 
              label="Profil"
              activeColor="text-teal-600"
           />

        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
            animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const NavButton = ({ isActive, onClick, icon, label, activeColor }: any) => (
  <button 
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-14 md:w-16 transition-all duration-300 ${isActive ? '-translate-y-1 opacity-100' : 'opacity-50 hover:opacity-100'}`}
  >
    <div className={`
      ${isActive ? activeColor : 'text-gray-600'}
      transition-colors duration-300 mb-0.5 md:mb-1 transform ${isActive ? 'scale-110' : 'scale-100'}
    `}>
      {icon}
    </div>
    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${isActive ? activeColor : 'text-gray-500'} transition-colors duration-300`}>
      {label}
    </span>
    {isActive && (
       <div className={`absolute -bottom-2 w-1 h-1 rounded-full bg-current ${activeColor} shadow-sm`} />
    )}
  </button>
);

export default Dashboard;
