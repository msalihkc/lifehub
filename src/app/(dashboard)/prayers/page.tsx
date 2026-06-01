'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar, 
  TrendingUp, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Check
} from 'lucide-react';
import { db, Prayer } from '@/lib/supabase/client';

export default function PrayersPage() {
  const [prayersHistory, setPrayersHistory] = useState<Prayer[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activePrayer, setActivePrayer] = useState<Prayer | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setSelectedDate(todayStr);
    loadPrayersData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    
    // Find active prayer record for selected date
    const record = prayersHistory.find(p => p.date === selectedDate);
    if (record) {
      setActivePrayer(record);
    } else {
      setActivePrayer({
        id: `prayer-${selectedDate}`,
        user_id: prayersHistory[0]?.user_id || 'local-user',
        date: selectedDate,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        tahajjud: false,
        updated_at: new Date().toISOString()
      });
    }
  }, [selectedDate, prayersHistory]);

  const loadPrayersData = async () => {
    try {
      // Load prayers history for past 60 days to compute stats and calendar logs
      const start = new Date();
      start.setDate(start.getDate() - 60);
      const startStr = start.toISOString().split('T')[0];
      
      const data = await db.getPrayers(startStr);
      setPrayersHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle specific prayer completion
  const handleToggle = async (prayerName: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tahajjud') => {
    if (!activePrayer) return;

    const nextVal = !(activePrayer as any)[prayerName];
    
    // Optimistic UI updates
    const updatedRecord = { ...activePrayer, [prayerName]: nextVal, updated_at: new Date().toISOString() };
    setActivePrayer(updatedRecord);
    setPrayersHistory(prev => {
      const filtered = prev.filter(p => p.date !== selectedDate);
      return [...filtered, updatedRecord];
    });

    try {
      await db.savePrayer(selectedDate, { [prayerName]: nextVal });
      // Refresh backend state
      loadPrayersData();
    } catch (err) {
      console.error(err);
      loadPrayersData(); // Revert on failure
    }
  };

  // Reset entire selected day (CRUD Delete equivalent)
  const handleResetDay = async () => {
    if (!activePrayer) return;
    
    const clearedRecord = {
      ...activePrayer,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      tahajjud: false,
      updated_at: new Date().toISOString()
    };
    
    setActivePrayer(clearedRecord);
    setPrayersHistory(prev => {
      const filtered = prev.filter(p => p.date !== selectedDate);
      return [...filtered, clearedRecord];
    });

    try {
      await db.savePrayer(selectedDate, {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        tahajjud: false
      });
      loadPrayersData();
    } catch (err) {
      console.error(err);
      loadPrayersData();
    }
  };

  // -------------------------------------------------------------
  // Statistics Calculations
  // -------------------------------------------------------------
  
  // Weekly obligatory prayers (last 7 days - 35 obligatory possible)
  const getWeeklyStats = () => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    let completed = 0;
    last7Days.forEach(dateStr => {
      const log = prayersHistory.find(p => p.date === dateStr);
      if (log) {
        if (log.fajr) completed++;
        if (log.dhuhr) completed++;
        if (log.asr) completed++;
        if (log.maghrib) completed++;
        if (log.isha) completed++;
      }
    });

    return {
      completed,
      percentage: Math.round((completed / 35) * 100)
    };
  };

  // Monthly stats (all records in active calendar month)
  const getMonthlyStats = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const thisMonthLogs = prayersHistory.filter(p => {
      const logDate = new Date(p.date);
      return logDate.getFullYear() === year && logDate.getMonth() === month;
    });

    let obligatoryCompleted = 0;
    let tahajjudCompleted = 0;
    
    thisMonthLogs.forEach(log => {
      if (log.fajr) obligatoryCompleted++;
      if (log.dhuhr) obligatoryCompleted++;
      if (log.asr) obligatoryCompleted++;
      if (log.maghrib) obligatoryCompleted++;
      if (log.isha) obligatoryCompleted++;
      if (log.tahajjud) tahajjudCompleted++;
    });

    const totalObligatoryPossible = thisMonthLogs.length * 5;

    return {
      completed: obligatoryCompleted,
      tahajjud: tahajjudCompleted,
      percentage: totalObligatoryPossible > 0 ? Math.round((obligatoryCompleted / totalObligatoryPossible) * 100) : 0
    };
  };

  // Consecutive Streak: Obligatory prayers completed successfully (Fajr to Isha complete)
  const getStreak = () => {
    let streak = 0;
    let checkDate = new Date(); // Start checking from today backwards
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = prayersHistory.find(p => p.date === dateStr);
      
      // If we find today incomplete, we check yesterday first before breaking (as today is still in progress)
      const isToday = dateStr === todayStr;
      
      if (log) {
        const allCompleted = log.fajr && log.dhuhr && log.asr && log.maghrib && log.isha;
        if (allCompleted) {
          streak++;
        } else {
          // If today is incomplete, skip it and continue checking backwards. For past days, break.
          if (!isToday) break;
        }
      } else {
        if (!isToday) break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  // -------------------------------------------------------------
  // Calendar Grid Builder
  // -------------------------------------------------------------
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
    return { days, startDay };
  };

  const { days, startDay } = getDaysInMonth(currentMonth);
  const calendarCells = Array.from({ length: 42 }).map((_, idx) => {
    const dateNum = idx - startDay + 1;
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dateNum);
    const dateStr = cellDate.toISOString().split('T')[0];
    
    const isValid = dateNum > 0 && dateNum <= days;
    const isSelected = dateStr === selectedDate;
    const isCurrentToday = dateStr === todayStr;
    const prayerLog = prayersHistory.find(p => p.date === dateStr);

    return {
      dateNum,
      dateStr,
      isValid,
      isSelected,
      isCurrentToday,
      prayerLog
    };
  });

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const offset = direction === 'prev' ? -1 : 1;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading prayer database logs...</p>
      </div>
    );
  }

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const streakCount = getStreak();

  return (
    <div className="space-y-6">
      
      {/* Header Titles */}
      <div>
        <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
          Prayer Tracker
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mark obligatory prayers, track streaks, and analyze historical monthly completions.
        </p>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak card */}
        <div className="p-5 rounded-2xl glass-panel bg-card border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 shadow-inner">
            <Award size={22} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Consecutive Streak</p>
            <p className="text-xl font-black text-foreground mt-1.5">{streakCount} Days</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">All 5 obligatory prayers complete</p>
          </div>
        </div>

        {/* Weekly average card */}
        <div className="p-5 rounded-2xl glass-panel bg-card border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Weekly Progress</p>
            <p className="text-xl font-black text-foreground mt-1.5">{weeklyStats.percentage}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{weeklyStats.completed} / 35 obligatory prayers logged</p>
          </div>
        </div>

        {/* Monthly average card */}
        <div className="p-5 rounded-2xl glass-panel bg-card border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Monthly Average</p>
            <p className="text-xl font-black text-foreground mt-1.5">{monthlyStats.percentage}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{monthlyStats.completed} obligatory & {monthlyStats.tahajjud} Tahajjud</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Selector & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Grid (2cols): Monthly calendar logs history */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-4">
          
          {/* Calendar month switcher */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Calendar size={16} className="text-emerald-500" />
              <span>Prayer Log History</span>
            </h3>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleMonthChange('prev')}
                className="p-1.5 rounded-lg border border-border bg-muted/10 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              
              <span className="text-xs font-bold uppercase tracking-wider">
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>

              <button 
                onClick={() => handleMonthChange('next')}
                className="p-1.5 rounded-lg border border-border bg-muted/10 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Calendar grid headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest py-1">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell.isValid) {
                return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
              }

              // Obligatory checked prayers count (max 5)
              let obligChecked = 0;
              let isTahajjud = false;
              if (cell.prayerLog) {
                if (cell.prayerLog.fajr) obligChecked++;
                if (cell.prayerLog.dhuhr) obligChecked++;
                if (cell.prayerLog.asr) obligChecked++;
                if (cell.prayerLog.maghrib) obligChecked++;
                if (cell.prayerLog.isha) obligChecked++;
                if (cell.prayerLog.tahajjud) isTahajjud = true;
              }

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`aspect-square rounded-2xl border p-2 flex flex-col items-center justify-between transition-all group cursor-pointer ${
                    cell.isSelected 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 glow-emerald scale-[1.03]' 
                      : cell.isCurrentToday
                        ? 'border-indigo-400 bg-indigo-400/5 text-indigo-500'
                        : 'border-border/60 bg-muted/5 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{cell.dateNum}</span>
                  
                  {/* Dot completion indicator */}
                  <div className="flex gap-0.5 justify-center w-full mt-1.5 flex-wrap">
                    {/*Obligatory Dots */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-1 h-1 rounded-full ${
                          i < obligChecked 
                            ? 'bg-emerald-500' 
                            : 'bg-zinc-400/20 dark:bg-zinc-700/50'
                        }`} 
                      />
                    ))}
                    {/* Tahajjud dot */}
                    {isTahajjud && (
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-muted-foreground/60 flex items-center justify-end gap-4 border-t border-border/60">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Complete Obligatory
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Tahajjud Offered
            </span>
          </div>

        </div>

        {/* Right Grid (1col): Detailed Prayer check-in editor */}
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md space-y-5">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
              <Compass size={16} className="text-emerald-500" />
              <span>Log Editor</span>
            </h3>
            
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              {selectedDate === todayStr ? 'Today' : selectedDate}
            </span>
          </div>

          {/* Individual prayer toggle buttons */}
          <div className="space-y-3">
            {[
              { name: 'fajr', label: 'Fajr', subtitle: 'Dawn prayer (2 Sunnah + 2 Fard)' },
              { name: 'dhuhr', label: 'Dhuhr', subtitle: 'Noon prayer (4 Sunnah + 4 Fard + 2 Sunnah)' },
              { name: 'asr', label: 'Asr', subtitle: 'Afternoon prayer (4 Fard)' },
              { name: 'maghrib', label: 'Maghrib', subtitle: 'Sunset prayer (3 Fard + 2 Sunnah)' },
              { name: 'isha', label: 'Isha', subtitle: 'Night prayer (4 Fard + 2 Sunnah + 3 Witr)' },
              { name: 'tahajjud', label: 'Tahajjud (Bonus)', subtitle: 'Night vigil prayer (2 to 8 Rakaah)' }
            ].map((p) => {
              const isChecked = activePrayer ? (activePrayer as any)[p.name] : false;
              const isTahaj = p.name === 'tahajjud';

              return (
                <button
                  key={p.name}
                  onClick={() => handleToggle(p.name as any)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                    isChecked
                      ? isTahaj 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 glow-amber'
                        : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 glow-emerald'
                      : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="pr-2">
                    <p className="text-xs font-bold leading-none">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{p.subtitle}</p>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                    isChecked
                      ? isTahaj 
                        ? 'bg-amber-500 border-amber-500 text-white scale-105 shadow-sm'
                        : 'bg-emerald-500 border-emerald-500 text-white scale-105 shadow-sm'
                      : 'border-border bg-background text-transparent group-hover:border-muted-foreground/50'
                  }`}>
                    <Check size={14} className="stroke-[3.5]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reset Day button (CRUD Delete equivalent) */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={handleResetDay}
              className="w-full py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-muted-foreground"
            >
              <RotateCcw size={14} />
              <span>Reset Day Log</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
