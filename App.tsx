
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, User, AttendanceRecord, ShiftConfig, NotifyFn } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import Toast, { ToastMessage } from './components/Toast';
import { supabase } from './supabaseClient';
import { WifiOff, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTRO);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isConfigLoadedFromDb = useRef(false);

  const notify: NotifyFn = useCallback((type, text) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 4000);
  }, []);

  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => {
    try {
      const saved = localStorage.getItem('shift_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { startDate: new Date().toISOString().split('T')[0], cycle: ['R', 'R', 'R', 'R', 'R', 'V', 'V'], shiftLength: 8, isActive: false, shiftTimes: { 'R': { start: '06:00', end: '14:00' }, 'P': { start: '14:00', end: '22:00' }, 'N': { start: '22:00', end: '06:00' } } };
  });

  const fetchRecords = useCallback(async (userId: string) => {
      try {
          const { data } = await supabase.from('attendance_records').select('*').eq('user_id', userId).order('date', { ascending: false });
          if (data) setRecords(data.map(r => ({ id: r.id, date: r.date, arrivalTime: r.arrival_time, departureTime: r.departure_time, breakDuration: r.break_duration, normHours: r.norm_hours, totalWorked: r.total_worked, balance: r.balance, isPositiveBalance: r.is_positive_balance })));
      } catch (e) {}
  }, []);

  const fetchSettings = useCallback(async (userId: string) => {
      try {
          const { data } = await supabase.from('user_settings').select('shift_config').eq('user_id', userId).single();
          if (data?.shift_config) { setShiftConfig(data.shift_config); isConfigLoadedFromDb.current = true; }
          else isConfigLoadedFromDb.current = true;
      } catch (e) { isConfigLoadedFromDb.current = true; }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ email: session.user.email!, name: session.user.user_metadata.full_name });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id); fetchSettings(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setUser({ email: session.user.email!, name: session.user.user_metadata.full_name });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id); fetchSettings(session.user.id);
      } else {
        setUser(null); setCurrentView(AppView.INTRO); setRecords([]); isConfigLoadedFromDb.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchRecords, fetchSettings]);

  const handleNavigate = (mode: 'login' | 'register' | 'dev') => {
      if (mode === 'dev') { setUser({ email: 'dev@tracker.pro', name: 'Vývojár' }); setCurrentView(AppView.DASHBOARD); notify('info', 'Dev režim aktívny'); return; }
      setAuthMode(mode); setCurrentView(AppView.AUTH);
  };

  const addRecord = async (record: AttendanceRecord) => {
      setRecords(prev => [record, ...prev]);
      notify('success', 'Záznam uložený');
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('attendance_records').insert({ user_id: user.id, date: record.date, arrival_time: record.arrivalTime, departure_time: record.departureTime, break_duration: record.breakDuration, norm_hours: record.normHours, total_worked: record.totalWorked, balance: record.balance, is_positive_balance: record.isPositiveBalance });
      } catch (e) {}
  };

  return (
    <div className="min-h-screen w-full bg-white flex justify-center overflow-x-hidden">
        <div className="w-full min-h-screen relative flex flex-col overflow-x-hidden">
              <Toast messages={toasts} onRemove={(id) => setToasts(p => p.filter(t => t.id !== id))} />
              {(isOffline || (user?.email === 'dev@tracker.pro')) && (
                  <div className={`text-white text-[10px] font-bold py-1.5 px-4 flex items-center justify-center gap-2 absolute top-0 left-0 right-0 z-[10000] ${user?.email === 'dev@tracker.pro' ? 'bg-amber-600' : 'bg-gray-900'}`}>
                      {user?.email === 'dev@tracker.pro' ? <Terminal size={12} /> : <WifiOff size={12} />}
                      <span>{user?.email === 'dev@tracker.pro' ? 'VÝVOJÁRSKY REŽIM' : 'REŽIM OFFLINE'}</span>
                  </div>
              )}
              {currentView === AppView.INTRO && <WelcomeScreen onNavigate={handleNavigate} />}
              {currentView === AppView.AUTH && <Auth onLoginSuccess={() => {}} initialMode={authMode} onBack={() => setCurrentView(AppView.INTRO)} />}
              {currentView === AppView.DASHBOARD && user && (
                <Dashboard 
                    user={user} onLogout={async () => { await supabase.auth.signOut(); }} records={records} onAddRecord={addRecord} onDeleteRecord={(id) => setRecords(p => p.filter(r => r.id !== id))} 
                    shiftConfig={shiftConfig} onUpdateShiftConfig={setShiftConfig} notify={notify}
                />
              )}
        </div>
    </div>
  );
};

export default App;
