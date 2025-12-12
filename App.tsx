
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, User, AttendanceRecord, ShiftConfig, NotifyFn } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import Toast, { ToastMessage } from './components/Toast';
import { supabase } from './supabaseClient';
import { WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTRO);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isConfigLoadedFromDb = useRef(false);

  const notify: NotifyFn = useCallback((type, text) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('shift_config');
      if (savedConfig) return JSON.parse(savedConfig);
    } catch (error) { console.error(error); }
    return {
      startDate: new Date().toISOString().split('T')[0],
      cycle: ['R', 'R', 'R', 'R', 'R', 'V', 'V'],
      shiftLength: 8,
      isActive: false,
      shiftTimes: {
        'R': { start: '06:00', end: '14:00' },
        'P': { start: '14:00', end: '22:00' },
        'N': { start: '22:00', end: '06:00' }
      }
    };
  });

  // Offline detection
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); notify('success', 'Ste opäť online'); };
    const handleOffline = () => { setIsOffline(true); notify('info', 'Režim offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notify]);

  const fetchRecords = useCallback(async (userId: string) => {
      try {
          const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', userId).order('date', { ascending: false });
          if (error) throw error;
          if (data) {
              setRecords(data.map(r => ({
                  id: r.id,
                  date: r.date,
                  arrivalTime: r.arrival_time,
                  departureTime: r.departure_time,
                  breakDuration: r.break_duration,
                  normHours: r.norm_hours,
                  totalWorked: r.total_worked,
                  balance: r.balance,
                  isPositiveBalance: r.is_positive_balance
              })));
          }
      } catch (err: any) {
          console.error(err);
      }
  }, []);

  const fetchSettings = useCallback(async (userId: string) => {
      try {
          const { data } = await supabase.from('user_settings').select('shift_config').eq('user_id', userId).single();
          if (data && data.shift_config) {
              setShiftConfig(data.shift_config);
              isConfigLoadedFromDb.current = true;
          } else {
              isConfigLoadedFromDb.current = true;
          }
      } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ email: session.user.email!, name: session.user.user_metadata.full_name });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id);
        fetchSettings(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({ email: session.user.email!, name: session.user.user_metadata.full_name });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id);
        fetchSettings(session.user.id);
      } else {
        setUser(null);
        setCurrentView(AppView.INTRO);
        setRecords([]);
        isConfigLoadedFromDb.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRecords, fetchSettings]);

  const handleNavigateToAuth = (mode: 'login' | 'register') => {
      setAuthMode(mode);
      setCurrentView(AppView.AUTH);
  };

  const handleLogout = async () => { 
      await supabase.auth.signOut(); 
      notify('success', 'Odhlásenie úspešné');
  };

  const addRecord = async (record: AttendanceRecord) => {
      setRecords(prev => [record, ...prev]);
      notify('success', 'Záznam bol uložený');
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('attendance_records').insert({
                user_id: user.id,
                date: record.date,
                arrival_time: record.arrivalTime,
                departure_time: record.departureTime,
                break_duration: record.breakDuration,
                norm_hours: record.normHours,
                total_worked: record.totalWorked,
                balance: record.balance,
                is_positive_balance: record.isPositiveBalance
            });
      } catch (err) { 
          notify('error', 'Nepodarilo sa synchronizovať záznam');
          console.error(err); 
      }
  };

  const deleteRecord = async (recordId: string) => {
    const previousRecords = [...records];
    setRecords(prev => prev.filter(r => r.id !== recordId));
    notify('info', 'Záznam odstránený');
    try {
        const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
        if (error) throw error;
    } catch (err) {
        setRecords(previousRecords);
        notify('error', 'Chyba pri mazaní');
    }
  };

  useEffect(() => {
    localStorage.setItem('shift_config', JSON.stringify(shiftConfig));
    const saveToCloud = setTimeout(async () => {
        if (!user || !isConfigLoadedFromDb.current) return;
        try {
            await supabase.from('user_settings').upsert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    shift_config: shiftConfig,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
        } catch (err) { console.error(err); }
    }, 1000);
    return () => clearTimeout(saveToCloud);
  }, [shiftConfig, user]);

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50 flex justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
              
              <Toast messages={toasts} onRemove={removeToast} />

              {isOffline && (
                  <div className="bg-gray-900 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 animate-fade-in-down absolute top-0 left-0 right-0 z-[10000]">
                      <WifiOff size={14} />
                      <span>Ste offline. Zmeny sa uložia lokálne.</span>
                  </div>
              )}

              {currentView === AppView.INTRO && <WelcomeScreen onNavigate={handleNavigateToAuth} />}
              {currentView === AppView.AUTH && <Auth onLoginSuccess={() => notify('success', 'Prihlásenie úspešné')} initialMode={authMode} onBack={() => setCurrentView(AppView.INTRO)} />}
              {currentView === AppView.DASHBOARD && user && (
                <Dashboard 
                    user={user} 
                    onLogout={handleLogout} 
                    records={records} 
                    onAddRecord={addRecord} 
                    onDeleteRecord={deleteRecord} 
                    shiftConfig={shiftConfig} 
                    onUpdateShiftConfig={(cfg) => { setShiftConfig(cfg); notify('success', 'Nastavenia uložené'); }}
                    notify={notify}
                />
              )}
          </div>
          <style>{`
            @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
          `}</style>
    </div>
  );
};

export default App;
