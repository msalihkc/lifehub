'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Compass, 
  Flame, 
  ListTodo, 
  Target, 
  BookOpen, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { db, Task, Habit, Goal, JournalEntry } from '@/lib/supabase/client';

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  // Data lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  
  // Results
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<JournalEntry[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load datasets on open
  useEffect(() => {
    if (!isOpen) return;
    
    const loadAllData = async () => {
      try {
        const [t, h, g, j] = await Promise.all([
          db.getTasks(),
          db.getHabits(),
          db.getGoals(),
          db.getJournalEntries()
        ]);
        setTasks(t);
        setHabits(h);
        setGoals(g);
        setJournals(j);
      } catch (err) {
        console.error('Failed to load search index data', err);
      }
    };
    
    loadAllData();
    setQuery('');
    
    // Focus input after rendering
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [isOpen]);

  // Key event listeners for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleCustomOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, []);

  // Filter lists based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredTasks([]);
      setFilteredHabits([]);
      setFilteredGoals([]);
      setFilteredJournals([]);
      return;
    }

    const q = query.toLowerCase();

    setFilteredTasks(tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)));
    setFilteredHabits(habits.filter(h => h.name.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)));
    setFilteredGoals(goals.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)));
    setFilteredJournals(journals.filter(j => j.title.toLowerCase().includes(q) || j.content?.toLowerCase().includes(q)));
  }, [query, tasks, habits, goals, journals]);

  // Close when clicking outside the panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const hasResults = 
    filteredTasks.length > 0 || 
    filteredHabits.length > 0 || 
    filteredGoals.length > 0 || 
    filteredJournals.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl glass-panel animate-in slide-in-from-top-4 duration-300"
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={18} className="text-muted-foreground/75" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type command or keywords to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-0 ring-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground/60 uppercase font-mono">
            esc
          </span>
        </div>

        {/* Results / Navigation Shortcuts */}
        <div className="max-h-96 overflow-y-auto p-2">
          {!query ? (
            /* Quick Navigation Shortcuts */
            <div className="py-2 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2">
                Quick Commands
              </p>
              
              <button
                onClick={() => handleNavigate('/prayers')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <Compass size={16} className="text-emerald-500" />
                <span>Go to Prayers Tracker</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/40" />
              </button>

              <button
                onClick={() => handleNavigate('/habits')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <Flame size={16} className="text-pink-500" />
                <span>Go to Habits Tracker</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/40" />
              </button>

              <button
                onClick={() => handleNavigate('/tasks')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <ListTodo size={16} className="text-indigo-500" />
                <span>Go to Tasks Board</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/40" />
              </button>

              <button
                onClick={() => handleNavigate('/goals')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <Target size={16} className="text-amber-500" />
                <span>Go to Life Goals</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/40" />
              </button>

              <button
                onClick={() => handleNavigate('/journal')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/40 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                <BookOpen size={16} className="text-purple-500" />
                <span>Open Reflective Journal</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/40" />
              </button>
            </div>
          ) : !hasResults ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Sparkles size={24} className="text-muted-foreground/40 mb-2 animate-bounce" />
              <p className="text-xs text-muted-foreground">No matches found for &quot;{query}&quot;</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Try searching for other keywords.</p>
            </div>
          ) : (
            /* Matched Search Results */
            <div className="space-y-4 py-2">
              {/* Habits Group */}
              {filteredHabits.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-pink-500 uppercase tracking-wider px-3 mb-1">
                    Habits ({filteredHabits.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredHabits.map(h => (
                      <button
                        key={h.id}
                        onClick={() => handleNavigate('/habits')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted/40 text-left text-xs transition-colors"
                      >
                        <Flame size={12} style={{ color: h.color }} />
                        <span className="font-medium text-foreground">{h.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-xs ml-2">
                          {h.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Group */}
              {filteredTasks.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider px-3 mb-1">
                    Tasks ({filteredTasks.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredTasks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleNavigate('/tasks')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted/40 text-left text-xs transition-colors"
                      >
                        <ListTodo size={12} className="text-indigo-400" />
                        <span className="font-medium text-foreground">{t.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-muted rounded border border-border text-muted-foreground ml-auto uppercase font-medium">
                          {t.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Group */}
              {filteredGoals.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider px-3 mb-1">
                    Goals ({filteredGoals.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredGoals.map(g => (
                      <button
                        key={g.id}
                        onClick={() => handleNavigate('/goals')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted/40 text-left text-xs transition-colors"
                      >
                        <Target size={12} className="text-amber-400" />
                        <span className="font-medium text-foreground">{g.title}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-xs ml-2">
                          {g.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Journal entries Group */}
              {filteredJournals.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-purple-500 uppercase tracking-wider px-3 mb-1">
                    Journal Diaries ({filteredJournals.length})
                  </p>
                  <div className="space-y-0.5">
                    {filteredJournals.map(j => (
                      <button
                        key={j.id}
                        onClick={() => handleNavigate('/journal')}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted/40 text-left text-xs transition-colors"
                      >
                        <BookOpen size={12} className="text-purple-400" />
                        <span className="font-medium text-foreground truncate max-w-xs">{j.title}</span>
                        <span className="text-[10px] text-muted-foreground/60 ml-auto">
                          {j.date}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
