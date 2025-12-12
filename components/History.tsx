
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ArrowLeft, Zap, Crown, UserMinus, Settings, Power, Activity, Lock, Unlock, Users, Share2, Copy, LogIn, CheckCircle, MoreVertical, X, Trash2, ShieldAlert, Briefcase, Clock, Calendar, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Group, AttendanceRecord, ShiftConfig, User, GroupMember } from '../types';
import { supabase } from '../supabaseClient';

// ... (LiquidChart and TeamView component code remains mostly the same until the render) ...

interface TeamViewProps {
  user: User;
  records: AttendanceRecord[];
  shiftConfig: ShiftConfig;
}

const LiquidChart = ({ efficiency, balance, isPositiveBalance }: { efficiency: number, balance: number, isPositiveBalance: boolean }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>(Array.from({ length: 60 }, (_, i) => i));

    // Determine Theme based on Efficiency
    const theme = useMemo(() => {
        if (efficiency >= 100) {
            return {
                primary: '#14b8a6', // Teal-500
                dark: '#0f766e',    // Teal-700
                glow: 'rgba(20, 184, 166, 0.4)',
                glowDim: 'rgba(20, 184, 166, 0.1)',
                icon: '🚀'
            };
        } else if (efficiency >= 80) {
             return {
                primary: '#3b82f6', // Blue-500
                dark: '#1d4ed8',    // Blue-700
                glow: 'rgba(59, 130, 246, 0.4)',
                glowDim: 'rgba(59, 130, 246, 0.1)',
                icon: '⚡'
            };
        } else {
             return {
                primary: '#f43f5e', // Rose-500
                dark: '#be123c',    // Rose-700
                glow: 'rgba(244, 63, 94, 0.4)',
                glowDim: 'rgba(244, 63, 94, 0.1)',
                icon: '⚠️'
            };
        }
    }, [efficiency]);

    // 3D Tilt Effect
    useEffect(() => {
        const container = containerRef.current;
        const card = cardRef.current;
        if (!container || !card) return;

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
            const rect = container.getBoundingClientRect();
            // Calculate relative to the element, handling potential scroll offsets
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limit rotation to avoid extreme angles
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;

            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = `rotateX(0deg) rotateY(0deg)`;
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Calculate Tick Activity
    const getTickClass = (index: number) => {
        const totalTicks = 60;
        const activeCount = Math.min(totalTicks, Math.floor((Math.min(efficiency, 100) / 100) * totalTicks));
        return index < activeCount ? 'active' : '';
    };

    const liquidHeight = Math.min(100, Math.max(5, efficiency));

    return (
        <div className="relative flex items-center justify-center py-6 w-full overflow-visible" style={{ perspective: '1200px' }}>
            {/* Inject Styles specifically for this component */}
            <style>{`
                @keyframes drift { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes scan { 0% { transform: rotate(0deg); border-top-color: var(--lc-primary); } 50% { border-top-color: transparent; } 100% { transform: rotate(360deg); border-top-color: var(--lc-primary); } }
                @keyframes gyro-x { 0% { transform: rotateX(0deg) rotateZ(0deg); } 100% { transform: rotateX(360deg) rotateZ(360deg); } }
                @keyframes gyro-y { 0% { transform: rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateY(360deg) rotateZ(-360deg); } }
                
                .lc-vars {
                    --lc-primary: ${theme.primary};
                    --lc-dark: ${theme.dark};
                    --lc-glow: ${theme.glow};
                    --lc-glow-dim: ${theme.glowDim};
                }

                .gyro-ring { position: absolute; inset: -40px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.05); pointer-events: none; transition: all 0.5s ease; }
                .gyro-1 { border-top: 2px solid var(--lc-primary); border-bottom: 2px solid var(--lc-primary); animation: gyro-x 12s linear infinite; box-shadow: 0 0 15px var(--lc-glow-dim); }
                .gyro-2 { inset: -25px; border-left: 2px solid var(--lc-primary); border-right: 2px solid var(--lc-primary); animation: gyro-y 15s linear infinite; opacity: 0.4; }
                .gyro-3 { inset: -55px; border: 1px dashed rgba(0,0,0,0.1); animation: drift 30s linear infinite; }
                
                .tech-tick { position: absolute; top: 0; left: 50%; width: 2px; height: 10px; background: #cbd5e1; transform-origin: 50% calc(140px + 15px); transition: background 0.3s, height 0.3s; }
                .tech-tick.active { background: var(--lc-primary); box-shadow: 0 0 4px var(--lc-primary); height: 14px; }
                
                .wave { position: absolute; left: -50%; width: 200%; height: 200%; background-color: var(--lc-primary); border-radius: 40%; opacity: 0.9; }
                .wave-back { bottom: 0; opacity: 0.4; border-radius: 42%; animation: drift 9s linear infinite; background-color: var(--lc-dark); }
                .wave-front { bottom: 0; animation: drift 7s linear infinite reverse; }
            `}</style>

            <div 
                ref={containerRef}
                className="relative lc-vars scale-[0.85] sm:scale-100" // Scaling down slightly for mobile safety
                style={{ width: '280px', height: '280px' }}
            >
                 {/* Ambient Light */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-700"
                      style={{ backgroundColor: theme.glow }} />

                 <div ref={cardRef} className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out" style={{ transformStyle: 'preserve-3d' }}>
                     
                     {/* Gyro Rings & Tech Scale */}
                     <div className="absolute inset-0 z-0" style={{ transformStyle: 'preserve-3d' }}>
                         <div className="gyro-ring gyro-3"></div>
                         <div className="gyro-ring gyro-2"></div>
                         <div className="gyro-ring gyro-1"></div>
                         
                         {/* Tech Scale */}
                         <div className="absolute inset-[-15px] rounded-full animate-[drift_60s_linear_infinite_reverse]">
                             {ticks.map((i) => (
                                 <div 
                                    key={i} 
                                    className={`tech-tick ${getTickClass(i)}`} 
                                    style={{ transform: `rotate(${i * (360 / 60)}deg)` }} 
                                 />
                             ))}
                         </div>
                         
                         {/* Scanner */}
                         <div className="absolute inset-[-5px] rounded-full border-t-2 border-transparent border-l-transparent border-r-transparent animate-[scan_4s_linear_infinite] opacity-60 z-20"></div>
                     </div>

                     {/* Main Liquid Sphere */}
                     <div className="relative w-full h-full rounded-full shadow-2xl z-10 bg-white border border-slate-100 overflow-hidden ring-4 ring-white">
                         {/* Liquid */}
                         <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full overflow-hidden transform-gpu">
                             <div 
                                className="absolute bottom-0 left-0 width-full w-full transition-all duration-700 ease-out" 
                                style={{ height: `${liquidHeight}%` }}
                             >
                                 <div className="wave wave-back"></div>
                                 <div className="wave wave-front"></div>
                             </div>
                         </div>

                         {/* Data Overlay */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                             <div className="flex items-start drop-shadow-sm transform translate-y-2 mix-blend-multiply">
                                 <span className="text-[4rem] font-bold tracking-tighter text-slate-800 leading-none">{efficiency}</span>
                                 <span className="text-xl font-medium text-slate-400 mt-2 ml-1">%</span>
                             </div>
                             <div className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2 transition-colors duration-300" style={{ color: theme.primary }}>
                                 ÚČINNOSŤ
                             </div>
                         </div>

                         {/* Glass Reflection */}
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_70%)] pointer-events-none z-30"></div>
                     </div>

                     {/* Floating Badge */}
                     <div className="absolute -bottom-14 z-50 w-full flex justify-center" style={{ transform: 'translateZ(60px)' }}>
                         <div 
                            className="px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 transition-all duration-300 border-l-4 bg-white/90 backdrop-blur-md"
                            style={{ borderColor: theme.primary }}
                         >
                             <div className="relative">
                                 <div className="w-2 h-2 rounded-full animate-ping absolute top-0 right-0" style={{ backgroundColor: theme.primary }}></div>
                                 <span className="text-xl" role="img" aria-label="icon">{theme.icon}</span>
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-slate-800 font-mono font-bold text-lg tracking-wide leading-none">
                                     {isPositiveBalance ? '+' : ''}{balance.toFixed(1)}h
                                 </span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                     {isPositiveBalance ? 'UŠETRENÉ' : 'NADČAS'}
                                 </span>
                             </div>
                         </div>
                     </div>

                 </div>
            </div>
        </div>
    );
};

const TeamView: React.FC<TeamViewProps> = ({ user, records, shiftConfig }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL' | 'CREATE' | 'JOIN'>('LIST');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const selectedGroupIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToManage, setMemberToManage] = useState<GroupMember | null>(null);
  const [viewMember, setViewMember] = useState<GroupMember | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => { selectedGroupIdRef.current = selectedGroup?.id || null; }, [selectedGroup]);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if(data.user) setCurrentUserId(data.user.id); }); }, []);

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
    return { worked: workedHours, norm: normHoursAccumulated, calendarFund: calculatedCalendarFund };
  }, [records, shiftConfig]); 

  const fetchGroups = useCallback(async (isInitial = false) => {
      if (!currentUserId) return;
      if (isInitial) setLoading(true);
      try {
          const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*, group_members!inner(user_id)').eq('group_members.user_id', currentUserId);
          if (groupsError) throw groupsError;
          if (!groupsData) { setGroups([]); return; }
          const groupIds = groupsData.map(g => g.id);
          let membersData: any[] = [];
          if (groupIds.length > 0) {
              const { data: members, error: membersError } = await supabase.from('group_members').select('*').in('group_id', groupIds);
              if (membersError) throw membersError;
              membersData = members || [];
          }
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
              const efficiency = totalW > 0 ? Math.round((totalN / totalW) * 100) : 0;
              return { id: g.id, name: g.name, inviteCode: g.invite_code, adminId: g.admin_id, members: members, totalWorked: parseFloat(totalW.toFixed(1)), totalNorm: parseFloat(totalN.toFixed(1)), totalCalendarFund: parseFloat(totalCF.toFixed(1)), efficiency: efficiency };
          });
          setGroups(constructedGroups);
          const currentSelectedId = selectedGroupIdRef.current;
          if (currentSelectedId) {
              const updatedSelected = constructedGroups.find(g => g.id === currentSelectedId);
              if (updatedSelected) { setSelectedGroup(updatedSelected); }
          }
      } catch (err) { console.error('Error fetching groups:', err); } finally { setLoading(false); }
  }, [currentUserId]);

  useEffect(() => { fetchGroups(true); }, [fetchGroups]);

  useEffect(() => {
      const syncStats = async () => {
          if (!currentUserId) return;
          try { await supabase.from('group_members').update({ worked_hours: myStats.worked, norm_hours: myStats.norm, calendar_fund: myStats.calendarFund, user_name: user.name, initials: user.name?.[0] || '?' }).eq('user_id', currentUserId); } catch (err) { console.error('Error syncing stats:', err); }
      };
      const timer = setTimeout(() => { syncStats(); }, 2000);
      return () => clearTimeout(timer);
  }, [myStats, currentUserId, user.name]);

  useEffect(() => {
    const channel = supabase.channel('public:group_members').on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => { fetchGroups(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
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
        const { data: groupData, error: groupError } = await supabase.from('groups').insert({ name: newGroupName, invite_code: inviteCode, admin_id: currentUserId }).select().single();
        if (groupError) throw groupError;
        const { error: memberError } = await supabase.from('group_members').insert({ group_id: groupData.id, user_id: currentUserId, role: 'Admin', user_name: user.name, initials: user.name?.[0] || '?', worked_hours: myStats.worked, norm_hours: myStats.norm, calendar_fund: myStats.calendarFund });
        if (memberError) throw memberError;
        setNewGroupName(''); setView('LIST'); fetchGroups();
    } catch (err: any) { alert('Chyba pri vytváraní skupiny: ' + err.message); } finally { setLoading(false); }
  };

  const handleJoinGroup = async () => {
      setJoinError('');
      if (!currentUserId) return;
      const cleanCode = joinCode.trim().toUpperCase();
      setLoading(true);
      try {
          const { data: foundGroups, error: findError } = await supabase.from('groups').select('id').eq('invite_code', cleanCode).limit(1);
          if (findError) throw findError;
          if (!foundGroups || foundGroups.length === 0) { setJoinError('Skupina s týmto kódom neexistuje.'); setLoading(false); return; }
          const groupId = foundGroups[0].id;
          const { error: joinErr } = await supabase.from('group_members').insert({ group_id: groupId, user_id: currentUserId, role: 'Member', user_name: user.name, initials: user.name?.[0] || '?', worked_hours: myStats.worked, norm_hours: myStats.norm, calendar_fund: myStats.calendarFund });
          if (joinErr) { if (joinErr.code === '23505') { setJoinError('Už ste členom tejto skupiny.'); } else { throw joinErr; } } else { setJoinCode(''); setView('LIST'); fetchGroups(); }
      } catch (err: any) { console.error(err); setJoinError('Chyba pri pripájaní.'); } finally { setLoading(false); }
  };

  const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Naozaj chcete zmazať túto skupinu? Táto akcia je nevratná.')) return;
        try { await supabase.from('groups').delete().eq('id', groupId); setView('LIST'); setSelectedGroup(null); fetchGroups(); } catch (err) { console.error(err); }
  };

  const handleRemoveMember = async (memberId: string) => {
      if (!selectedGroup) return;
      try {
           const { error } = await supabase.rpc('delete_group_member', { target_user_id: memberId, target_group_id: selectedGroup.id });
           if (error) throw error;
           setMemberToManage(null); fetchGroups();
      } catch (err: any) { console.error('Error removing member:', err); alert('Chyba pri odstraňovaní člena: ' + (err.message || 'Uistite sa, že ste v Supabase vytvorili SQL funkciu delete_group_member.')); }
  };

  const isAdmin = selectedGroup?.adminId === currentUserId;

  if (view === 'JOIN') {
      return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative bg-slate-50">
             <div className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={() => setView('LIST')} className="p-3 bg-white rounded-full hover:bg-gray-100 transition-all shadow-sm"><ArrowLeft size={24} className="text-gray-700" /></button>
                <h1 className="text-2xl font-light text-gray-800">Pripojiť sa k <span className="font-bold">Tímu</span></h1>
             </div>
             <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-blue-900/5">
                 <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center"><Users size={32} className="text-indigo-500" /></div></div>
                 <p className="text-center text-gray-500 mb-8">Zadajte 6-miestny kód, ktorý vám poslal administrátor skupiny.</p>
                 <div className="mb-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Pozývací kód</label><input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC-123" className="w-full text-center text-3xl font-mono font-bold py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder-gray-300 uppercase" maxLength={7} />{joinError && <p className="text-rose-500 text-xs mt-2 text-center font-bold">{joinError}</p>}</div>
                 <button onClick={handleJoinGroup} disabled={joinCode.length < 3 || loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}Pripojiť sa</button>
             </div>
        </div>
      );
  }

  if (view === 'CREATE') {
    return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative overflow-hidden">
             <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
             <div className="flex items-center gap-4 mb-8 pt-4 relative z-10"><button onClick={() => setView('LIST')} className="p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-white/50"><ArrowLeft size={24} className="text-gray-700" /></button><h1 className="text-2xl font-light text-gray-800">Nová <span className="font-bold">Skupina</span></h1></div>
             <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl shadow-blue-900/10 border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />
                <div className="mb-8 flex justify-center"><div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse"><Activity size={40} className="text-blue-500" /></div></div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block ml-1">Názov tímu</label><div className="relative mb-8 group"><input autoFocus type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Napr. Alpha Team..." className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none py-3 bg-transparent text-gray-800 placeholder-gray-300 transition-colors" /></div>
                <div className="bg-blue-50 rounded-xl p-4 mb-8 flex gap-3"><div className="mt-1 text-blue-500"><Zap size={16} /></div><p className="text-xs text-blue-700 leading-relaxed">Po vytvorení skupiny získate <strong>unikátny kód</strong>, ktorý môžete poslať kolegom, aby sa pripojili.</p></div>
                <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || loading} className={`w-full py-5 text-white rounded-[24px] font-bold shadow-xl flex items-center justify-center gap-3 transition-all duration-300 ${newGroupName.trim() ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] hover:shadow-blue-500/30' : 'bg-gray-300 cursor-not-allowed'}`}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Power size={20} />}Vytvoriť a Získať Kód</button>
             </div>
        </div>
    )
  }

  if (view === 'DETAIL' && selectedGroup) {
      const isHighEnergy = selectedGroup.efficiency >= 100;
      const balance = selectedGroup.totalNorm - selectedGroup.totalWorked;
      const isPositiveBalance = balance >= 0;
      const theme = { primary: isHighEnergy ? 'text-teal-500' : 'text-indigo-500', bg: isHighEnergy ? 'bg-teal-500' : 'bg-indigo-500', gradient: isHighEnergy ? 'from-teal-400 to-emerald-500' : 'from-indigo-400 to-blue-500', glow: isHighEnergy ? 'bg-teal-400/20' : 'bg-indigo-400/20', fill: isHighEnergy ? 'bg-gradient-to-t from-teal-500/80 to-emerald-400/80' : 'bg-gradient-to-t from-indigo-500/80 to-blue-400/80' };

      return (
        <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen relative overflow-hidden bg-slate-50">
            <div className={`absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 transition-colors duration-1000 pointer-events-none ${isHighEnergy ? 'bg-teal-200' : 'bg-indigo-200'}`} />
            <div className="flex justify-between items-start mb-6 pt-4 relative z-40">
                <div className="flex items-center gap-4"><button onClick={() => setView('LIST')} className="p-3 bg-white/60 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-white/50 group"><ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 transition-transform" /></button><div><h1 className="text-2xl font-bold text-gray-900 leading-none">{selectedGroup.name}</h1><div className="flex items-center gap-2 mt-1"><div className={`w-2 h-2 rounded-full animate-pulse ${theme.bg}`} /><span className={`text-[10px] font-bold uppercase tracking-widest ${theme.primary}`}>System Online</span></div></div></div>
                <div className="flex gap-2">{isAdmin && (<button onClick={() => setShowInviteModal(true)} className="p-3 bg-white/60 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm text-blue-600 border border-white/50"><Share2 size={24} /></button>)}{isAdmin && (<SettingsMenu onDelete={() => handleDeleteGroup(selectedGroup.id)} theme={theme} />)}</div>
            </div>
            <div className="mb-4"><LiquidChart efficiency={selectedGroup.efficiency} balance={balance} isPositiveBalance={isPositiveBalance} /></div>
            <div className="grid grid-cols-3 gap-3 px-2 mb-8"><div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white shadow-sm flex flex-col items-center"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">NH</span><span className="text-lg font-bold text-gray-900">{selectedGroup.totalNorm}h</span><Briefcase size={12} className="text-gray-300 mt-1" /></div><div className="bg-white/70 backdrop-blur-md rounded-2xl p-3 border border-white shadow-sm flex flex-col items-center relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" /><span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1">Odpracované</span><span className="text-lg font-bold text-blue-600">{selectedGroup.totalWorked}h</span><Clock size={12} className="text-blue-300 mt-1" /></div><div className="bg-gray-100/50 backdrop-blur-md rounded-2xl p-3 border border-transparent flex flex-col items-center opacity-80"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fond</span><span className="text-lg font-bold text-gray-500">{selectedGroup.totalCalendarFund}h</span><Calendar size={12} className="text-gray-300 mt-1" /></div></div>
            <div className="flex justify-between items-end px-2 mb-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Členovia tímu ({selectedGroup.members.length})</h3></div>
            <div className="space-y-3">{selectedGroup.members.map((member, index) => { const eff = member.workedHours > 0 ? Math.round((member.normHours / member.workedHours) * 100) : 0; return (<button key={member.id} onClick={() => setViewMember(member)} className="w-full group relative bg-white rounded-[20px] p-3 pl-4 flex items-center justify-between border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}><div className="flex items-center gap-3 relative z-10 flex-1 min-w-0"><div className="relative flex-shrink-0"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md ${member.role === 'Admin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>{member.initials}</div><div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full flex items-center justify-center shadow-sm ${member.status === 'online' ? 'bg-emerald-500' : 'bg-gray-300'}`} /></div><div className="min-w-0 text-left"><div className="flex items-center gap-1.5"><div className="font-bold text-gray-900 text-sm truncate">{member.name}</div>{member.role === 'Admin' && <Crown size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />}</div><div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">{member.role} <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />{eff}% Eff.</div></div></div><div className="flex items-center gap-1 relative z-10 pl-2">{isAdmin && member.id !== currentUserId && (<div onClick={(e) => { e.stopPropagation(); setMemberToManage(member); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100 text-gray-300 hover:text-gray-700 transition-colors"><MoreVertical size={16} /></div>)}<div className="text-gray-300 group-hover:text-blue-500 transition-colors"><ChevronRight size={20} /></div></div></button>); })}</div>
            {showInviteModal && (<InviteModal code={selectedGroup.inviteCode} onClose={() => setShowInviteModal(false)} />)}
            <MemberActionSheet isOpen={!!memberToManage} member={memberToManage} onClose={() => setMemberToManage(null)} onRemove={() => memberToManage && handleRemoveMember(memberToManage.id)} />
            <MemberDetailModal isOpen={!!viewMember} member={viewMember} onClose={() => setViewMember(null)} />
        </div>
      );
  }

  return (
    <div className="pt-8 px-6 pb-32 animate-fade-in min-h-screen bg-slate-50">
      <div className="flex justify-between items-center mb-8 pt-4"><div><h1 className="text-3xl font-light text-gray-800">Pracovné <span className="font-bold">Skupiny</span></h1><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Kooperatívny režim</p></div><div className="flex gap-2"><button onClick={() => setView('JOIN')} className="w-12 h-12 rounded-2xl bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all"><LogIn size={24} /></button><button onClick={() => setView('CREATE')} className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl shadow-gray-900/30 hover:scale-110 active:scale-95 transition-all"><Plus size={24} /></button></div></div>
      {loading && groups.length === 0 ? (<div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div></div>) : groups.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 opacity-80 animate-fade-in"><div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/10 border border-white relative"><div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-400" /><Users size={40} className="text-blue-500" /></div><h3 className="text-xl font-bold text-gray-800 mb-2">Žiadna aktívna skupina</h3><p className="text-gray-400 text-center max-w-xs mb-8">Vytvorte novú pracovnú skupinu alebo sa pripojte k existujúcej pomocou kódu.</p><div className="flex flex-col gap-3 w-full max-w-xs"><button onClick={() => setView('CREATE')} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all">Inicializovať Tím</button><button onClick={() => setView('JOIN')} className="px-8 py-3 bg-white text-blue-600 border border-blue-100 rounded-full font-bold shadow-sm hover:bg-blue-50 transition-all">Mám pozývací kód</button></div></div>) : (<div className="grid gap-6">{groups.map((group, i) => { const isHighEnergy = group.efficiency >= 100; return (<button key={group.id} onClick={() => { setSelectedGroup(group); setView('DETAIL'); }} className="bg-white rounded-[32px] p-6 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:scale-[1.02] transition-all text-left relative overflow-hidden group animate-slide-up border border-white/50" style={{ animationDelay: `${i * 100}ms` }}><div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 transition-colors duration-500 opacity-20 ${isHighEnergy ? 'bg-teal-400' : 'bg-blue-400'}`} /><div className="relative z-10 flex justify-between items-start mb-6"><div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Activity size={10} /> {group.inviteCode}</div><h3 className="text-xl font-bold text-gray-900">{group.name}</h3></div><div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isHighEnergy ? 'border-teal-100 bg-teal-50 text-teal-500' : 'border-blue-100 bg-blue-50 text-blue-500'}`}><Zap size={18} fill="currentColor" /></div></div><div className="relative z-10"><div className="flex justify-between items-end mb-2"><span className="text-3xl font-light text-gray-800">{group.efficiency}%</span><span className="text-xs font-bold text-gray-400 mb-1">Účinnosť</span></div><div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isHighEnergy ? 'bg-teal-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, group.efficiency)}%` }} /></div></div></button>)})}</div>)}
    </div>
  );
};

const MemberDetailModal = ({ isOpen, member, onClose }: { isOpen: boolean, member: GroupMember | null, onClose: () => void }) => {
    if (!isOpen || !member) return null;
    const efficiency = member.workedHours > 0 ? Math.round((member.normHours / member.workedHours) * 100) : 0;
    const balance = member.normHours - member.workedHours;
    const balanceColor = balance < 0 ? 'text-rose-500' : 'text-teal-500';
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(efficiency, 100) / 100) * circumference;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center">
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose} />
             <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up mx-auto mb-0 sm:mb-auto overflow-hidden relative">
                 <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-blue-100 rounded-full blur-[60px] pointer-events-none opacity-50" />
                 <div className="flex justify-between items-center mb-6 relative z-10"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-md ${member.role === 'Admin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>{member.initials}</div><div><h3 className="text-xl font-bold text-gray-900">{member.name}</h3><div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{member.role}</div></div></div><button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button></div>
                 <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-blue-900/5 relative overflow-hidden border border-gray-100">
                    <div className="flex items-center gap-2 mb-6"><Activity size={18} className="text-blue-500" /><span className="text-xs font-black text-gray-400 uppercase tracking-widest">Mesačný Výkon</span></div>
                    <div className="flex items-center justify-between gap-4 mb-8">
                         <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128"><circle cx="64" cy="64" r={radius} stroke="#f3f4f6" strokeWidth="12" fill="transparent" /><circle cx="64" cy="64" r={radius} stroke="url(#modalGradient)" strokeWidth="12" fill="transparent" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" /><defs><linearGradient id="modalGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs></svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-black text-gray-900 tracking-tight">{efficiency}%</span><span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Účinnosť</span></div>
                         </div>
                         <div className="flex-1 space-y-3 min-w-0"><div className="bg-white border border-gray-50 rounded-2xl p-3 shadow-sm"><div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Odpracované</div><div className="text-2xl font-black text-gray-900 leading-none">{member.workedHours.toFixed(1)} <span className="text-sm text-gray-400 font-bold ml-0.5">h</span></div></div><div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm"><div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bilancia</div><div className={`text-xl font-black leading-none ${balanceColor}`}>{balance > 0 ? '+' : ''}{balance.toFixed(1)}h</div></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3"><div className="bg-white border border-gray-100 rounded-2xl py-3 flex flex-col items-center justify-center"><span className="text-[9px] font-bold text-gray-400 uppercase mb-1">NH</span><span className="text-lg font-black text-gray-800">{member.normHours}h</span></div><div className="bg-white border border-gray-100 rounded-2xl py-3 flex flex-col items-center justify-center"><span className="text-[9px] font-bold text-gray-400 uppercase mb-1">FOND</span><span className="text-lg font-black text-gray-800">{member.calendarFund || 0}h</span></div></div>
                 </div>
                 <button onClick={onClose} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-all">Zavrieť</button>
             </div>
        </div>, document.body
    );
};

const InviteModal = ({ code, onClose }: { code: string, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-scale-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><Share2 size={32} /></div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pozvať kolegov</h3>
                    <p className="text-sm text-gray-500 mb-6">Zdieľajte tento kód s kolegami. Po zadaní kódu budú automaticky pridaní do skupiny.</p>
                    <div className="w-full bg-gray-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between mb-6 group cursor-pointer" onClick={handleCopy}><div className="font-mono text-2xl font-bold text-gray-800 tracking-wider">{code}</div><button className="text-gray-400 group-hover:text-blue-500 transition-colors">{copied ? <CheckCircle size={24} className="text-emerald-500" /> : <Copy size={24} />}</button></div>
                    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Hotovo</button>
                </div>
            </div>
        </div>, document.body
    );
};

const MemberActionSheet = ({ isOpen, member, onClose, onRemove }: { isOpen: boolean, member: GroupMember | null, onClose: () => void, onRemove: () => void }) => {
    if (!isOpen || !member) return null;
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
             <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose} />
             <div className="bg-white w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 z-10 shadow-2xl transform transition-transform animate-slide-up mx-auto mb-0 sm:mb-auto">
                 <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
                 <div className="flex items-center gap-4 mb-8"><div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-2xl">{member.initials}</div><div><h3 className="text-xl font-bold text-gray-900">{member.name}</h3><div className="text-sm text-gray-500">{member.role}</div></div></div>
                 <div className="space-y-3">
                    <button onClick={onRemove} className="w-full p-4 flex items-center gap-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors group"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-500 group-hover:scale-110 transition-transform"><Trash2 size={20} /></div><div className="text-left"><span className="block font-bold">Odstrániť zo skupiny</span><span className="text-xs opacity-70">Akcia je nevratná</span></div></button>
                    <button onClick={onClose} className="w-full py-4 text-gray-500 font-bold hover:text-gray-900 transition-colors">Zrušiť</button>
                 </div>
             </div>
        </div>, document.body
    );
};

const SettingsMenu = ({ onDelete, theme }: { onDelete: () => void, theme: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(0);
    const handleDeleteClick = () => {
        if (deleteConfirm === 0) { setDeleteConfirm(1); setTimeout(() => setDeleteConfirm(0), 3000); } else { onDelete(); }
    };
    return (
        <div className="relative z-50">
            <button onClick={() => setIsOpen(!isOpen)} className={`p-3 rounded-full hover:bg-white transition-all shadow-sm border border-transparent hover:border-white/50 ${isOpen ? 'bg-white text-gray-800 rotate-90' : 'bg-white/60 backdrop-blur-md text-gray-600'}`}><Settings size={24} /></button>
            {isOpen && (<div className="absolute top-12 right-0 w-64 bg-white rounded-[24px] shadow-2xl shadow-blue-900/20 border border-gray-100 p-4 animate-scale-in origin-top-right"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">System Controls</div><div className="space-y-2"><div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><span className="text-sm font-bold text-gray-600">Access Level</span><span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100">ADMIN</span></div><div className="pt-2 mt-2 border-t border-gray-100"><button onClick={handleDeleteClick} className={`w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 border ${deleteConfirm === 1 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-white border-transparent hover:bg-rose-50 hover:text-rose-500 text-gray-500'}`}><span className="font-bold text-sm">{deleteConfirm === 1 ? 'Klikni znova pre potvrdenie' : 'Odstrániť skupinu'}</span>{deleteConfirm === 1 ? <Unlock size={18} /> : <Lock size={18} />}</button></div></div></div>)}
        </div>
    );
};

export default TeamView;
