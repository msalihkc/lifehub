'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Tag, 
  Trash2, 
  Edit2, 
  X, 
  Smile, 
  Check, 
  TrendingUp, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { db, JournalEntry } from '@/lib/supabase/client';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Dialogs
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [mood, setMood] = useState('😇 Peaceful');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadJournalData();
  }, []);

  const loadJournalData = async () => {
    try {
      setLoading(true);
      const data = await db.getJournalEntries();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      if (isEdit && editingEntry) {
        await db.updateJournalEntry(editingEntry.id, {
          title,
          date: date || todayStr,
          mood,
          content,
          tags
        });
      } else {
        await db.createJournalEntry(title, date || todayStr, mood, content, tags);
      }
      
      setIsOpen(false);
      resetForm();
      loadJournalData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diary entry permanently?')) return;
    try {
      await db.deleteJournalEntry(id);
      loadJournalData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsEdit(false);
    setDate(todayStr);
    setIsOpen(true);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setDate(entry.date);
    setMood(entry.mood);
    setContent(entry.content);
    setTags(entry.tags);
    setIsEdit(true);
    setIsOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setMood('😇 Peaceful');
    setContent('');
    setTags([]);
    setTagInput('');
    setEditingEntry(null);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase();
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags(prev => [...prev, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // -------------------------------------------------------------
  // Filtering & Search
  // -------------------------------------------------------------
  const allUniqueTags = ['All', ...Array.from(new Set(entries.flatMap(e => e.tags)))];

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || entry.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // -------------------------------------------------------------
  // Mood Frequencies Calculations (Analytics)
  // -------------------------------------------------------------
  const getMoodAnalytics = () => {
    const analysis: Record<string, number> = {};
    entries.forEach(e => {
      analysis[e.mood] = (analysis[e.mood] || 0) + 1;
    });
    return Object.entries(analysis).sort((a, b) => b[1] - a[1]);
  };

  const moodAnalytics = getMoodAnalytics();

  const moodsList = [
    '😇 Peaceful',
    '⚡ Energetic',
    '🌸 Happy',
    '🧠 Focused',
    '🍂 Reflective',
    '😴 Tired',
    '🌪️ Anxious'
  ];

  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading journal entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
            Reflective Journal
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log daily reflections, capture emotional moods, and inspect personal spiritual growth.
          </p>
        </div>

        <button 
          onClick={openAddDialog}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>New Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Grid: Sidebar Search Filters & Mood Analytics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Search filter card */}
          <div className="p-5 rounded-2xl glass-panel bg-card border border-border space-y-4">
            <h3 className="font-extrabold text-xs text-foreground flex items-center gap-2">
              <Search size={14} className="text-purple-500" />
              <span>Search Diaries</span>
            </h3>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            
            {/* Unique tags filters list */}
            <div className="space-y-1.5 pt-2">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2">
                Filter by Tag
              </p>
              <div className="flex flex-wrap gap-1">
                {allUniqueTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      selectedTag === t
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mood Analysis card */}
          <div className="p-5 rounded-2xl glass-panel bg-card border border-border space-y-4">
            <h3 className="font-extrabold text-xs text-foreground flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500 animate-pulse" />
              <span>Mood Insights</span>
            </h3>
            
            <div className="space-y-3">
              {moodAnalytics.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">Add entries to compute mood frequencies.</p>
              ) : (
                moodAnalytics.map(([moodStr, count]) => {
                  const percent = Math.round((count / entries.length) * 100);
                  
                  return (
                    <div key={moodStr} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span>{moodStr}</span>
                        <span className="text-muted-foreground">{count} logs ({percent}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted border border-border/80 overflow-hidden w-full">
                        <div 
                          className="h-full rounded-full bg-purple-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Grid: Journal entries listing */}
        <div className="lg:col-span-3 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="py-20 text-center glass-panel bg-card border border-border rounded-3xl">
              <BookOpen size={32} className="text-muted-foreground/40 mx-auto mb-3 animate-bounce" />
              <p className="text-xs text-muted-foreground">No reflective logs match your criteria.</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Start writing a new diary log to reflect on your day.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div 
                key={entry.id}
                className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
              >
                
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-foreground tracking-tight leading-tight">
                      {entry.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-purple-500" />
                        <span>{entry.date}</span>
                      </div>
                      
                      <span className="px-2 py-0.5 rounded-md bg-muted border border-border text-[9px] font-bold text-foreground">
                        {entry.mood}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons overlay */}
                  <div className="flex items-center gap-1.5 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditDialog(entry)}
                      className="p-1.5 rounded-lg bg-muted/50 border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg bg-muted/50 border border-border/80 hover:bg-muted text-muted-foreground hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Entry content body */}
                <div className="py-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.content}
                </div>

                {/* Tags footer */}
                {entry.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap border-t border-border/40 pt-3">
                    <Tag size={10} className="text-muted-foreground/60" />
                    {entry.tags.map((t) => (
                      <span 
                        key={t}
                        className="px-2 py-0.5 rounded-md border border-border bg-muted/30 text-[9px] text-muted-foreground uppercase font-bold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </div>

      {/* ============================================================================
          Dialog: Add / Edit Journal Entry
          ============================================================================ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Smile size={16} className="text-purple-500 animate-pulse" />
                <span>{isEdit ? 'Edit Reflective Log' : 'Write Reflections'}</span>
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Diary Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Reflections on today..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Calendar Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Mood Selector horizontal panel */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 pl-0.5">
                  How was your emotional & spiritual state today?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                  {moodsList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`py-2 rounded-xl border text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mood === m
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black scale-105 shadow-sm'
                          : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>{m.split(' ')[0]}</span>
                      <span className="text-[8px] truncate">{m.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Reflections & Thoughts (Rich Editor space)
                </label>
                <textarea
                  required
                  placeholder="Record your accomplishments, inner struggles, dhikr experiences, or general growth lessons..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/50 font-sans"
                />
              </div>

              {/* Tags deck */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-0.5">
                  Tags (Press comma or enter to register)
                </label>
                <div className="p-2 border border-border rounded-xl bg-muted/10 flex flex-wrap gap-1.5 items-center">
                  {tags.map((t, idx) => (
                    <span 
                      key={t}
                      className="px-2 py-0.5 rounded-lg border border-border bg-card text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 group/item"
                    >
                      <span>{t}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveTag(idx)} 
                        className="text-muted-foreground/60 hover:text-red-500"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="spirituality, work, health..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="bg-transparent border-0 outline-0 ring-0 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none flex-1 min-w-[120px]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isEdit ? 'Save Changes' : 'Publish entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
