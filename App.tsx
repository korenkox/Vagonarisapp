
import React, { useState, useEffect } from 'react';
import { AppView, User, AttendanceRecord, ShiftConfig } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WelcomeScreen from './components/WelcomeScreen';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.INTRO);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Data State
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  
  // Initialize shiftConfig from localStorage if available
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

  // --- 1. SESSION MANAGEMENT ---
  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ 
            email: session.user.email!, 
            name: session.user.user_metadata.full_name 
        });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id);
      }
    });

    // Listen for auth changes (Login, Logout, Auto-refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({ 
            email: session.user.email!, 
            name: session.user.user_metadata.full_name 
        });
        setCurrentView(AppView.DASHBOARD);
        fetchRecords(session.user.id);
      } else {
        setUser(null);
        setCurrentView(AppView.INTRO);
        setRecords([]); // Clear sensitive data
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. DATA FETCHING (Supabase) ---
  const fetchRecords = async (userId: string) => {
      try {
          const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
          
          if (error) throw error;
          
          if (data) {
              // Map database fields to app type if snake_case -> camelCase differs
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
      } catch (err) {
          console.error('Error fetching records:', err);
      }
  };

  const handleNavigateToAuth = (mode: 'login' | 'register') => {
      setAuthMode(mode);
      setCurrentView(AppView.AUTH);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State update is handled by onAuthStateChange listener
  };

  // --- 3. DATA SAVING & DELETING (Supabase) ---
  const addRecord = async (record: AttendanceRecord) => {
      // Optimistic update (show immediately)
      setRecords(prev => [record, ...prev]);

      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Insert into DB
          const { error } = await supabase
            .from('attendance_records')
            .insert({
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

          if (error) {
              console.error('Error saving record:', error);
              alert(`Chyba pri ukladaní: ${error.message}`);
          }
      } catch (err: any) {
          console.error('Async error:', err);
          alert(`Neočakávaná chyba: ${err.message}`);
      }
  };

  const deleteRecord = async (recordId: string) => {
    // 1. Optimistic update (remove immediately from UI)
    const previousRecords = [...records];
    setRecords(prev => prev.filter(r => r.id !== recordId));

    try {
        // 2. Delete from DB
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);

        if (error) throw error;
        
    } catch (err: any) {
        console.error('Error deleting record:', err);
        alert('Nepodarilo sa vymazať záznam.');
        // Revert on error
        setRecords(previousRecords);
    }
  };

  // Shift config is still local for now, can be moved to DB later
  useEffect(() => {
    localStorage.setItem('shift_config', JSON.stringify(shiftConfig));
  }, [shiftConfig]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white">
      {currentView === AppView.INTRO && (
        <WelcomeScreen onNavigate={handleNavigateToAuth} />
      )}

      {currentView === AppView.AUTH && (
        <Auth 
            onLoginSuccess={() => { /* Handled by listener */ }} 
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
  );
};

export default App;
