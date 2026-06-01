'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  Download, 
  Upload, 
  Save, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { db, Profile } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/utils/date';
import { useTheme } from '@/components/ThemeProvider';

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [notiPrayers, setNotiPrayers] = useState(true);
  const [notiHabits, setNotiHabits] = useState(true);
  const [notiTasks, setNotiTasks] = useState(true);
  const [notiGoals, setNotiGoals] = useState(true);
  const [notiJournals, setNotiJournals] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // 'success' or 'error'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await db.getProfile();
        setProfile(data);
        setName(data.name);
        setNotiPrayers(data.notification_prefs.prayers);
        setNotiHabits(data.notification_prefs.habits);
        setNotiTasks(data.notification_prefs.tasks);
        setNotiGoals(data.notification_prefs.goals);
        setNotiJournals(data.notification_prefs.journals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const updated = await db.updateProfile({
        name,
        notification_prefs: {
          prayers: notiPrayers,
          habits: notiHabits,
          tasks: notiTasks,
          goals: notiGoals,
          journals: notiJournals
        }
      });
      setProfile(updated);
      setMessage({ text: 'Profile changes updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Export state to JSON
  const handleExportJSON = async () => {
    try {
      const dataStr = await db.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lifehub_backup_${toLocalDateString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export backup JSON.');
    }
  };

  // Import state from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const success = await db.importData(text);
      if (success) {
        alert('State successfully restored! Reloading application...');
      } else {
        alert('Restoration failed: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  // Simple CSV Exporter for local table data
  const handleExportCSV = async (type: 'prayers' | 'tasks' | 'habits') => {
    try {
      let csvContent = '';
      let filename = `lifehub_${type}.csv`;

      if (type === 'tasks') {
        const tasks = await db.getTasks();
        csvContent = 'Title,Category,Priority,Due Date,Status\n' + 
          tasks.map(t => `"${t.title}","${t.category}","${t.priority}","${t.due_date || ''}","${t.status}"`).join('\n');
      } else if (type === 'habits') {
        const habits = await db.getHabits();
        csvContent = 'Name,Description,Color,Frequency\n' + 
          habits.map(h => `"${h.name}","${h.description || ''}","${h.color}","${h.frequency}"`).join('\n');
      } else if (type === 'prayers') {
        const prayers = await db.getPrayers();
        csvContent = 'Date,Fajr,Dhuhr,Asr,Maghrib,Isha,Tahajjud\n' + 
          prayers.map(p => `"${p.date}",${p.fajr},${p.dhuhr},${p.asr},${p.maghrib},${p.isha},${p.tahajjud}`).join('\n');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV file.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
          Profile Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure notification alerts, interface colors, and backup states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="p-6 rounded-2xl glass-panel bg-card border border-border space-y-5">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <User size={16} className="text-blue-500" />
              <span>Personal Information</span>
            </h3>

            {message.text && (
              <div className={`p-3 rounded-xl border text-xs flex gap-2.5 items-center ${
                message.type === 'success' 
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' 
                  : 'border-red-500/20 bg-red-500/5 text-red-500'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-0.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-muted/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || 'user@lifehub.io'}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            {/* Notification settings */}
            <div className="space-y-3.5 pt-3">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                <Bell size={14} className="text-emerald-500" />
                <span>Notification Preferences</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Decide which daily reminders you would like to receive.
              </p>

              <div className="space-y-2.5 pl-0.5">
                <label className="flex items-center justify-between p-2 rounded-xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                  <span className="text-xs font-medium">Daily Prayers reminders</span>
                  <input
                    type="checkbox"
                    checked={notiPrayers}
                    onChange={(e) => setNotiPrayers(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-emerald-500 bg-background cursor-pointer focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                  <span className="text-xs font-medium">Habit logs check-in prompts</span>
                  <input
                    type="checkbox"
                    checked={notiHabits}
                    onChange={(e) => setNotiHabits(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-pink-500 bg-background cursor-pointer focus:ring-pink-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                  <span className="text-xs font-medium">Urgent Task and deadline notices</span>
                  <input
                    type="checkbox"
                    checked={notiTasks}
                    onChange={(e) => setNotiTasks(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-indigo-500 bg-background cursor-pointer focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                  <span className="text-xs font-medium">Life Goal milestone celebrations</span>
                  <input
                    type="checkbox"
                    checked={notiGoals}
                    onChange={(e) => setNotiGoals(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-amber-500 bg-background cursor-pointer focus:ring-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors">
                  <span className="text-xs font-medium">Journal writing reminder notifications</span>
                  <input
                    type="checkbox"
                    checked={notiJournals}
                    onChange={(e) => setNotiJournals(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-purple-500 bg-background cursor-pointer focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Backups, Imports, & Exports */}
        <div className="space-y-6">
          {/* Theme card */}
          <div className="p-6 rounded-2xl glass-panel bg-card border border-border space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Settings size={16} className="text-purple-500" />
              <span>Theme Preference</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Select your customized desktop color space.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                    : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>Light Mode</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                    : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Backup card */}
          <div className="p-6 rounded-2xl glass-panel bg-card border border-border space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Download size={16} className="text-emerald-500" />
              <span>Data Portability</span>
            </h3>
            
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Download your complete profile state (prayers logs, streaks, completed tasks, goals checkpoints, and diaries) as a single JSON file.
              </p>
              
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={14} className="text-emerald-500" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="w-full py-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center block">
                <Upload size={14} className="text-blue-500 inline-block mr-1" />
                <span>Import Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* CSV Exports */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Download Table CSVs
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleExportCSV('prayers')}
                  className="py-1.5 rounded-lg bg-muted/30 hover:bg-muted/80 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                  title="Export Prayers to CSV"
                >
                  <FileSpreadsheet size={12} className="text-emerald-500" />
                  <span>Prayers</span>
                </button>

                <button
                  onClick={() => handleExportCSV('habits')}
                  className="py-1.5 rounded-lg bg-muted/30 hover:bg-muted/80 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                  title="Export Habits to CSV"
                >
                  <FileSpreadsheet size={12} className="text-pink-500" />
                  <span>Habits</span>
                </button>

                <button
                  onClick={() => handleExportCSV('tasks')}
                  className="py-1.5 rounded-lg bg-muted/30 hover:bg-muted/80 text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                  title="Export Tasks to CSV"
                >
                  <FileSpreadsheet size={12} className="text-indigo-500" />
                  <span>Tasks</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
