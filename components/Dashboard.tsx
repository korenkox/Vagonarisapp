
import React, { useState, Suspense } from 'react';
import { User, AttendanceRecord, ShiftConfig, DashboardTab, NotifyFn } from '../types';
import { Home, Calendar, Users, User as UserIcon, LogOut, Loader2, Sparkles, Activity } from 'lucide-react';
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
        <Loader2 className="animate-spin text-amber-500" size={32} />
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

  return (
    <div className="min-h-screen relative bg-[#0f172a] text-white w-full overflow-hidden">
      
      {/* Boss Ambient Lights */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="flex min-h-screen relative z-10 w-full overflow-hidden">
        
        {!isMobile && (
            <aside className="w-72 sticky top-0 h-screen bg-slate-900/90 backdrop-blur-3xl border-r border-white/5 shadow-2xl p-6 flex flex-col justify-between z-50">
                <div>
                    <div className="flex items-center gap-4 mb-10 px-2 group">
                        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/10 overflow-hidden transition-transform group-hover:scale-105 duration-500 border-2 border-white/10 p-2">
                             <img src="mascot.svg" className="w-full h-full object-contain" alt="Mascot" />
                        </div>
                        <div>
                            <h1 className="font-black text-white leading-none tracking-tight text-xl uppercase">BOSS</h1>
                            <div className="flex items-center gap-1 mt-1">
                                <Sparkles size={10} className="text-amber-500" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">TRACKER</span>
                            </div>
                        </div>
                    </div>
                    <nav className="space-y-2">
                        <SidebarItem active={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} icon={<Home size={20} />} label="Prehľad" description="Váš dnešný progress" color="bg-amber-500 text-slate-900" />
                        <SidebarItem active={activeTab === 'CALENDAR'} onClick={() => setActiveTab('CALENDAR')} icon={<Calendar size={20} />} label="Kalendár" description="Smeny a voľno" color="bg-white text-slate-900" />
                        <SidebarItem active={activeTab === 'TEAM'} onClick={() => setActiveTab('TEAM')} icon={<Users size={20} />} label="Môj Tím" description="Alpha Group" color="bg-amber-500 text-slate-900" />
                        <SidebarItem active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<UserIcon size={20} />} label="Nastavenia" description="Môj profil" color="bg-white text-slate-900" />
                    </nav>
                </div>
                <div className="bg-white/5 rounded-[32px] p-6 shadow-2xl border border-white/10 relative overflow-hidden group">
                     <div className="flex items-center gap-4 mb-4 relative z-10">
                         <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden p-2">
                             <img src="mascot.svg" className="w-full h-full object-contain" alt="Avatar" />
                         </div>
                         <div className="overflow-hidden">
                            <div className="text-sm font-black text-white truncate uppercase">{user.name}</div>
                            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Master Admin</div>
                         </div>
                     </div>
                     <button onClick={onLogout} className="w-full py-3 flex items-center justify-center gap-2 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">
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
            <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-full px-6 py-4 flex justify-between items-center pointer-events-auto mx-2 transform-gpu">
                <NavButton isActive={activeTab === 'HOME'} onClick={() => setActiveTab('HOME')} icon={<Home size={22} />} label="Prehľad" activeColor="text-amber-400" />
                <NavButton isActive={activeTab === 'CALENDAR'} onClick={() => setActiveTab('CALENDAR')} icon={<Calendar size={22} />} label="Smeny" activeColor="text-white" />
                <NavButton isActive={activeTab === 'TEAM'} onClick={() => setActiveTab('TEAM')} icon={<Users size={22} />} label="Tím" activeColor="text-amber-400" />
                <NavButton isActive={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<UserIcon size={22} />} label="Profil" activeColor="text-white" />
            </div>
        </nav>
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon, label, description, color }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group transform-gpu ${active ? 'bg-white/10 shadow-xl scale-[1.02] border border-white/10' : 'hover:bg-white/5'}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${active ? color : 'bg-white/5 text-white/30'}`}>
            {icon}
        </div>
        <div className="text-left">
            <div className={`font-black text-xs uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>{label}</div>
            <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.1em] mt-1">{description}</div>
        </div>
    </button>
);

const NavButton = ({ isActive, onClick, icon, label, activeColor }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-12 transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'opacity-40'}`}>
    <div className={`${isActive ? activeColor : 'text-white'} mb-1`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isActive ? activeColor : 'text-white'}`}>{label}</span>
  </button>
);

export default Dashboard;
