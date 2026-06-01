import { createClient } from '@supabase/supabase-js';
import { toLocalDateString, getPastLocalDateString } from '../utils/date';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isCloudMode = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isCloudMode 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ============================================================================
// Types Definitions
// ============================================================================
export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  theme: 'light' | 'dark';
  notification_prefs: {
    prayers: boolean;
    habits: boolean;
    tasks: boolean;
    goals: boolean;
    journals: boolean;
  };
  updated_at: string;
}

export type PrayerStatus = 'Ada' | 'Qada' | 'No';

export interface Prayer {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  fajr: PrayerStatus;
  dhuhr: PrayerStatus;
  asr: PrayerStatus;
  maghrib: PrayerStatus;
  isha: PrayerStatus;
  tahajjud: PrayerStatus;
  updated_at: string;
}

export function normalizePrayer(p: any): Prayer {
  if (!p) return p;
  const normalizeStatus = (val: any): PrayerStatus => {
    if (val === true || val === 'true') return 'Ada';
    if (val === false || val === 'false' || !val) return 'No';
    if (val === 'Ada' || val === 'Qada' || val === 'No') return val;
    return 'No'; // default fallback
  };
  return {
    ...p,
    fajr: normalizeStatus(p.fajr),
    dhuhr: normalizeStatus(p.dhuhr),
    asr: normalizeStatus(p.asr),
    maghrib: normalizeStatus(p.maghrib),
    isha: normalizeStatus(p.isha),
    tahajjud: normalizeStatus(p.tahajjud)
  };
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  is_archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'Personal' | 'Study' | 'Work' | 'Islamic' | 'Family';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  due_date: string | null;
  status: 'Todo' | 'InProgress' | 'Done';
  is_recurring: boolean;
  recurring_pattern: 'daily' | 'weekly' | 'monthly' | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'Deen' | 'Health' | 'Education' | 'Career' | 'Finance' | 'Family';
  target_date: string;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  created_at: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  mood: string; // emoji or keyword
  content: string;
  tags: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'prayer' | 'habit' | 'task' | 'goal' | 'general';
  read: boolean;
  scheduled_for: string;
  created_at: string;
}

// ============================================================================
// Seed Data for Local Storage Fallback
// ============================================================================
const MOCK_USER_ID = 'local-user-uuid-1234-5678';

const getInitialSeedData = () => {
  const today = toLocalDateString();
  const getPastDate = (daysAgo: number) => {
    return getPastLocalDateString(daysAgo);
  };

  const mockProfile: Profile = {
    id: MOCK_USER_ID,
    email: 'user@lifehub.io',
    name: 'Brother Farhan',
    avatar_url: null,
    theme: 'dark',
    notification_prefs: {
      prayers: true,
      habits: true,
      tasks: true,
      goals: true,
      journals: false
    },
    updated_at: new Date().toISOString()
  };

  // Seed Prayers for past 10 days
  const mockPrayers: Prayer[] = Array.from({ length: 11 }).map((_, index) => {
    const dateStr = getPastDate(index);
    return {
      id: `prayer-${dateStr}`,
      user_id: MOCK_USER_ID,
      date: dateStr,
      fajr: 'Ada',
      dhuhr: index % 4 !== 0 ? 'Ada' : 'No',
      asr: index % 6 !== 0 ? (index % 3 === 0 ? 'Qada' : 'Ada') : 'No',
      maghrib: 'Ada',
      isha: 'Ada',
      tahajjud: index % 3 === 0 ? 'Ada' : 'No',
      updated_at: new Date().toISOString()
    };
  });

  const mockHabits: Habit[] = [
    {
      id: 'habit-1',
      user_id: MOCK_USER_ID,
      name: 'Quran Reading (1/2 Juz)',
      description: 'Read the Quran daily with Translation and Tafseer.',
      color: '#10b981', // Emerald green
      frequency: 'daily',
      is_archived: false,
      created_at: getPastDate(20)
    },
    {
      id: 'habit-2',
      user_id: MOCK_USER_ID,
      name: 'Morning Exercise & Hydration',
      description: '30-minute cardio and drink at least 3 liters of water.',
      color: '#ec4899', // Pink
      frequency: 'daily',
      is_archived: false,
      created_at: getPastDate(15)
    },
    {
      id: 'habit-3',
      user_id: MOCK_USER_ID,
      name: 'Professional Skill Building',
      description: 'Learn and write clean Next.js 15 TypeScript code.',
      color: '#3b82f6', // Blue
      frequency: 'daily',
      is_archived: false,
      created_at: getPastDate(10)
    },
    {
      id: 'habit-4',
      user_id: MOCK_USER_ID,
      name: 'Giving Voluntary Charity (Sadaqah)',
      description: 'Support local community initiatives or feed someone in need.',
      color: '#f59e0b', // Amber
      frequency: 'weekly',
      is_archived: false,
      created_at: getPastDate(30)
    }
  ];

  // Seed Habit logs
  const mockHabitLogs: HabitLog[] = [];
  mockHabits.forEach((habit) => {
    const daysToLog = habit.id === 'habit-1' ? 10 : habit.id === 'habit-2' ? 7 : 5;
    for (let i = 0; i <= daysToLog; i++) {
      if (i === 0 && habit.id === 'habit-2') continue; // leave today incomplete for habit-2
      if (Math.random() > 0.15) { // 85% completion rate
        const logDate = getPastDate(i);
        mockHabitLogs.push({
          id: `log-${habit.id}-${logDate}`,
          habit_id: habit.id,
          user_id: MOCK_USER_ID,
          date: logDate,
          completed: true,
          created_at: new Date().toISOString()
        });
      }
    }
  });

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      user_id: MOCK_USER_ID,
      title: 'Prepare Quranic Arabic Study Notes',
      description: 'Compile Surah Yusuf vocabulary and root words.',
      category: 'Islamic',
      priority: 'High',
      due_date: today,
      status: 'Todo',
      is_recurring: false,
      recurring_pattern: null,
      created_at: getPastDate(2)
    },
    {
      id: 'task-2',
      user_id: MOCK_USER_ID,
      title: 'Complete Next.js PWA Manifest Configuration',
      description: 'Implement offline loading capability and verify visual aesthetics.',
      category: 'Work',
      priority: 'Urgent',
      due_date: today,
      status: 'InProgress',
      is_recurring: false,
      recurring_pattern: null,
      created_at: getPastDate(1)
    },
    {
      id: 'task-3',
      user_id: MOCK_USER_ID,
      title: 'Family Weekly Call',
      description: 'Schedule a Zoom catch-up with parents and siblings.',
      category: 'Family',
      priority: 'Medium',
      due_date: getPastDate(-1), // tomorrow
      status: 'Todo',
      is_recurring: true,
      recurring_pattern: 'weekly',
      created_at: getPastDate(3)
    },
    {
      id: 'task-4',
      user_id: MOCK_USER_ID,
      title: 'Daily Water Hydration Tracker Set-up',
      description: 'Install and configure fluid tracking widgets.',
      category: 'Personal',
      priority: 'Low',
      due_date: getPastDate(1), // overdue
      status: 'Todo',
      is_recurring: false,
      recurring_pattern: null,
      created_at: getPastDate(4)
    },
    {
      id: 'task-5',
      user_id: MOCK_USER_ID,
      title: 'Finish Reading Tafseer of Surah Al-Kahf',
      description: 'Annotate key lessons regarding the four core trials of faith, wealth, knowledge, and power.',
      category: 'Islamic',
      priority: 'High',
      due_date: getPastDate(2),
      status: 'Done',
      is_recurring: false,
      recurring_pattern: null,
      created_at: getPastDate(5)
    }
  ];

  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      user_id: MOCK_USER_ID,
      title: 'Memorize the Entire Juz 30 (Juz Amma)',
      description: 'Focus on perfect tajweed, root structures, and overall message to enhance prayer focus (khushu).',
      category: 'Deen',
      target_date: getPastDate(-120), // 4 months out
      status: 'InProgress',
      created_at: getPastDate(30)
    },
    {
      id: 'goal-2',
      user_id: MOCK_USER_ID,
      title: 'Run a 10K Marathon',
      description: 'Gradual build up of cardiovascular endurance, speed pacing, and strict diet.',
      category: 'Health',
      target_date: getPastDate(-60), // 2 months out
      status: 'InProgress',
      created_at: getPastDate(15)
    }
  ];

  const mockMilestones: GoalMilestone[] = [
    {
      id: 'ms-1',
      goal_id: 'goal-1',
      title: 'Memorize Surah An-Naba to Al-Mutaffifin (First Third)',
      is_completed: true,
      created_at: getPastDate(25)
    },
    {
      id: 'ms-2',
      goal_id: 'goal-1',
      title: 'Memorize Surah Al-Inshiqaq to Al-Humazah (Second Third)',
      is_completed: false,
      created_at: getPastDate(20)
    },
    {
      id: 'ms-3',
      goal_id: 'goal-1',
      title: 'Memorize Surah Al-Fil to An-Nas (Final Third)',
      is_completed: false,
      created_at: getPastDate(15)
    },
    {
      id: 'ms-4',
      goal_id: 'goal-2',
      title: 'Reach 5K running mark under 28 minutes',
      is_completed: true,
      created_at: getPastDate(12)
    },
    {
      id: 'ms-5',
      goal_id: 'goal-2',
      title: 'Incorporate compound legs workouts twice a week',
      is_completed: true,
      created_at: getPastDate(10)
    },
    {
      id: 'ms-6',
      goal_id: 'goal-2',
      title: 'Participate in local 5K community run',
      is_completed: false,
      created_at: getPastDate(5)
    }
  ];

  const mockJournalEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      user_id: MOCK_USER_ID,
      title: 'Reflections on Prayer Focus & Inner Calm',
      date: getPastDate(2),
      mood: '😇 Peaceful',
      content: 'Today I tried concentrating deeply on Fajr and Dhuhr prayers. I turned off my notifications 5 minutes before the prayer, did a perfect wudu, and sat silently reciting dhikr. The difference in my focus (khushu) was tremendous. I felt an incredible sense of tranquility and clarity throughout the day. Reminding myself of Allah\'s mercy really heals the heart.',
      tags: ['spirituality', 'prayer', 'mindfulness'],
      created_at: getPastDate(2) + 'T21:30:00Z'
    },
    {
      id: 'journal-2',
      user_id: MOCK_USER_ID,
      title: 'Productive Coding Day & Flow State',
      date: getPastDate(1),
      mood: '⚡ Energetic',
      content: 'Had a highly focused work session setting up Next.js app components. Completed the basic routing and global styling elements. Feeling accomplished. Health goals are also on track, drank enough water and skipped sweet desserts after dinner! Still need to improve my morning wake up schedule to sleep earlier.',
      tags: ['productivity', 'health', 'learning'],
      created_at: getPastDate(1) + 'T22:15:00Z'
    }
  ];

  const mockNotifications: Notification[] = [
    {
      id: 'noti-1',
      user_id: MOCK_USER_ID,
      title: 'Assalamu Alaykum!',
      message: 'Welcome to LifeHub, your personal spiritual and productivity operating system.',
      type: 'general',
      read: false,
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'noti-2',
      user_id: MOCK_USER_ID,
      title: 'Habit Reminder',
      message: 'Don\'t forget to complete your Quran reading for today to keep your 7-day streak active!',
      type: 'habit',
      read: false,
      scheduled_for: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  return {
    profile: mockProfile,
    prayers: mockPrayers,
    habits: mockHabits,
    habitLogs: mockHabitLogs,
    tasks: mockTasks,
    goals: mockGoals,
    milestones: mockMilestones,
    journals: mockJournalEntries,
    notifications: mockNotifications
  };
};

// Initialize LocalStorage Data if not present
const isBrowser = typeof window !== 'undefined';

const initializeLocalStorage = () => {
  if (!isBrowser) return null;
  
  const hasData = localStorage.getItem('lifehub_profile');
  if (!hasData) {
    const seed = getInitialSeedData();
    localStorage.setItem('lifehub_profile', JSON.stringify(seed.profile));
    localStorage.setItem('lifehub_prayers', JSON.stringify(seed.prayers));
    localStorage.setItem('lifehub_habits', JSON.stringify(seed.habits));
    localStorage.setItem('lifehub_habit_logs', JSON.stringify(seed.habitLogs));
    localStorage.setItem('lifehub_tasks', JSON.stringify(seed.tasks));
    localStorage.setItem('lifehub_goals', JSON.stringify(seed.goals));
    localStorage.setItem('lifehub_milestones', JSON.stringify(seed.milestones));
    localStorage.setItem('lifehub_journals', JSON.stringify(seed.journals));
    localStorage.setItem('lifehub_notifications', JSON.stringify(seed.notifications));
  }
};

// Invoke initialization
if (isBrowser) {
  initializeLocalStorage();
}

// ============================================================================
// Service Helper Layer (Bridges Cloud & Local Storage Mode)
// ============================================================================

// LocalStorage CRUD Utilities
const getLocal = <T>(key: string): T[] => {
  if (!isBrowser) return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

const setLocal = <T>(key: string, data: T[]): void => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
};

const getLocalObject = <T>(key: string): T | null => {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

const setLocalObject = <T>(key: string, data: T): void => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  // -------------------------------------------------------------
  // User Profile
  // -------------------------------------------------------------
  async getProfile(): Promise<Profile> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    } else {
      const profile = getLocalObject<Profile>('lifehub_profile');
      if (!profile) throw new Error('Local profile not found');
      return profile;
    }
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const profile = getLocalObject<Profile>('lifehub_profile');
      if (!profile) throw new Error('Local profile not found');
      const newProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
      setLocalObject('lifehub_profile', newProfile);
      return newProfile;
    }
  },

  // -------------------------------------------------------------
  // Prayers Tracking
  // -------------------------------------------------------------
  async getPrayers(startDateStr?: string, endDateStr?: string): Promise<Prayer[]> {
    if (isCloudMode && supabase) {
      let query = supabase.from('prayers').select('*').order('date', { ascending: false });
      if (startDateStr) query = query.gte('date', startDateStr);
      if (endDateStr) query = query.lte('date', endDateStr);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(normalizePrayer);
    } else {
      let items = getLocal<Prayer>('lifehub_prayers');
      if (startDateStr) items = items.filter(x => x.date >= startDateStr);
      if (endDateStr) items = items.filter(x => x.date <= endDateStr);
      return items.map(normalizePrayer).sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async savePrayer(dateStr: string, updates: Partial<Omit<Prayer, 'id' | 'user_id' | 'date'>>): Promise<Prayer> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      
      const { data: existing } = await supabase
        .from('prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('prayers')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('prayers')
          .insert({
            user_id: user.id,
            date: dateStr,
            fajr: updates.fajr || 'No',
            dhuhr: updates.dhuhr || 'No',
            asr: updates.asr || 'No',
            maghrib: updates.maghrib || 'No',
            isha: updates.isha || 'No',
            tahajjud: updates.tahajjud || 'No',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      return normalizePrayer(result);
    } else {
      const prayers = getLocal<Prayer>('lifehub_prayers');
      const idx = prayers.findIndex(x => x.date === dateStr);
      let updated: Prayer;
      if (idx > -1) {
        updated = { ...prayers[idx], ...updates, updated_at: new Date().toISOString() };
        prayers[idx] = updated;
      } else {
        updated = {
          id: `prayer-${dateStr}`,
          user_id: MOCK_USER_ID,
          date: dateStr,
          fajr: updates.fajr || 'No',
          dhuhr: updates.dhuhr || 'No',
          asr: updates.asr || 'No',
          maghrib: updates.maghrib || 'No',
          isha: updates.isha || 'No',
          tahajjud: updates.tahajjud || 'No',
          updated_at: new Date().toISOString()
        };
        prayers.push(updated);
      }
      setLocal('lifehub_prayers', prayers);
      return normalizePrayer(updated);
    }
  },

  // -------------------------------------------------------------
  // Habits CRUD
  // -------------------------------------------------------------
  async getHabits(): Promise<Habit[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Habit>('lifehub_habits').filter(x => !x.is_archived);
    }
  },

  async getArchivedHabits(): Promise<Habit[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Habit>('lifehub_habits').filter(x => x.is_archived);
    }
  },

  async addHabit(name: string, description: string, color: string, frequency: Habit['frequency']): Promise<Habit> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name,
          description,
          color,
          frequency,
          is_archived: false
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const habits = getLocal<Habit>('lifehub_habits');
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        user_id: MOCK_USER_ID,
        name,
        description,
        color,
        frequency,
        is_archived: false,
        created_at: new Date().toISOString()
      };
      habits.push(newHabit);
      setLocal('lifehub_habits', habits);
      return newHabit;
    }
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const habits = getLocal<Habit>('lifehub_habits');
      const idx = habits.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Habit not found');
      const updated = { ...habits[idx], ...updates };
      habits[idx] = updated;
      setLocal('lifehub_habits', habits);
      return updated;
    }
  },

  async deleteHabit(id: string): Promise<boolean> {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const habits = getLocal<Habit>('lifehub_habits');
      const filtered = habits.filter(x => x.id !== id);
      setLocal('lifehub_habits', filtered);
      
      // Also delete logs
      const logs = getLocal<HabitLog>('lifehub_habit_logs');
      setLocal('lifehub_habit_logs', logs.filter(l => l.habit_id !== id));
      return true;
    }
  },

  // -------------------------------------------------------------
  // Habit Logs
  // -------------------------------------------------------------
  async getHabitLogs(startDateStr?: string, endDateStr?: string): Promise<HabitLog[]> {
    if (isCloudMode && supabase) {
      let query = supabase.from('habit_logs').select('*');
      if (startDateStr) query = query.gte('date', startDateStr);
      if (endDateStr) query = query.lte('date', endDateStr);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      let logs = getLocal<HabitLog>('lifehub_habit_logs');
      if (startDateStr) logs = logs.filter(x => x.date >= startDateStr);
      if (endDateStr) logs = logs.filter(x => x.date <= endDateStr);
      return logs;
    }
  },

  async toggleHabitLog(habitId: string, dateStr: string, completed: boolean): Promise<HabitLog | null> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      if (!completed) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', dateStr);
        if (error) throw error;
        return null;
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            date: dateStr,
            completed: true
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      const logs = getLocal<HabitLog>('lifehub_habit_logs');
      const idx = logs.findIndex(x => x.habit_id === habitId && x.date === dateStr);

      if (!completed) {
        if (idx > -1) {
          logs.splice(idx, 1);
          setLocal('lifehub_habit_logs', logs);
        }
        return null;
      } else {
        if (idx > -1) {
          return logs[idx];
        } else {
          const newLog: HabitLog = {
            id: `log-${habitId}-${dateStr}`,
            habit_id: habitId,
            user_id: MOCK_USER_ID,
            date: dateStr,
            completed: true,
            created_at: new Date().toISOString()
          };
          logs.push(newLog);
          setLocal('lifehub_habit_logs', logs);
          return newLog;
        }
      }
    }
  },

  // -------------------------------------------------------------
  // Tasks CRUD
  // -------------------------------------------------------------
  async getTasks(): Promise<Task[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Task>('lifehub_tasks').sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    }
  },

  async createTask(
    title: string, 
    description: string, 
    category: Task['category'], 
    priority: Task['priority'], 
    dueDate: string | null,
    isRecurring = false,
    recurringPattern: Task['recurring_pattern'] = null
  ): Promise<Task> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          priority,
          due_date: dueDate,
          status: 'Todo',
          is_recurring: isRecurring,
          recurring_pattern: recurringPattern
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const tasks = getLocal<Task>('lifehub_tasks');
      const newTask: Task = {
        id: `task-${Date.now()}`,
        user_id: MOCK_USER_ID,
        title,
        description,
        category,
        priority,
        due_date: dueDate,
        status: 'Todo',
        is_recurring: isRecurring,
        recurring_pattern: recurringPattern,
        created_at: new Date().toISOString()
      };
      tasks.push(newTask);
      setLocal('lifehub_tasks', tasks);
      return newTask;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const tasks = getLocal<Task>('lifehub_tasks');
      const idx = tasks.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Task not found');
      
      const prevStatus = tasks[idx].status;
      const updated = { ...tasks[idx], ...updates };
      
      // Auto-recurrence logic when task status toggles to Done
      if (updated.status === 'Done' && prevStatus !== 'Done' && updated.is_recurring && updated.recurring_pattern) {
        // Automatically create a new copy scheduled for the next interval
        const nextDue = new Date(updated.due_date || new Date());
        if (updated.recurring_pattern === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        else if (updated.recurring_pattern === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else if (updated.recurring_pattern === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        
        const recurringTask: Task = {
          id: `task-${Date.now()}-recurring`,
          user_id: MOCK_USER_ID,
          title: updated.title,
          description: updated.description,
          category: updated.category,
          priority: updated.priority,
          due_date: nextDue.toISOString().split('T')[0],
          status: 'Todo',
          is_recurring: true,
          recurring_pattern: updated.recurring_pattern,
          created_at: new Date().toISOString()
        };
        tasks.push(recurringTask);
      }

      tasks[idx] = updated;
      setLocal('lifehub_tasks', tasks);
      return updated;
    }
  },

  async deleteTask(id: string): Promise<boolean> {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const tasks = getLocal<Task>('lifehub_tasks');
      setLocal('lifehub_tasks', tasks.filter(x => x.id !== id));
      return true;
    }
  },

  // -------------------------------------------------------------
  // Goals & Milestones CRUD
  // -------------------------------------------------------------
  async getGoals(): Promise<Goal[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Goal>('lifehub_goals');
    }
  },

  async createGoal(title: string, description: string, category: Goal['category'], targetDate: string): Promise<Goal> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          target_date: targetDate,
          status: 'InProgress'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<Goal>('lifehub_goals');
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        user_id: MOCK_USER_ID,
        title,
        description,
        category,
        target_date: targetDate,
        status: 'InProgress',
        created_at: new Date().toISOString()
      };
      goals.push(newGoal);
      setLocal('lifehub_goals', goals);
      return newGoal;
    }
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const goals = getLocal<Goal>('lifehub_goals');
      const idx = goals.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Goal not found');
      const updated = { ...goals[idx], ...updates };
      goals[idx] = updated;
      setLocal('lifehub_goals', goals);
      return updated;
    }
  },

  async deleteGoal(id: string): Promise<boolean> {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const goals = getLocal<Goal>('lifehub_goals');
      setLocal('lifehub_goals', goals.filter(x => x.id !== id));
      
      const milestones = getLocal<GoalMilestone>('lifehub_milestones');
      setLocal('lifehub_milestones', milestones.filter(x => x.goal_id !== id));
      return true;
    }
  },

  async getGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<GoalMilestone>('lifehub_milestones')
        .filter(x => x.goal_id === goalId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
  },

  async createGoalMilestone(goalId: string, title: string): Promise<GoalMilestone> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('goal_milestones')
        .insert({ goal_id: goalId, title, is_completed: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const milestones = getLocal<GoalMilestone>('lifehub_milestones');
      const newMs: GoalMilestone = {
        id: `ms-${Date.now()}`,
        goal_id: goalId,
        title,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      milestones.push(newMs);
      setLocal('lifehub_milestones', milestones);
      return newMs;
    }
  },

  async toggleGoalMilestone(milestoneId: string, isCompleted: boolean): Promise<GoalMilestone> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('goal_milestones')
        .update({ is_completed: isCompleted })
        .eq('id', milestoneId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const milestones = getLocal<GoalMilestone>('lifehub_milestones');
      const idx = milestones.findIndex(x => x.id === milestoneId);
      if (idx === -1) throw new Error('Milestone not found');
      const updated = { ...milestones[idx], is_completed: isCompleted };
      milestones[idx] = updated;
      setLocal('lifehub_milestones', milestones);
      return updated;
    }
  },

  async deleteGoalMilestone(milestoneId: string): Promise<boolean> {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('goal_milestones').delete().eq('id', milestoneId);
      if (error) throw error;
      return true;
    } else {
      const milestones = getLocal<GoalMilestone>('lifehub_milestones');
      setLocal('lifehub_milestones', milestones.filter(x => x.id !== milestoneId));
      return true;
    }
  },

  // -------------------------------------------------------------
  // Journal Entries CRUD
  // -------------------------------------------------------------
  async getJournalEntries(): Promise<JournalEntry[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<JournalEntry>('lifehub_journals')
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  },

  async createJournalEntry(title: string, dateStr: string, mood: string, content: string, tags: string[] = []): Promise<JournalEntry> {
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title,
          date: dateStr,
          mood,
          content,
          tags
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const journals = getLocal<JournalEntry>('lifehub_journals');
      const newEntry: JournalEntry = {
        id: `journal-${Date.now()}`,
        user_id: MOCK_USER_ID,
        title,
        date: dateStr,
        mood,
        content,
        tags,
        created_at: new Date().toISOString()
      };
      journals.push(newEntry);
      setLocal('lifehub_journals', journals);
      return newEntry;
    }
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const journals = getLocal<JournalEntry>('lifehub_journals');
      const idx = journals.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Journal not found');
      const updated = { ...journals[idx], ...updates };
      journals[idx] = updated;
      setLocal('lifehub_journals', journals);
      return updated;
    }
  },

  async deleteJournalEntry(id: string): Promise<boolean> {
    if (isCloudMode && supabase) {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const journals = getLocal<JournalEntry>('lifehub_journals');
      setLocal('lifehub_journals', journals.filter(x => x.id !== id));
      return true;
    }
  },

  // -------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------
  async getNotifications(): Promise<Notification[]> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('scheduled_for', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Notification>('lifehub_notifications')
        .sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
    }
  },

  async markNotificationRead(id: string): Promise<Notification> {
    if (isCloudMode && supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const notis = getLocal<Notification>('lifehub_notifications');
      const idx = notis.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Notification not found');
      const updated = { ...notis[idx], read: true };
      notis[idx] = updated;
      setLocal('lifehub_notifications', notis);
      return updated;
    }
  },

  async addNotification(title: string, message: string, type: Notification['type'], scheduledFor?: string): Promise<Notification> {
    const time = scheduledFor || new Date().toISOString();
    if (isCloudMode && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          scheduled_for: time
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const notis = getLocal<Notification>('lifehub_notifications');
      const newNoti: Notification = {
        id: `noti-${Date.now()}`,
        user_id: MOCK_USER_ID,
        title,
        message,
        type,
        read: false,
        scheduled_for: time,
        created_at: new Date().toISOString()
      };
      notis.push(newNoti);
      setLocal('lifehub_notifications', notis);
      return newNoti;
    }
  },

  // -------------------------------------------------------------
  // Data Backup & Exports
  // -------------------------------------------------------------
  async exportData(): Promise<string> {
    const fullState = {
      profile: getLocalObject<Profile>('lifehub_profile'),
      prayers: getLocal<Prayer>('lifehub_prayers'),
      habits: getLocal<Habit>('lifehub_habits'),
      habitLogs: getLocal<HabitLog>('lifehub_habit_logs'),
      tasks: getLocal<Task>('lifehub_tasks'),
      goals: getLocal<Goal>('lifehub_goals'),
      milestones: getLocal<GoalMilestone>('lifehub_milestones'),
      journals: getLocal<JournalEntry>('lifehub_journals'),
      notifications: getLocal<Notification>('lifehub_notifications'),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(fullState, null, 2);
  },

  async importData(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString);
      if (!imported.profile) throw new Error('Invalid backup format: missing profile');
      
      // Update local storage
      setLocalObject('lifehub_profile', imported.profile);
      if (imported.prayers) setLocal('lifehub_prayers', imported.prayers);
      if (imported.habits) setLocal('lifehub_habits', imported.habits);
      if (imported.habitLogs) setLocal('lifehub_habit_logs', imported.habitLogs);
      if (imported.tasks) setLocal('lifehub_tasks', imported.tasks);
      if (imported.goals) setLocal('lifehub_goals', imported.goals);
      if (imported.milestones) setLocal('lifehub_milestones', imported.milestones);
      if (imported.journals) setLocal('lifehub_journals', imported.journals);
      if (imported.notifications) setLocal('lifehub_notifications', imported.notifications);
      
      // Reload page to re-render everything
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
