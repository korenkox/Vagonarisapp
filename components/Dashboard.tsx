
import React, { useState, Suspense } from 'react';
import { User, AttendanceRecord, ShiftConfig, DashboardTab, NotifyFn } from '../types';
import { Home, Calendar, Users, User as UserIcon, Activity, LogOut, Loader2 } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

// Lazy load components for better initial load performance
const ManualEntry = React.lazy(() => import('./ManualEntry'));
const MonthOverview = React.lazy(() => import('./MonthOverview'));
const TeamView = React.lazy(() => import('./History'));
const Profile = React.lazy(() => import('./Profile'));

interface DashboardProps {
  user: User;
  onLogout: () => void;
  records: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  shiftConfig: ShiftConfig;
  onUpdateShiftConfig: (config: ShiftConfig) => void;
  notify: NotifyFn;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64 w-full animate-fade-in">
        <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogout, 
  records, 
  onAddRecord,
  onDeleteRecord,
  shiftConfig,
  onUpdateShiftConfig,
  notify
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('HOME');
  const isMobile = useIsMobile();

  const renderContent = () => {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'HOME' && <ManualEntry onSave={onAddRecord} onDelete={onDeleteRecord} user={user} records={records} shiftConfig={shiftConfig} />}
            {activeTab === 'CALENDAR' && <MonthOverview config={shiftConfig} onUpdateConfig={onUpdateShiftConfig} records={records} />}
            {activeTab === 'TEAM' && <TeamView user={user} records={records} shiftConfig={shiftConfig} />}
            {activeTab === 'PROFILE' && <Profile user={user} onLogout={onLogout} />}
        </Suspense>
    );
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
      
      {/* 1. Grain Texture Overlay - Only render on PC (non-mobile) to save battery/performance on phones */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
             }}
        />
      )}

      {/* 2. Aurora Background Blobs - Fixed to window */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-teal-300/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="flex min-h-screen relative z-10">
        
        {/* --- DESKTOP SIDEBAR (Centered by App.tsx container) --- */}
        {!isMobile && (
            <aside className="w-72 sticky top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-white/60 shadow-xl shadow-blue-900/5 p-6 flex flex-col justify-between z-50">
                <div>
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                             <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-none tracking-tight text-base">DOCHÁDZKA</h1>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">PRO SYSTEM</span>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <SidebarItem 
                            active={activeTab === 'HOME'} 
                            onClick={() => setActiveTab('HOME')} 
                            icon={<Home size={20} />} 
                            label="Domov" 
                            description="Prehľad a záznam"
                            color="bg-blue-50 text-blue-600"
                        />
                        <SidebarItem 
                            active={activeTab === 'CALENDAR'} 
                            onClick={() => setActiveTab('CALENDAR')} 
                            icon={<Calendar size={20} />} 
                            label="Kalendár" 
                            description="Smeny a plány"
                            color="bg-indigo-50 text-indigo-600"
                        />
                        <SidebarItem 
                            active={activeTab === 'TEAM'} 
                            onClick={() => setActiveTab('TEAM')} 
                            icon={<Users size={20} />} 
                            label="Tím" 
                            description="Skupiny a štatistiky"
                            color="bg-rose-50 text-rose-600"
                        />
                        <SidebarItem 
                            active={activeTab === 'PROFILE'} 
                            onClick={() => setActiveTab('PROFILE')} 
                            icon={<UserIcon size={20} />} 
                            label="Profil" 
                            description="Nastavenia účtu"
                            color="bg-teal-50 text-teal-600"
                        />
                    </nav>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                     <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-700 shadow-sm">
                             {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                         </div>
                         <div className="overflow-hidden">
                             <div className="text-sm font-bold text-gray-900 truncate">{user.name || 'Užívateľ'}</div>
                             <div className="text-xs text-gray-400 truncate">{user.email}</div>
                         </div>
                     </div>
                     <button onClick={onLogout} className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors">
                         <LogOut size={14} /> Odhlásiť sa
                     </button>
                </div>
            </aside>
        )}

        {/* --- MAIN CONTENT --- */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isMobile ? 'pb-24' : ''}`}>
            <div className={`w-full ${!isMobile ? 'p-8' : ''}`}>
                 {renderContent()}
            </div>
        </main>

      </div>

      {isMobile && (
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
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon, label, description, color }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group ${active ? 'bg-white shadow-lg shadow-gray-200/50 scale-[1.02]' : 'hover:bg-white/50 hover:scale-[1.01]'}`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? color : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600'}`}>
            {icon}
        </div>
        <div className="text-left">
            <div className={`font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>{label}</div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{description}</div>
        </div>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
    </button>
);

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
