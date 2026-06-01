'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Compass, 
  Flame, 
  ListTodo, 
  Target, 
  Plus, 
  ChevronRight, 
  Check, 
  Calendar,
  Clock
} from 'lucide-react';
import { db, Profile, Prayer, Habit, HabitLog, Task, Goal } from '@/lib/supabase/client';
import { getDailyQuote } from '@/lib/utils/quotes';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayQuote, setTodayQuote] = useState({ text: '', author: '' });
  
  // Today's tracking states
  const [todayPrayer, setTodayPrayer] = useState<Prayer | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayHabitLogs, setTodayHabitLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const loadDashboardData = async () => {
    try {
      const [prof, prs, hbs, logs, tks, gls] = await Promise.all([
        db.getProfile(),
        db.getPrayers(todayStr, todayStr),
        db.getHabits(),
        db.getHabitLogs(todayStr, todayStr),
        db.getTasks(),
        db.getGoals()
      ]);

      setProfile(prof);
      setHabits(hbs);
      setTodayHabitLogs(logs);
      setTasks(tks);
      setGoals(gls);

      if (prs && prs.length > 0) {
        setTodayPrayer(prs[0]);
      } else {
        // Build empty default today prayer
        setTodayPrayer({
          id: `prayer-${todayStr}`,
          user_id: prof.id,
          date: todayStr,
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
          tahajjud: false,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayQuote(getDailyQuote());
    loadDashboardData();
    setFormattedDate(
      new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    );
  }, []);

  // Time-of-day greeting generator
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 4) return 'Assalamu Alaykum & Blessed Night';
    if (hr < 12) return 'Assalamu Alaykum & Good Morning';
    if (hr < 16) return 'Assalamu Alaykum & Good Afternoon';
    if (hr < 19) return 'Assalamu Alaykum & Good Evening';
    return 'Assalamu Alaykum & Blessed Night';
  };

  // -------------------------------------------------------------
  // Progression Rates Calculators
  // -------------------------------------------------------------
  
  // 1. Prayer rate: Fajr, Dhuhr, Asr, Maghrib, Isha (Tahajjud is bonus!)
  const getPrayerProgress = () => {
    if (!todayPrayer) return 0;
    const checked = [
      todayPrayer.fajr,
      todayPrayer.dhuhr,
      todayPrayer.asr,
      todayPrayer.maghrib,
      todayPrayer.isha
    ].filter(Boolean).length;
    return Math.round((checked / 5) * 100);
  };

  // 2. Habit rate: Percentage of active habits marked complete today
  const getHabitProgress = () => {
    const activeDailyHabits = habits.filter(h => h.frequency === 'daily');
    if (activeDailyHabits.length === 0) return 100;
    
    const completedCount = activeDailyHabits.filter(h => 
      todayHabitLogs.some(log => log.habit_id === h.id && log.completed)
    ).length;
    
    return Math.round((completedCount / activeDailyHabits.length) * 100);
  };

  // 3. Task rate: Percentage of today's tasks completed
  const getTaskProgress = () => {
    const todayTasks = tasks.filter(t => t.due_date === todayStr);
    if (todayTasks.length === 0) return 100; // 100% completed if none due
    
    const completedCount = todayTasks.filter(t => t.status === 'Done').length;
    return Math.round((completedCount / todayTasks.length) * 100);
  };

  const pRate = getPrayerProgress();
  const hRate = getHabitProgress();
  const tRate = getTaskProgress();
  const overallRate = Math.round((pRate + hRate + tRate) / 3);

  // -------------------------------------------------------------
  // Direct Check-in handlers
  // -------------------------------------------------------------
  const togglePrayer = async (name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tahajjud') => {
    if (!todayPrayer) return;
    const nextVal = !todayPrayer[name];
    
    // Optimistic UI updates
    setTodayPrayer(prev => prev ? { ...prev, [name]: nextVal } : null);

    try {
      await db.savePrayer(todayStr, { [name]: nextVal });
    } catch (e) {
      console.error(e);
      // Revert if error
      setTodayPrayer(prev => prev ? { ...prev, [name]: !nextVal } : null);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const isLogged = todayHabitLogs.some(log => log.habit_id === habitId && log.completed);
    
    // Optimistic UI updates
    if (isLogged) {
      setTodayHabitLogs(prev => prev.filter(log => log.habit_id !== habitId));
    } else {
      setTodayHabitLogs(prev => [...prev, {
        id: `temp-${habitId}`,
        habit_id: habitId,
        user_id: profile?.id || '',
        date: todayStr,
        completed: true,
        created_at: new Date().toISOString()
      }]);
    }

    try {
      await db.toggleHabitLog(habitId, todayStr, !isLogged);
      // Reload logs to fetch real IDs
      const freshLogs = await db.getHabitLogs(todayStr, todayStr);
      setTodayHabitLogs(freshLogs);
    } catch (e) {
      console.error(e);
      loadDashboardData();
    }
  };

  const completeTask = async (taskId: string) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Done' as const } : t));

    try {
      await db.updateTask(taskId, { status: 'Done' });
    } catch (e) {
      console.error(e);
      loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading dashboard widgets...</p>
      </div>
    );
  }

  const todayTasks = tasks.filter(t => t.due_date === todayStr && t.status !== 'Done');
  const activeDailyHabits = habits.filter(h => h.frequency === 'daily' && !h.is_archived);

  return (
    <div className="space-y-6">
      
      {/* 1. Welcome Greeting & Motivating Quote header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Welcome titles */}
        <div className="md:col-span-2 space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
            {getGreeting()}, {profile?.name}!
          </h2>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Calendar size={14} className="text-emerald-500" />
            <span>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Motivational daily quotes banner */}
        <div className="p-4 rounded-2xl glass-panel bg-card/40 border border-border/80 flex gap-3 items-start shadow-sm hover:shadow-md transition-all duration-200 glow-emerald">
          <Sparkles size={16} className="text-emerald-500 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="text-[11px] font-medium italic text-foreground leading-relaxed leading-snug">
              &quot;{todayQuote.text}&quot;
            </p>
            <p className="text-[9px] font-bold text-muted-foreground">
              — {todayQuote.author}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Ring Progress widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Unified circular progress card */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-6 lg:col-span-1 shadow-md">
          <div className="space-y-3 flex-1">
            <h3 className="font-extrabold text-base tracking-tight">Today&apos;s Rings</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Maintain your daily routine! Toggling check-ins below expands your concentric rings.
            </p>
            
            {/* Legend checklist */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow shadow-emerald-500/20" />
                <span className="text-muted-foreground">Prayers Completed:</span>
                <span className="text-foreground ml-auto">{pRate}%</span>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 block shadow shadow-pink-500/20" />
                <span className="text-muted-foreground">Habits Completed:</span>
                <span className="text-foreground ml-auto">{hRate}%</span>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow shadow-blue-500/20" />
                <span className="text-muted-foreground">Tasks Completed:</span>
                <span className="text-foreground ml-auto">{tRate}%</span>
              </div>
            </div>
          </div>

          {/* SVG Multi-Ring visualization */}
          <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Outer Ring: Unified score */}
              <circle cx="72" cy="72" r="54" className="stroke-muted/30" strokeWidth="10" fill="none" />
              <circle 
                cx="72" cy="72" r="54" 
                className="stroke-emerald-500 transition-all duration-500" 
                strokeWidth="10" fill="none" 
                strokeDasharray={2 * Math.PI * 54} 
                strokeDashoffset={2 * Math.PI * 54 * (1 - pRate / 100)} 
                strokeLinecap="round"
              />

              {/* Middle Ring: Habits */}
              <circle cx="72" cy="72" r="41" className="stroke-muted/30" strokeWidth="10" fill="none" />
              <circle 
                cx="72" cy="72" r="41" 
                className="stroke-pink-500 transition-all duration-500" 
                strokeWidth="10" fill="none" 
                strokeDasharray={2 * Math.PI * 41} 
                strokeDashoffset={2 * Math.PI * 41 * (1 - hRate / 100)} 
                strokeLinecap="round"
              />

              {/* Inner Ring: Tasks */}
              <circle cx="72" cy="72" r="28" className="stroke-muted/30" strokeWidth="10" fill="none" />
              <circle 
                cx="72" cy="72" r="28" 
                className="stroke-blue-500 transition-all duration-500" 
                strokeWidth="10" fill="none" 
                strokeDasharray={2 * Math.PI * 28} 
                strokeDashoffset={2 * Math.PI * 28 * (1 - tRate / 100)} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-lg text-foreground">{overallRate}%</span>
              <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase">Daily</span>
            </div>
          </div>

        </div>

        {/* Today's Prayers check-in tray */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border lg:col-span-2 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Compass size={16} className="text-emerald-500" />
              <span>Today&apos;s Prayers Check-in</span>
            </h3>
            <Link href="/prayers" className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 hover:underline">
              <span>View History</span>
              <ChevronRight size={10} />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { name: 'fajr', label: 'Fajr', time: 'Dawn' },
              { name: 'dhuhr', label: 'Dhuhr', time: 'Noon' },
              { name: 'asr', label: 'Asr', time: 'Afternoon' },
              { name: 'maghrib', label: 'Maghrib', time: 'Sunset' },
              { name: 'isha', label: 'Isha', time: 'Night' },
              { name: 'tahajjud', label: 'Tahajjud', time: 'Tahajjud' },
            ].map((p) => {
              const isChecked = todayPrayer ? (todayPrayer as any)[p.name] : false;
              
              return (
                <button
                  key={p.name}
                  onClick={() => togglePrayer(p.name as any)}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 group transition-all duration-200 cursor-pointer ${
                    isChecked 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 glow-emerald' 
                      : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase">{p.label}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                    isChecked 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-sm' 
                      : 'border-border bg-background text-transparent group-hover:border-muted-foreground/60'
                  }`}>
                    <Check size={14} className="stroke-[3.5]" />
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 leading-none">{p.time}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Lower Widgets Rows: Habits, Tasks, & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Habits list */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Flame size={16} className="text-pink-500" />
              <span>Today&apos;s Habits Check-in</span>
            </h3>
            <Link href="/habits" className="text-[10px] font-bold text-pink-500 flex items-center gap-0.5 hover:underline">
              <span>Manage</span>
              <ChevronRight size={10} />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {activeDailyHabits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">No active daily habits configured.</p>
                <Link href="/habits" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 text-white font-bold text-[10px] shadow">
                  <Plus size={10} />
                  <span>Create Habit</span>
                </Link>
              </div>
            ) : (
              activeDailyHabits.map((habit) => {
                const isLogged = todayHabitLogs.some(log => log.habit_id === habit.id && log.completed);
                
                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <p className="text-xs font-semibold leading-none">{habit.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[150px]">
                          {habit.description}
                        </p>
                      </div>
                    </div>

                    <button 
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isLogged 
                          ? 'bg-pink-500 border-pink-500 text-white scale-105 shadow-sm shadow-pink-500/20' 
                          : 'border-border bg-background text-transparent group-hover:border-muted-foreground/60'
                      }`}
                    >
                      <Check size={12} className="stroke-[3]" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's pending Tasks */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <ListTodo size={16} className="text-indigo-500" />
              <span>Today&apos;s Pending Tasks</span>
            </h3>
            <Link href="/tasks" className="text-[10px] font-bold text-indigo-500 flex items-center gap-0.5 hover:underline">
              <span>Open Board</span>
              <ChevronRight size={10} />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">All caught up! No pending tasks due today.</p>
                <Link href="/tasks" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white font-bold text-[10px] shadow">
                  <Plus size={10} />
                  <span>Create Task</span>
                </Link>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-muted/10 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-semibold leading-tight truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] px-1 rounded-md font-bold uppercase tracking-wider ${
                        task.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        task.priority === 'High' ? 'bg-orange-500/10 text-orange-500' :
                        task.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[8px] px-1 rounded-md font-semibold bg-muted border border-border text-muted-foreground uppercase">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => completeTask(task.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center border border-border bg-background text-transparent hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer"
                    title="Complete Task"
                  >
                    <Check size={12} className="stroke-[3]" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Goals widget panel */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Target size={16} className="text-amber-500" />
              <span>Active Goals Progress</span>
            </h3>
            <Link href="/goals" className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 hover:underline">
              <span>View Milestones</span>
              <ChevronRight size={10} />
            </Link>
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">No active goals set.</p>
                <Link href="/goals" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-[10px] shadow">
                  <Plus size={10} />
                  <span>Create Goal</span>
                </Link>
              </div>
            ) : (
              goals.slice(0, 3).map((goal) => {
                // Determine category color glow
                const catColor = goal.category === 'Deen' ? 'bg-emerald-500' :
                  goal.category === 'Health' ? 'bg-pink-500' :
                  goal.category === 'Education' ? 'bg-blue-500' :
                  goal.category === 'Career' ? 'bg-cyan-500' :
                  'bg-amber-500';

                return (
                  <div key={goal.id} className="space-y-2 p-3 rounded-2xl border border-border bg-muted/5 hover:bg-muted/15 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-tight truncate max-w-[160px]">{goal.title}</h4>
                        <span className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mt-1 block">
                          {goal.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                        <Clock size={10} />
                        <span>{goal.target_date}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
                        <span>Milestone completion</span>
                        <span>{goal.status === 'Completed' ? '100%' : '50%'}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted border border-border/80 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${catColor}`}
                          style={{ width: goal.status === 'Completed' ? '100%' : '50%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
