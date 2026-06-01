'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Compass, 
  Flame, 
  ListTodo, 
  Target, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid
} from 'recharts';
import { db, Prayer, Habit, HabitLog, Task, Goal } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const startStr = start.toISOString().split('T')[0];

        const [prs, hbs, logs, tks, gls] = await Promise.all([
          db.getPrayers(startStr),
          db.getHabits(),
          db.getHabitLogs(startStr),
          db.getTasks(),
          db.getGoals()
        ]);

        setPrayers(prs);
        setHabits(hbs);
        setHabitLogs(logs);
        setTasks(tks);
        setGoals(gls);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  // -------------------------------------------------------------
  // Data Processors for Recharts
  // -------------------------------------------------------------

  // 1. Prayer Daily Completions (Past 7 Days)
  const getPrayerChartData = () => {
    const data = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = prayers.find(p => p.date === dateStr);
      
      let count = 0;
      if (log) {
        if (log.fajr) count++;
        if (log.dhuhr) count++;
        if (log.asr) count++;
        if (log.maghrib) count++;
        if (log.isha) count++;
      }
      
      data.push({
        day: days[d.getDay()],
        date: dateStr,
        obligatory: count,
        tahajjud: log?.tahajjud ? 1 : 0
      });
    }
    return data;
  };

  // 2. Tasks by Category (Completed vs Pending)
  const getTasksChartData = () => {
    const categories = ['Personal', 'Study', 'Work', 'Islamic', 'Family'];
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const completed = catTasks.filter(t => t.status === 'Done').length;
      const pending = catTasks.filter(t => t.status !== 'Done').length;
      
      return {
        category: cat,
        Completed: completed,
        Pending: pending
      };
    });
  };

  // 3. Goal Progress Percentage Comparison
  const getGoalsChartData = () => {
    return goals.map(goal => {
      // Stub progress logic based on status or milestones
      const progress = goal.status === 'Completed' ? 100 : 50;
      return {
        name: goal.title.length > 20 ? goal.title.slice(0, 18) + '...' : goal.title,
        Progress: progress
      };
    });
  };

  // 4. Habit Consistency Ratios
  const getHabitEfficiency = () => {
    if (habits.length === 0) return 0;
    const completedCount = habitLogs.filter(l => l.completed).length;
    
    // approximate active tracking days
    const totalPotentialLogs = habits.length * 7;
    if (totalPotentialLogs === 0) return 0;
    
    const ratio = Math.round((completedCount / totalPotentialLogs) * 100);
    return Math.min(ratio, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Compiling database analytics...</p>
      </div>
    );
  }

  const prayerChartData = getPrayerChartData();
  const tasksChartData = getTasksChartData();
  const goalsChartData = getGoalsChartData();
  const habitEfficiency = getHabitEfficiency();

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
          Life Analytics
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inspect multi-dimensional trends mapping your prayer counts, task completions, and goal completions.
        </p>
      </div>

      {/* Grid: 2x2 charts deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Prayer Obligatory tracker */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2 border-b border-border pb-3">
            <Compass size={16} className="text-emerald-500" />
            <span>Obligatory Prayers Consistency (Past Week)</span>
          </h3>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prayerChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="day" stroke="currentColor" opacity={0.4} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="currentColor" opacity={0.4} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--popover)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '0.75rem',
                    color: 'var(--foreground)'
                  }} 
                />
                <Legend iconSize={8} iconType="circle" />
                <Line 
                  type="monotone" 
                  dataKey="obligatory" 
                  name="Obligatory (max 5)" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  dot={{ strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tahajjud" 
                  name="Tahajjud Vigil" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Productivity comparison */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2 border-b border-border pb-3">
            <ListTodo size={16} className="text-indigo-500" />
            <span>Tasks Output by Category (Completed vs Pending)</span>
          </h3>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis dataKey="category" stroke="currentColor" opacity={0.4} />
                <YAxis stroke="currentColor" opacity={0.4} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--popover)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '0.75rem',
                    color: 'var(--foreground)'
                  }} 
                />
                <Legend iconSize={8} iconType="circle" />
                <Bar dataKey="Completed" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#cbd5e1" opacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Goals progress Horizontal Chart */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2 border-b border-border pb-3">
            <Target size={16} className="text-amber-500" />
            <span>Active Goals Completion Trajectories</span>
          </h3>

          <div className="h-64 w-full text-xs">
            {goalsChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/60 italic">
                Set goals with milestones to generate target metrics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalsChartData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="currentColor" opacity={0.4} />
                  <YAxis dataKey="name" type="category" width={100} stroke="currentColor" opacity={0.4} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--popover)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '0.75rem',
                      color: 'var(--foreground)'
                    }} 
                  />
                  <Bar dataKey="Progress" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: General Habits density checklist */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2 border-b border-border pb-3">
              <Flame size={16} className="text-pink-500" />
              <span>Habit Consistency Analytics Insights</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Weekly Habit Efficiency</span>
                <span className="text-3xl font-black text-pink-500 mt-2">{habitEfficiency}%</span>
                <span className="text-[9px] text-muted-foreground mt-1">Ratio of logs checked complete</span>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Active Habits</span>
                <span className="text-3xl font-black text-indigo-500 mt-2">{habits.length} Habits</span>
                <span className="text-[9px] text-muted-foreground mt-1">Configured routine trackers</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs flex gap-2.5 items-center glow-emerald">
            <Sparkles size={18} className="flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold">Did you know?</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Consistency is key. Keeping a 7-day habit streak triggers standard dopamine releases that solidify routine creation by up to 40%! Keep check-ins updated.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
