
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, User, AttendanceRecord, ShiftConfig } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import { supabase } from './supabaseClient';
import { AlertTriangle, X } from 'lucide-react';

const App: React.FC = () => {
  // Default view is INTRO, auth listener will switch to DASHBOARD if logged in
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTRO);
  
  // User state starts null
  const [user, setUser] = useState<User | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Data State
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Global Error State (e.g. Missing Table)
  const [globalError, setGlobalError] = useState<{title: string, message: string} | null>(null);
  
  // Ref to track if config was loaded from DB to prevent overwriting DB with local defaults
  const isConfigLoadedFromDb = useRef(false);

  // Initialize shiftConfig from localStorage if available (for offline/fast load)
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => {
    try {
      const savedConfig = localStorage.getItem('shift_config');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Error parsing shift_config from localStorage', error);
    }
    
    // Default config if nothing saved
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

  // --- 2. DATA FETCHING (Supabase) ---
  const fetchRecords = useCallback(async (userId: string) => {
      try {
          const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
          
          if (error) throw error;
          
          if (data) {
              const mappedRecords: AttendanceRecord[] = data.map(r => ({
                  id: r.id,
                  date: r.date,
                  arrivalTime: r.arrival_time,
                  departureTime: r.departure_time,
                  breakDuration: r.break_duration,
                  normHours: r.norm_hours,
                  totalWorked: r.total_worked,
                  balance: r.balance,
                  isPositiveBalance: r.is_positive_balance
              }));
              setRecords(mappedRecords);
          }
      } catch (err: any) {
          const errorMessage = err.message || JSON.stringify(err, null, 2);
          console.error('Error fetching records details:', errorMessage);
          
          if (err.code === '42P01') {
             setGlobalError({
                 title: 'Chýba databáza',
                 message: 'Tabuľka "attendance_records" neexistuje. Prosím, vytvorte ju v Supabase SQL Editore.'
             });
          }
      }
  }, []);

  const fetchSettings = useCallback(async (userId: string) => {
      try {
          const { data, error } = await supabase
              .from('user_settings')
              .select('shift_config')
              .eq('user_id', userId)
              .single();

          if (data && data.shift_config) {
              setShiftConfig(data.shift_config);
              isConfigLoadedFromDb.current = true;
          } else {
              isConfigLoadedFromDb.current = true;
          }
      } catch (err) {
          console.error('Unexpected error fetching settings', err);
      }
  }, []);

  // --- 1. SESSION MANAGEMENT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ 
            email: session.user.email!, 
            name: session.user.user_metadata.full_name 
        });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id);
        fetchSettings(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({ 
            email: session.user.email!, 
            name: session.user.user_metadata.full_name 
        });
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
  };

  // --- 3. DATA SAVING & DELETING ---
  const addRecord = async (record: AttendanceRecord) => {
      setRecords(prev => [record, ...prev]);
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
      } catch (err: any) {
          console.error('Async error:', err);
      }
  };

  const deleteRecord = async (recordId: string) => {
    const previousRecords = [...records];
    setRecords(prev => prev.filter(r => r.id !== recordId));

    try {
        const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
        if (error) throw error;
    } catch (err: any) {
        console.error('Error deleting record:', err);
        alert('Nepodarilo sa vymazať záznam.');
        setRecords(previousRecords);
    }
  };

  // --- 4. CONFIG SYNC ---
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
        } catch (err) {
            console.error('Async settings save error:', err);
        }
    }, 1000);
    return () => clearTimeout(saveToCloud);
  }, [shiftConfig, user]);

  return (
    // Reverted to simple container without phone frame
    <div className="min-h-screen bg-white sm:bg-gray-50 flex justify-center">
        
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
              
              {globalError && (
                  <div className="fixed top-0 left-0 right-0 z-[9999] p-4 flex justify-center pointer-events-none animate-fade-in-down">
                      <div className="bg-rose-50 border border-rose-100 shadow-xl rounded-2xl p-4 flex items-start gap-3 max-w-sm w-full pointer-events-auto">
                          <div className="p-2 bg-rose-100 rounded-full text-rose-600"><AlertTriangle size={20} /></div>
                          <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-900">{globalError.title}</h3>
                              <p className="text-xs text-gray-600 mt-1">{globalError.message}</p>
                          </div>
                          <button onClick={() => setGlobalError(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                      </div>
                  </div>
              )}

              {currentView === AppView.INTRO && (
                <WelcomeScreen onNavigate={handleNavigateToAuth} />
              )}

              {currentView === AppView.AUTH && (
                <Auth 
                    onLoginSuccess={() => {}} 
                    initialMode={authMode} 
                    onBack={() => setCurrentView(AppView.INTRO)}
                />
              )}
              
              {currentView === AppView.DASHBOARD && user && (
                <Dashboard 
                  user={user} 
                  onLogout={handleLogout}
                  records={records}
                  onAddRecord={addRecord}
                  onDeleteRecord={deleteRecord}
                  shiftConfig={shiftConfig}
                  onUpdateShiftConfig={setShiftConfig}
                />
              )}
          </div>
          
          <style>{`
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down {
                animation: fadeInDown 0.5s ease-out forwards;
            }
          `}</style>
    </div>
  );
};

export default App;
