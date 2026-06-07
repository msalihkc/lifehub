'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles,
  Calendar,
  X,
  Edit2,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db, Habit, HabitLog } from '@/lib/supabase/client';
import { toLocalDateString, getPastLocalDateString } from '@/lib/utils/date';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [loading, habitLogs]);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // History dialog states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyHabit, setHistoryHabit] = useState<Habit | null>(null);
  const [tempLogs, setTempLogs] = useState<Record<string, boolean>>({});
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [savingHistory, setSavingHistory] = useState(false);

  // Delete dialog states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981'); // default Emerald
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const todayStr = toLocalDateString();

  useEffect(() => {
    loadHabitsData();
  }, []);

  const loadHabitsData = async () => {
    try {
      setLoading(true);
      const [hbs, logs] = await Promise.all([
        db.getHabits(),
        // Load past 365 days of logs for the GitHub heatmap!
        db.getHabitLogs(
          getPastLocalDateString(365)
        )
      ]);
      setHabits(hbs);
      setHabitLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle habit log
  const handleToggleLog = async (habitId: string) => {
    const isLogged = habitLogs.some(l => l.habit_id === habitId && l.date === todayStr && l.completed);
    
    // Optimistic UI updates
    if (isLogged) {
      setHabitLogs(prev => prev.filter(l => !(l.habit_id === habitId && l.date === todayStr)));
    } else {
      setHabitLogs(prev => [...prev, {
        id: `temp-${habitId}`,
        habit_id: habitId,
        user_id: 'local-user',
        date: todayStr,
        completed: true,
        created_at: new Date().toISOString()
      }]);
    }

    try {
      await db.toggleHabitLog(habitId, todayStr, !isLogged);
      loadHabitsData(); // refresh full logs list
    } catch (err) {
      console.error(err);
      loadHabitsData();
    }
  };

  // Add Habit
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await db.addHabit(name, description, color, frequency);
      setIsAddOpen(false);
      setName('');
      setDescription('');
      setColor('#10b981');
      setFrequency('daily');
      loadHabitsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Habit
  const handleEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !name.trim()) return;

    try {
      await db.updateHabit(editingHabit.id, {
        name,
        description,
        color,
        frequency
      });
      setIsEditOpen(false);
      setEditingHabit(null);
      setName('');
      setDescription('');
      loadHabitsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Habit
  const handleDeleteHabit = (id: string) => {
    setHabitToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      await db.deleteHabit(habitToDelete);
      loadHabitsData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
      setHabitToDelete(null);
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description);
    setColor(habit.color);
    setFrequency(habit.frequency);
    setIsEditOpen(true);
  };

  const handleOpenHistory = (habit: Habit) => {
    setHistoryHabit(habit);
    
    // Build initial temporary logs map
    const initialTempLogs: Record<string, boolean> = {};
    habitLogs
      .filter(l => l.habit_id === habit.id && l.completed)
      .forEach(l => {
        initialTempLogs[l.date] = true;
      });
    
    setTempLogs(initialTempLogs);
    setCalendarYear(new Date().getFullYear());
    setCalendarMonth(new Date().getMonth());
    setIsHistoryOpen(true);
  };

  const handleSaveHistory = async () => {
    if (!historyHabit) return;
    setSavingHistory(true);
    
    try {
      const habitId = historyHabit.id;
      
      // Get all dates originally marked as complete for this habit
      const originallyCompleted = new Set(
        habitLogs
          .filter(l => l.habit_id === habitId && l.completed)
          .map(l => l.date)
      );

      // Collect all dates that we touched in tempLogs
      const allDates = new Set([
        ...originallyCompleted,
        ...Object.keys(tempLogs)
      ]);

      const updates: Promise<any>[] = [];
      
      allDates.forEach(dateStr => {
        const isNowCompleted = !!tempLogs[dateStr];
        const wasCompleted = originallyCompleted.has(dateStr);
        
        if (isNowCompleted !== wasCompleted) {
          updates.push(db.toggleHabitLog(habitId, dateStr, isNowCompleted));
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      setIsHistoryOpen(false);
      setHistoryHabit(null);
      await loadHabitsData(); // Refresh all streaks and heatmap
    } catch (err) {
      console.error('Failed to save habit history:', err);
      alert('An error occurred while saving habit history. Please try again.');
    } finally {
      setSavingHistory(false);
    }
  };

  // Calculate Streaks for a given habit
  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    let checkDate = new Date(); // Start backwards from today

    const logsForHabit = habitLogs.filter(l => l.habit_id === habitId && l.completed);

    while (true) {
      const dateStr = toLocalDateString(checkDate);
      const hasLog = logsForHabit.some(l => l.date === dateStr);
      
      const isToday = dateStr === todayStr;

      if (hasLog) {
        streak++;
      } else {
        // Skip today if incomplete, but break if past days are incomplete
        if (!isToday) break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  // -------------------------------------------------------------
  // GitHub contribution heatmap grid calculations
  // -------------------------------------------------------------
  const buildHeatmapGrid = () => {
    // Generate dates for the past 53 weeks (371 days) to fill a perfect columns grid
    const grid = [];
    const endDate = new Date();
    
    // Align calendar starting date with Sunday
    const startDayOffset = endDate.getDay();
    const totalDays = 371; // 53 weeks * 7 days
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - totalDays + 1 + startDayOffset);

    let curDate = new Date(startDate.getTime());

    for (let i = 0; i < totalDays; i++) {
      const dateStr = toLocalDateString(curDate);
      
      // Calculate habit completions for this date
      const completionsCount = habitLogs.filter(l => l.date === dateStr && l.completed).length;

      grid.push({
        dateStr,
        completionsCount,
        dayOfWeek: curDate.getDay(),
        month: curDate.getMonth(),
        dayOfMonth: curDate.getDate()
      });

      curDate.setDate(curDate.getDate() + 1);
    }
    return grid;
  };

  const heatmapGrid = buildHeatmapGrid();

  // Group cells into columns (weeks) for vertical flow rendering
  const weeksGrid: any[][] = [];
  for (let i = 0; i < heatmapGrid.length; i += 7) {
    weeksGrid.push(heatmapGrid.slice(i, i + 7));
  }

  const premiumColors = [
    { code: '#10b981', name: 'Emerald' },
    { code: '#ec4899', name: 'Rose' },
    { code: '#3b82f6', name: 'Blue' },
    { code: '#a855f7', name: 'Purple' },
    { code: '#f59e0b', name: 'Amber' },
    { code: '#6366f1', name: 'Indigo' },
  ];

  if (loading && habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading habit contributions heatmap...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header segment */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
            Habit Tracker
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Construct consistency by logging daily check-ins and analyzing streaks.
          </p>
        </div>

        <button 
          onClick={() => {
            setName('');
            setDescription('');
            setColor('#10b981');
            setFrequency('daily');
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>New Habit</span>
        </button>
      </div>

      {/* GitHub-style Heatmap Card */}
      <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-4">
        <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2 border-b border-border pb-2.5">
          <Calendar size={16} className="text-pink-500" />
          <span>Consistency Heatmap (Past Year)</span>
        </h3>

        <div ref={scrollContainerRef} className="overflow-x-auto pb-2 flex justify-start items-center w-full">
          {/* Mobile view: last 15 weeks (fits standard mobile screens nicely without scroll) */}
          <div className="flex md:hidden gap-1 mx-auto">
            {weeksGrid.slice(-15).map((week, wIdx) => (
              <div key={`mobile-wk-${wIdx}`} className="flex flex-col gap-1">
                {week.map((day) => {
                  let shade = 'bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/20';
                  if (day.completionsCount === 1) shade = 'bg-emerald-500/30';
                  else if (day.completionsCount === 2) shade = 'bg-emerald-500/60';
                  else if (day.completionsCount >= 3) shade = 'bg-emerald-500 glow-emerald';

                  return (
                    <div 
                      key={`mobile-${day.dateStr}`}
                      className={`w-3.5 h-3.5 rounded-[4px] transition-all hover:scale-115 hover:ring-1 hover:ring-emerald-400 cursor-help ${shade}`}
                      title={`${day.dateStr}: ${day.completionsCount} habits checked`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Desktop/Tablet view: full year, scrollable on smaller tablet viewports */}
          <div className="hidden md:flex gap-1 min-w-[760px]">
            {weeksGrid.map((week, wIdx) => (
              <div key={`desktop-wk-${wIdx}`} className="flex flex-col gap-1">
                {week.map((day) => {
                  let shade = 'bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/20';
                  if (day.completionsCount === 1) shade = 'bg-emerald-500/30';
                  else if (day.completionsCount === 2) shade = 'bg-emerald-500/60';
                  else if (day.completionsCount >= 3) shade = 'bg-emerald-500 glow-emerald';

                  return (
                    <div 
                      key={`desktop-${day.dateStr}`}
                      className={`w-3.5 h-3.5 rounded-[4px] transition-all hover:scale-115 hover:ring-1 hover:ring-emerald-400 cursor-help ${shade}`}
                      title={`${day.dateStr}: ${day.completionsCount} habits checked`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/20" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/30" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/60" />
          <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      {/* Habits Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => {
          const isLogged = habitLogs.some(l => l.habit_id === habit.id && l.date === todayStr && l.completed);
          const streak = getHabitStreak(habit.id);

          return (
            <div 
              key={habit.id}
              className="p-5 rounded-3xl glass-panel bg-card border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group overflow-hidden"
            >
              {/* Vertical neon stripe highlight */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-1.5"
                style={{ backgroundColor: habit.color }}
              />

              <div className="space-y-2.5 pl-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                      {habit.name}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 mt-1 block">
                      {habit.frequency} frequency
                    </span>
                  </div>

                  {/* Actions buttons menu */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenHistory(habit)}
                      className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-pink-500 animate-in fade-in"
                      title="Log History"
                    >
                      <History size={11} />
                    </button>
                    <button 
                      onClick={() => openEditDialog(habit)}
                      className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-foreground"
                      title="Edit Habit"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-red-500"
                      title="Delete Habit"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {habit.description}
                </p>
              </div>

              {/* Footer controls check in & streak */}
              <div className="flex items-center justify-between border-t border-border/80 pt-3 pl-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Flame size={14} className="text-pink-500 animate-pulse" />
                    <span>{streak} Days Streak</span>
                  </div>
                  <button 
                    onClick={() => handleOpenHistory(habit)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-pink-500 transition-colors"
                    title="View & Edit History"
                  >
                    <Calendar size={13} />
                  </button>
                </div>

                <button 
                  onClick={() => handleToggleLog(habit.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                    isLogged
                      ? 'bg-pink-500 text-white shadow shadow-pink-500/20'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <Check size={10} className="stroke-[3.5]" />
                  <span>{isLogged ? 'Completed' : 'Complete'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ============================================================================
          Dialog: Add Habit
          ============================================================================ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Plus size={16} className="text-pink-500" />
                <span>Create New Habit</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Quran Reading, Water Intake, Daily Exercise..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Description
                </label>
                <textarea
                  placeholder="What details support this daily focus?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-0.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-0.5">
                    Theme Color
                  </label>
                  <div className="flex gap-2 items-center flex-wrap pt-1">
                    {premiumColors.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setColor(c.code)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          color === c.code 
                            ? 'ring-2 ring-primary scale-110 shadow-sm' 
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.code }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Edit Habit
          ============================================================================ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-pink-500" />
                <span>Edit Habit</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditHabit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Habit name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Description
                </label>
                <textarea
                  placeholder="Details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-0.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-0.5">
                    Theme Color
                  </label>
                  <div className="flex gap-2 items-center flex-wrap pt-1">
                    {premiumColors.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setColor(c.code)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          color === c.code 
                            ? 'ring-2 ring-primary scale-110 shadow-sm' 
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.code }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Habit History Calendar
          ============================================================================ */}
      {isHistoryOpen && historyHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200 flex flex-col gap-4">
            
            {/* Header: Title */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <History size={16} className="text-pink-500 animate-pulse" />
                <span>Log History: {historyHabit.name}</span>
              </h3>
              <button 
                onClick={() => {
                  setIsHistoryOpen(false);
                  setHistoryHabit(null);
                }} 
                className="p-1 rounded hover:bg-muted text-muted-foreground transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Subtext info */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Click on a date to log or remove a completion. Dates highlighted in theme colors are completed. Accidental touches are buffered; click <strong>Save Changes</strong> when done.
            </p>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between py-1 bg-muted/20 rounded-xl px-3 border border-border/40">
              <button
                type="button"
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(prev => prev - 1);
                  } else {
                    setCalendarMonth(prev => prev - 1);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-xs font-bold text-foreground">
                {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(prev => prev + 1);
                  } else {
                    setCalendarMonth(prev => prev + 1);
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground/60 uppercase">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {(() => {
                  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                  const daysNum = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                  const cells = [];

                  // Empty spacer cells for day of week offset
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="py-2 opacity-0" />);
                  }

                  // Day cells
                  for (let day = 1; day <= daysNum; day++) {
                    const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isCompleted = !!tempLogs[dayStr];
                    
                    const cellDate = new Date(calendarYear, calendarMonth, day);
                    const isFuture = cellDate > new Date();
                    const isToday = toLocalDateString() === dayStr;

                    cells.push(
                      <button
                        key={`day-${day}`}
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          setTempLogs(prev => ({
                            ...prev,
                            [dayStr]: !prev[dayStr]
                          }));
                        }}
                        className={`py-2 rounded-xl flex flex-col items-center justify-center relative transition-all group font-semibold ${
                          isFuture 
                            ? 'text-muted-foreground/20 cursor-not-allowed' 
                            : 'cursor-pointer hover:scale-105'
                        }`}
                      >
                        <span 
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'text-white font-bold shadow' 
                              : isToday 
                              ? 'border border-pink-500/50 text-pink-500 font-bold bg-pink-500/5' 
                              : 'hover:bg-muted text-foreground'
                          }`}
                          style={isCompleted ? { backgroundColor: historyHabit.color } : {}}
                        >
                          {day}
                        </span>
                      </button>
                    );
                  }

                  return cells;
                })()}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(false);
                  setHistoryHabit(null);
                }}
                className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingHistory}
                onClick={handleSaveHistory}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingHistory ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Delete Confirmation Modal
          ============================================================================ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Trash2 className="text-red-500" size={18} />
              <h3 className="font-extrabold text-sm text-foreground">Delete Habit</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this habit and all its logs?
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setHabitToDelete(null);
                }}
                className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHabit}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
