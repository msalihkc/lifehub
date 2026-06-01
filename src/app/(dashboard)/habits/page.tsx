'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Archive, 
  Trash2, 
  Check, 
  Sparkles,
  Calendar,
  X,
  Edit2
} from 'lucide-react';
import { db, Habit, HabitLog } from '@/lib/supabase/client';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981'); // default Emerald
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const todayStr = new Date().toISOString().split('T')[0];

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
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
  const handleDeleteHabit = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this habit and all its logs?')) return;
    try {
      await db.deleteHabit(id);
      loadHabitsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Archive Habit
  const handleArchiveHabit = async (id: string) => {
    try {
      await db.updateHabit(id, { is_archived: true });
      loadHabitsData();
    } catch (err) {
      console.error(err);
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

  // Calculate Streaks for a given habit
  const getHabitStreak = (habitId: string) => {
    let streak = 0;
    let checkDate = new Date(); // Start backwards from today

    const logsForHabit = habitLogs.filter(l => l.habit_id === habitId && l.completed);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
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
      const dateStr = curDate.toISOString().split('T')[0];
      
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

        <div className="overflow-x-auto pb-2 flex justify-start items-center">
          <div className="flex gap-1 min-w-[760px]">
            {weeksGrid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => {
                  // Determine heatmap cell shade based on completion density
                  let shade = 'bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/20';
                  if (day.completionsCount === 1) shade = 'bg-emerald-500/30';
                  else if (day.completionsCount === 2) shade = 'bg-emerald-500/60';
                  else if (day.completionsCount >= 3) shade = 'bg-emerald-500 glow-emerald';

                  return (
                    <div 
                      key={day.dateStr}
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
                      onClick={() => openEditDialog(habit)}
                      className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-foreground"
                      title="Edit Habit"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button 
                      onClick={() => handleArchiveHabit(habit.id)}
                      className="p-1 rounded bg-muted/60 text-muted-foreground hover:text-amber-500"
                      title="Archive Habit"
                    >
                      <Archive size={11} />
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Flame size={14} className="text-pink-500 animate-pulse" />
                  <span>{streak} Days Streak</span>
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

    </div>
  );
}
