

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ArrowLeft, Zap, Crown, UserMinus, Settings, Power, Activity, Lock, Unlock, Users, Share2, Copy, LogIn, CheckCircle, MoreVertical, X, Trash2, ShieldAlert, Briefcase, Clock, Calendar } from 'lucide-react';
import { Group, AttendanceRecord, ShiftConfig, User, GroupMember } from '../types';
import { supabase } from '../supabaseClient';

interface TeamViewProps {
  user: User;
  records: AttendanceRecord[];
  shiftConfig: ShiftConfig;
}

const TeamView: React.FC<TeamViewProps> = ({ user, records, shiftConfig }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL' | 'CREATE' | 'JOIN'>('LIST');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Ref pre sledovanie ID vybranej skupiny bez vyvolania re-renderu v závislostiach
  const selectedGroupIdRef = useRef<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  
  // Create State
  const [newGroupName, setNewGroupName] = useState('');
  
  // Join State
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Member Management State
  const [memberToManage, setMemberToManage] = useState<GroupMember | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Aktualizácia refu vždy keď sa zmení state
  useEffect(() => {
    selectedGroupIdRef.current = selectedGroup?.id || null;
  }, [selectedGroup]);

  // --- 0. Get Current User ID ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        if(data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // --- 1. Calculate REAL stats for the current user (Local) ---
  const myStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let workedMinutes = 0;
    let normHoursAccumulated = 0; 

    records.filter(r => {
        if(!r.date) return false;
        const [y, m] = r.date.split('-').map(Number);
        return y === currentYear && m === (currentMonth + 1);
    }).forEach(r => {
        if(r.totalWorked) {
            const hMatch = r.totalWorked.match(/(\d+)h/);
            const mMatch = r.totalWorked.match(/(\d+)m/);
            const h = hMatch ? parseInt(hMatch[1]) : 0;
            const m = mMatch ? parseInt(mMatch[1]) : 0;
            workedMinutes += (h*60) + m;
        }
        if (r.normHours) {
            normHoursAccumulated += r.normHours;
        }
    });

    const workedHours = parseFloat((workedMinutes / 60).toFixed(1));

    let calculatedCalendarFund = 0;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
        if (shiftConfig.isActive && shiftConfig.cycle && shiftConfig.cycle.length > 0) {
            const checkDate = new Date(currentYear, currentMonth, d);
            const startDateObj = new Date(shiftConfig.startDate);
            checkDate.setHours(0,0,0,0);
            startDateObj.setHours(0,0,0,0);
            
            const diffTime = checkDate.getTime() - startDateObj.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            const cycleLength = shiftConfig.cycle.length;
            let position = diffDays % cycleLength;
            if (position < 0) position += cycleLength;
            
            const code = shiftConfig.cycle[position];
            if (code !== 'V') {
                calculatedCalendarFund += (shiftConfig.shiftLength || 8);
            }
        } else {
             const date = new Date(currentYear, currentMonth, d);
             const day = date.getDay();
             if (day !== 0 && day !== 6) {
                 calculatedCalendarFund += 8;
             }
        }
    }

    return {
        worked: workedHours,
        norm: normHoursAccumulated, 
        calendarFund: calculatedCalendarFund 
    };
  }, [records, shiftConfig]); 

  // --- 2. Fetch Groups from Supabase ---
  const fetchGroups = useCallback(async (isInitial = false) => {
      if (isInitial) setLoading(true);
      
      try {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('*');

          if (groupsError) throw groupsError;
          if (!groupsData) return;

          const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('*')
            .in('group_id', groupsData.map(g => g.id));

          if (membersError) throw membersError;

          const constructedGroups: Group[] = groupsData.map(g => {
              const members = membersData?.filter(m => m.group_id === g.id).map(m => ({
                  id: m.user_id,
                  name: m.user_name || 'Neznámy',
                  initials: m.initials || '?',
                  role: m.role as 'Admin' | 'Member',
                  status: m.status as any,
                  workedHours: m.worked_hours || 0,
                  normHours: m.norm_hours || 0,
                  calendarFund: m.calendar_fund || 0
              })) || [];

              const totalW = members.reduce((sum, m) => sum + m.workedHours, 0);
              const totalN = members.reduce((sum, m) => sum + m.normHours, 0);
              const totalCF = members.reduce((sum, m) => sum + (m.calendarFund || 0), 0);
              
              // Efficiency Logic: Norm / Worked * 100
              // If Norm is 100h and Worked is 80h -> 125% Efficiency (Saved time)
              const efficiency = totalW > 0 ? Math.round((totalN / totalW) * 100) : 0;
              
              return {
                  id: g.id,
                  name: g.name,
                  inviteCode: g.invite_code,
                  adminId: g.admin_id,
                  members: members,
                  totalWorked: parseFloat(totalW.toFixed(1)),
                  totalNorm: parseFloat(totalN.toFixed(1)),
                  totalCalendarFund: parseFloat(totalCF.toFixed(1)),
                  efficiency: efficiency
              };
          });

          setGroups(constructedGroups);
          
          const currentSelectedId = selectedGroupIdRef.current;
          if (currentSelectedId) {
              const updatedSelected = constructedGroups.find(g => g.id === currentSelectedId);
              if (updatedSelected) {
                  setSelectedGroup(updatedSelected);
              }
          }

      } catch (err) {
          console.error('Error fetching groups:', err);
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
      fetchGroups(true);
  }, [fetchGroups]);

  // --- 3. Sync My Stats to Cloud ---
  useEffect(() => {
      const syncStats = async () => {
          if (!currentUserId) return;
          
          try {
             await supabase
                .from('group_members')
                .update({
                    worked_hours: myStats.worked,
                    norm_hours: myStats.norm,
                    calendar_fund: myStats.calendarFund,
                    user_name: user.name,
                    initials: user.name?.[0] || '?'
                })
                .eq('user_id', currentUserId);
          } catch (err) {
              console.error('Error syncing stats:', err);
          }
      };
      
      const timer = setTimeout(() => {
          syncStats();
      }, 2000);

      return () => clearTimeout(timer);
  }, [myStats, currentUserId, user.name]);

  // --- 4. REALTIME LISTENERS ---
  useEffect(() => {
    const channel = supabase
      .channel('public:group_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGroups]);

  const generateInviteCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for(let i=0; i<3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      code += "-";
      for(let i=0; i<3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return code;
  };

  const handleCreateGroup = async () => {
    if(!newGroupName.trim() || !currentUserId) return;
    setLoading(true);
    
    try {
        const inviteCode = generateInviteCode();
        
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert({
                name: newGroupName,
                invite_code: inviteCode,
                admin_id: currentUserId
            })
            .select()
            .single();

        if (groupError) throw groupError;

        const { error: memberError } = await supabase
            .from('group_members')
            .insert({
                group_id: groupData.id,
                user_id: currentUserId,
                role: 'Admin',
                user_name: user.name,
                initials: user.name?.[0] || '?',
                worked_hours: myStats.worked,
                norm_hours: myStats.norm,
                calendar_fund: myStats.calendarFund
            });

        if (memberError) throw memberError;

        setNewGroupName('');
        setView('LIST');
        fetchGroups();

    } catch (err: any) {
        alert('Chyba pri vytváraní skupiny: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
      setJoinError('');
      if (!currentUserId) return;
      const cleanCode = joinCode.trim().toUpperCase();
      setLoading(true);

      try {
          const { data: foundGroups, error: findError } = await supabase
            .from('groups')
            .select('id')
            .eq('invite_code', cleanCode)
            .limit(1);
          
          if (findError) throw findError;
          
          if (!foundGroups || foundGroups.length === 0) {
              setJoinError('Skupina s týmto kódom neexistuje.');
              setLoading(false);
              return;
          }

          const groupId = foundGroups[0].id;

          const { error: joinErr } = await supabase
            .from('group_members')
            .insert({
                group_id: groupId,
                user_id: currentUserId,
                role: 'Member',
                user_name: user.name,
                initials: user.name?.[0] || '?',
                worked_hours: myStats.worked,
                norm_hours: myStats.norm,
                calendar_fund: myStats.calendarFund
            });

          if (joinErr) {
              if (joinErr.code === '23505') {
                  setJoinError('Už ste členom tejto skupiny.');
              } else {
                  throw joinErr;
              }
          } else {
              setJoinCode('');
              setView('LIST');
              fetchGroups();
          }

      } catch (err: any) {
          console.error(err);
          setJoinError('Chyba pri pripájaní.');
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Naozaj chcete zmazať túto skupinu? Táto akcia je nevratná.')) return;
        
        try {
            await supabase.from('groups').delete().eq('id', groupId);
            setView('LIST');
            setSelectedGroup(null);
            fetchGroups();
        } catch (err) {
            console.error(err);
        }
  };

  const handleRemoveMember = async (memberId: string) => {
      if (!selectedGroup) return;
      setMemberToManage(null);

      try {
           await supabase
            .from('group_members')
            .delete()
            .eq('group_id', selectedGroup.id)
            .eq('user_id', memberId);
           
           fetchGroups();
      } catch (err) {
          console.error(err);
      }
  };

  const isAdmin = selectedGroup?.adminId === currentUserId;

  // --- VIEW: JOIN GROUP ---
  if (view === 'JOIN') {
      return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative bg-slate-50">
             <div className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={() => setView('LIST')} className="p-3 bg-white rounded-full hover:bg-gray-100 transition-all shadow-sm">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-light text-gray-800">Pripojiť sa k <span className="font-bold">Tímu</span></h1>
             </div>

             <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-blue-900/5">
                 <div className="flex justify-center mb-6">
                     <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                         <Users size={32} className="text-indigo-500" />
                     </div>
                 </div>
                 
                 <p className="text-center text-gray-500 mb-8">
                     Zadajte 6-miestny kód, ktorý vám poslal administrátor skupiny.
                 </p>

                 <div className="mb-6">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Pozývací kód</label>
                     <input 
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        className="w-full text-center text-3xl font-mono font-bold py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder-gray-300 uppercase"
                        maxLength={7}
                     />
                     {joinError && <p className="text-rose-500 text-xs mt-2 text-center font-bold">{joinError}</p>}
                 </div>

                 <button 
                    onClick={handleJoinGroup}
                    disabled={joinCode.length < 3 || loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Pripojiť sa
                 </button>
             </div>
        </div>
      );
  }

  // --- VIEW: CREATE GROUP ---
  if (view === 'CREATE') {
    return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative overflow-hidden">
             <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="flex items-center gap-4 mb-8 pt-4 relative z-10">
                <button onClick={() => setView('LIST')} className="p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-white/50">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-light text-gray-800">Nová <span className="font-bold">Skupina</span></h1>
             </div>

             <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl shadow-blue-900/10 border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />
                
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                        <Activity size={40} className="text-blue-500" />
                    </div>
                </div>

                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block ml-1">Názov tímu</label>
                <div className="relative mb-8 group">
                    <input 
                        autoFocus
                        type="text" 
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Napr. Alpha Team..."
                        className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent text-gray-800 placeholder-gray-300 transition-colors"
                    />
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-8 flex gap-3">
                    <div className="mt-1 text-blue-500"><Zap size={16} /></div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Po vytvorení skupiny získate <strong>unikátny kód</strong>, ktorý môžete poslať kolegom, aby sa pripojili.
                    </p>
                </div>

                <button 
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || loading}
                    className={`
                        w-full py-5 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-3 transition-all duration-300
                        ${newGroupName.trim() 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] hover:shadow-blue-500/30' 
                            : 'bg-gray-300 cursor-not-allowed'}
                    `}
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Power size={20} />}
                    Vytvoriť a Získať Kód
                </button>
             </div>
        </div>
    )
  }

  // --- VIEW: DETAIL ---
  if (view === 'DETAIL' && selectedGroup) {
      const isHighEnergy = selectedGroup.efficiency >= 100;
      
      // Calculate Balance (Positive = Time Saved = Norm > Worked)
      // Example: Norm 20h, Worked 15h. Balance = +5h. Efficiency > 100%.
      const balance = selectedGroup.totalNorm - selectedGroup.totalWorked;
      const isPositiveBalance = balance >= 0;

      const theme = {
          primary: isHighEnergy ? 'text-teal-500' : 'text-indigo-500',
          bg: isHighEnergy ? 'bg-teal-500' : 'bg-indigo-500',
          gradient: isHighEnergy ? 'from-teal-400 to-emerald-500' : 'from-indigo-400 to-blue-500',
          glow: isHighEnergy ? 'bg-teal-400/20' : 'bg-indigo-400/20',
          fill: isHighEnergy ? 'bg-gradient-to-t from-teal-500/80 to-emerald-400/80' : 'bg-gradient-to-t from-indigo-500/80 to-blue-400/80'
      };

      const fillHeight = Math.min(100, selectedGroup.efficiency);

      return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative overflow-hidden bg-slate-50">
            <div className={`absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 transition-colors duration-1000 pointer-events-none ${isHighEnergy ? 'bg-teal-200' : 'bg-indigo-200'}`} />
            
            {/* Detail Header */}
            <div className="flex justify-between items-start mb-6 pt-4 relative z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('LIST')} className="p-3 bg-white/60 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-white/50 group">
                        <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-none">{selectedGroup.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${theme.bg}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.primary}`}>System Online</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {isAdmin && (
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className="p-3 bg-white/60 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm text-blue-600 border border-white/50"
                        >
                            <Share2 size={24} />
                        </button>
                    )}
                    {isAdmin && (
                        <SettingsMenu 
                            onDelete={() => handleDeleteGroup(selectedGroup.id)} 
                            theme={theme}
                        />
                    )}
                </div>
            </div>

            {/* Energy Core Visualization (UPDATED) */}
            <div className="relative w-full flex flex-col items-center justify-center mb-10 py-4">
                <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full blur-[60px] animate-pulse-slow transition-colors duration-1000 ${theme.glow}`} />
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300/50 animate-spin-slow" />
                    <div className="absolute inset-8 rounded-full overflow-hidden bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner z-10">
                         <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out ${theme.fill}`}
                            style={{ height: `${fillHeight}%` }}
                         >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 blur-[2px]" />
                         </div>
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <div className="flex items-baseline gap-1 drop-shadow-sm">
                                <span className="text-6xl font-light tracking-tighter text-gray-900 mix-blend-multiply">
                                    {selectedGroup.efficiency}
                                </span>
                                <span className="text-lg font-medium text-gray-600 mix-blend-multiply">%</span>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1 mix-blend-multiply opacity-80">
                                Účinnosť Skupiny
                            </div>
                         </div>
                    </div>
                </div>

                {/* Balance Pill */}
                <div className={`
                    mt-[-30px] relative z-20 px-6 py-2.5 rounded-full shadow-xl border flex items-center gap-3 transition-all duration-500
                    ${isPositiveBalance ? 'bg-teal-50 border-teal-100' : 'bg-rose-50 border-rose-100'}
                `}>
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full 
                        ${isPositiveBalance ? 'bg-teal-500 text-white' : 'bg-rose-500 text-white'}
                    `}>
                         {isPositiveBalance ? <Zap size={14} fill="currentColor" /> : <ShieldAlert size={14} />}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black ${isPositiveBalance ? 'text-teal-700' : 'text-rose-700'}`}>
                            {isPositiveBalance ? '+' : ''}{balance.toFixed(1)}h
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPositiveBalance ? 'text-teal-500' : 'text-rose-500'}`}>
                            {isPositiveBalance ? 'Ušetrené' : 'Nad Rámec'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3-Column Stats Grid */}
            <div className="grid grid-cols-3 gap-3 px-2 mb-8">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white shadow-sm flex flex-col items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">NH</span>
                    <span className="text-lg font-bold text-gray-900">{selectedGroup.totalNorm}h</span>
                    <Briefcase size={12} className="text-gray-300 mt-1" />
                </div>
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white shadow-sm flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" />
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Odpracované</span>
                    <span className="text-lg font-bold text-blue-600">{selectedGroup.totalWorked}h</span>
                    <Clock size={12} className="text-blue-300 mt-1" />
                </div>
                <div className="bg-gray-100/50 backdrop-blur-md rounded-2xl p-3 border border-transparent flex flex-col items-center opacity-80">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fond</span>
                    <span className="text-lg font-bold text-gray-500">{selectedGroup.totalCalendarFund}h</span>
                    <Calendar size={12} className="text-gray-300 mt-1" />
                </div>
            </div>

            {/* Members List Header */}
            <div className="flex justify-between items-end px-2 mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Členovia tímu ({selectedGroup.members.length})</h3>
            </div>

            {/* Members List - Updated Design */}
            <div className="space-y-3">
                {selectedGroup.members.map((member, index) => {
                    const eff = member.workedHours > 0 
                        ? Math.round((member.normHours / member.workedHours) * 100) 
                        : 0;

                    return (
                        <div 
                            key={member.id} 
                            className="group relative bg-white rounded-[20px] p-3 pl-4 flex items-center justify-between border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Left Side */}
                            <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md
                                        ${member.role === 'Admin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-600'}
                                    `}>
                                        {member.initials}
                                    </div>
                                    <div className={`
                                        absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full flex items-center justify-center shadow-sm
                                        ${member.status === 'online' ? 'bg-emerald-500' : 'bg-gray-300'}
                                    `} />
                                </div>
                                
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <div className="font-bold text-gray-900 text-sm truncate">{member.name}</div>
                                        {member.role === 'Admin' && <Crown size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                        {member.role} 
                                        <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                        {eff}% Eff.
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Side: Stats (NH / ODP / FOND) */}
                            <div className="flex items-center gap-3 relative z-10 pl-2">
                                {/* Stats Block */}
                                <div className="flex items-center gap-3 bg-gray-50/80 rounded-lg p-1.5 px-2.5 border border-gray-100">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">NH</span>
                                        <span className="text-xs font-bold text-gray-500">{member.normHours}h</span>
                                    </div>
                                    <div className="w-px h-5 bg-gray-200" />
                                    <div className="flex flex-col items-end">
                                         <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">ODP</span>
                                         <span className="text-sm font-black text-gray-900">{Math.floor(member.workedHours)}h</span>
                                    </div>
                                    <div className="w-px h-5 bg-gray-200" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">FOND</span>
                                        <span className="text-xs font-bold text-gray-500">{member.calendarFund || 0}h</span>
                                    </div>
                                </div>
                                
                                {/* Admin Actions */}
                                {isAdmin && member.id !== currentUserId && (
                                    <button 
                                        onClick={() => setMemberToManage(member)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteModal 
                    code={selectedGroup.inviteCode} 
                    onClose={() => setShowInviteModal(false)} 
                />
            )}

            {/* Member Action Sheet (Admin Only) */}
            <MemberActionSheet 
                isOpen={!!memberToManage} 
                member={memberToManage} 
                onClose={() => setMemberToManage(null)}
                onRemove={() => memberToManage && handleRemoveMember(memberToManage.id)}
            />
        </div>
      );
  }

  // --- VIEW: LIST (HUB) ---
  return (
    <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
            <h1 className="text-3xl font-light text-gray-800">Pracovné <span className="font-bold">Skupiny</span></h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Kooperatívny režim</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setView('JOIN')}
                className="w-12 h-12 rounded-2xl bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all"
            >
              <LogIn size={24} />
            </button>
            <button 
                onClick={() => setView('CREATE')}
                className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl shadow-gray-900/30 hover:scale-110 active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
        </div>
      </div>

      {loading && groups.length === 0 ? (
          <div className="flex justify-center pt-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-80 animate-fade-in">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/10 border border-white relative">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-400" />
                  <Users size={40} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Žiadna aktívna skupina</h3>
              <p className="text-gray-400 text-center max-w-xs mb-8">Vytvorte novú pracovnú skupinu alebo sa pripojte k existujúcej pomocou kódu.</p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button 
                    onClick={() => setView('CREATE')}
                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all"
                  >
                      Inicializovať Tím
                  </button>
                  <button 
                    onClick={() => setView('JOIN')}
                    className="px-8 py-3 bg-white text-blue-600 border border-blue-100 rounded-full font-bold shadow-sm hover:bg-blue-50 transition-all"
                  >
                      Mám pozývací kód
                  </button>
              </div>
          </div>
      ) : (
          <div className="grid gap-6">
              {groups.map((group, i) => {
                 const isHighEnergy = group.efficiency >= 100;
                 return (
                  <button 
                    key={group.id}
                    onClick={() => { 
                        setSelectedGroup(group); 
                        setView('DETAIL'); 
                    }}
                    className="bg-white rounded-[32px] p-6 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:scale-[1.02] transition-all text-left relative overflow-hidden group animate-slide-up border border-white/50"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 transition-colors duration-500 opacity-20 ${isHighEnergy ? 'bg-teal-400' : 'bg-blue-400'}`} />
                      
                      <div className="relative z-10 flex justify-between items-start mb-6">
                          <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                  <Activity size={10} /> {group.inviteCode}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                          </div>
                          <div className={`
                             w-10 h-10 rounded-full flex items-center justify-center border-2 
                             ${isHighEnergy ? 'border-teal-100 bg-teal-50 text-teal-500' : 'border-blue-100 bg-blue-50 text-blue-500'}
                          `}>
                                <Zap size={18} fill="currentColor" />
                          </div>
                      </div>

                      <div className="relative z-10">
                           <div className="flex justify-between items-end mb-2">
                               <span className="text-3xl font-light text-gray-800">{group.efficiency}%</span>
                               <span className="text-xs font-bold text-gray-400 mb-1">Účinnosť</span>
                           </div>
                           <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${isHighEnergy ? 'bg-teal-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${Math.min(100, group.efficiency)}%` }}
                                />
                           </div>
                      </div>
                  </button>
              )})}
          </div>
      )}
    </div>
  );
};

// --- Invite Modal ---
const InviteModal = ({ code, onClose }: { code: string, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-scale-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                        <Share2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pozvať kolegov</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Zdieľajte tento kód s kolegami. Po zadaní kódu budú automaticky pridaní do skupiny.
                    </p>

                    <div className="w-full bg-gray-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between mb-6 group cursor-pointer" onClick={handleCopy}>
                        <div className="font-mono text-2xl font-bold text-gray-800 tracking-wider">
                            {code}
                        </div>
                        <button className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            {copied ? <CheckCircle size={24} className="text-emerald-500" /> : <Copy size={24} />}
                        </button>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold"
                    >
                        Hotovo
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Member Action Sheet (Mobile Friendly) ---
const MemberActionSheet = ({ isOpen, member, onClose, onRemove }: { isOpen: boolean, member: GroupMember | null, onClose: () => void, onRemove: () => void }) => {
    if (!isOpen || !member) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
             <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
             />
             <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up mx-auto mb-0 sm:mb-auto">
                 <div className="flex justify-center mb-6">
                     <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                 </div>

                 <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-2xl">
                         {member.initials}
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                         <div className="text-sm text-gray-500">{member.role}</div>
                     </div>
                 </div>

                 <div className="space-y-3">
                    <button 
                        onClick={onRemove}
                        className="w-full p-4 flex items-center gap-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-500 group-hover:scale-110 transition-transform">
                            <Trash2 size={20} />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold">Odstrániť zo skupiny</span>
                            <span className="text-xs opacity-70">Akcia je nevratná</span>
                        </div>
                    </button>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                    >
                        Zrušiť
                    </button>
                 </div>
             </div>
        </div>,
        document.body
    );
};

// --- Helper: Settings Menu ---
const SettingsMenu = ({ onDelete, theme }: { onDelete: () => void, theme: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(0);

    const handleDeleteClick = () => {
        if (deleteConfirm === 0) {
            setDeleteConfirm(1);
            setTimeout(() => setDeleteConfirm(0), 3000);
        } else {
            onDelete();
        }
    };

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-full hover:bg-white transition-all shadow-sm border border-transparent hover:border-white/50 ${isOpen ? 'bg-white text-gray-800 rotate-90' : 'bg-white/60 backdrop-blur-md text-gray-600'}`}
            >
                <Settings size={24} />
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-64 bg-white rounded-[24px] shadow-2xl shadow-blue-900/20 border border-gray-100 p-4 animate-scale-in origin-top-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">System Controls</div>
                    
                    <div className="space-y-2">
                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-bold text-gray-600">Access Level</span>
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100">ADMIN</span>
                         </div>

                         <div className="pt-2 mt-2 border-t border-gray-100">
                             <button 
                                onClick={handleDeleteClick}
                                className={`
                                    w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 border
                                    ${deleteConfirm === 1 
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' 
                                        : 'bg-white border-transparent hover:bg-rose-50 hover:text-rose-500 text-gray-500'}
                                `}
                             >
                                <span className="font-bold text-sm">
                                    {deleteConfirm === 1 ? 'Klikni znova pre potvrdenie' : 'Odstrániť skupinu'}
                                </span>
                                {deleteConfirm === 1 ? <Unlock size={18} /> : <Lock size={18} />}
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamView;
