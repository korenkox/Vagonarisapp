
import React, { useState, Suspense } from 'react';
import { User, AttendanceRecord, ShiftConfig, DashboardTab, NotifyFn } from '../types';
import { Home, Calendar, Users, User as UserIcon, Activity, LogOut, Loader2 } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

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

  const getGradient = () => {
    switch(activeTab) {
        case 'HOME': return 'from-teal-50 via-white to-blue-50';
        case 'CALENDAR': return 'from-indigo-50 via-white to-purple-50';
        case 'TEAM': return 'from-slate-100 via-white to-blue-50';
        case 'PROFILE': return 'from-blue-50 via-white to-teal-50';
    }
  };

  return (
    <div className={`min-h-screen relative bg-gradient-to-br ${getGradient()} transition-colors duration-1000 w-full overflow-hidden`}>
      
      {/* Background Blobs - GPU Optimized, fixne pozície pre iPhone mini */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transform-gpu w-full h-full">
        <div className={`absolute top-[-5%] left-[-10%] w-64 h-64 bg-blue-300/10 rounded-full blur-[60px] animate-blob transform-gpu`} />
        <div className={`absolute top-[15%] right-[-10%] w-64 h-64 bg-purple-300/10 rounded-full blur-[60px] animate-blob animation-delay-2000 transform-gpu`} />
        <div className={`absolute bottom-[-5%] left-[10%] w-64 h-64 bg-teal-300/10 rounded-full blur-[60px] animate-blob animation-delay-4000 transform-gpu`} />
      </div>

      <div className="flex min-h-screen relative z-10 w-full overflow-hidden">
        
        {!isMobile && (
            <aside className="w-72 sticky top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-white/60 shadow-xl p-6 flex flex-col justify-between z-50">
                <div>
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                             <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-none tracking-tight text-base uppercase">Dochádzka</h1>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">PRO SYSTEM</span>
                        </div>
                    </div>
                    <nav className="space-y-2">
                        <SidebarItem active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} icon={<Home size={20} />} label="Domov" description="Prehľad a záznam" color="bg-blue-50 text-blue-600" />
                        <SidebarItem active={activeTab === 'CALENDAR'} onClick={() => setActiveTab('CALENDAR')} icon={<Calendar size={20} />} label="Kalendár" description="Smeny a plány" color="bg-indigo-50 text-indigo-600" />
                        <SidebarItem active={activeTab === 'TEAM'} onClick={() => setActiveTab('TEAM')} icon={<Users size={20} />} label="Tím" description="Skupiny a štatistiky" color="bg-rose-50 text-rose-600" />
                        <SidebarItem active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<UserIcon size={20} />} label="Profil" description="Nastavenia účtu" color="bg-teal-50 text-teal-600" />
                    </nav>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                     <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-700 font-bold uppercase">{user.name?.[0]}</div>
                         <div className="overflow-hidden"><div className="text-sm font-bold text-gray-900 truncate">{user.name}</div><div className="text-xs text-gray-400 truncate">{user.email}</div></div>
                     </div>
                     <button onClick={onLogout} className="w-full py-2 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-rose-600 transition-colors">
                         <LogOut size={14} /> Odhlásiť sa
                     </button>
                </div>
            </aside>
        )}

        <main className={`flex-1 flex flex-col transition-all duration-300 w-full overflow-hidden ${isMobile ? 'pb-24 pt-4' : 'p-8'}`}>
            <div className="w-full max-w-full overflow-x-hidden">
                 {renderContent()}
            </div>
        </main>

      </div>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb px-4 pb-4 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-full px-6 py-2.5 flex justify-between items-center pointer-events-auto transform-gpu">
                <NavButton isActive={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} icon={<Home size={20} />} label="Domov" activeColor="text-blue-600" />
                <NavButton isActive={activeTab === 'CALENDAR'} onClick={() => setActiveTab('CALENDAR')} icon={<Calendar size={20} />} label="Kalendár" activeColor="text-indigo-600" />
                <NavButton isActive={activeTab === 'TEAM'} onClick={() => setActiveTab('TEAM')} icon={<Users size={20} />} label="Tím" activeColor="text-rose-600" />
                <NavButton isActive={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<UserIcon size={20} />} label="Profil" activeColor="text-teal-600" />
            </div>
        </nav>
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon, label, description, color }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group transform-gpu ${active ? 'bg-white shadow-md scale-[1.02]' : 'hover:bg-white/50'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? color : 'bg-gray-100 text-gray-400'}`}>
            {icon}
        </div>
        <div className="text-left">
            <div className={`font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{description}</div>
        </div>
    </button>
);

const NavButton = ({ isActive, onClick, icon, label, activeColor }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-12 transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'opacity-40'}`}>
    <div className={`${isActive ? activeColor : 'text-gray-600'} mb-0.5`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? activeColor : 'text-gray-500'}`}>{label}</span>
  </button>
);

export default Dashboard;
