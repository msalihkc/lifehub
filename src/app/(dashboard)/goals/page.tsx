'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  X, 
  Edit2, 
  PlusSquare,
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db, Goal, GoalMilestone } from '@/lib/supabase/client';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestonesMap, setMilestonesMap] = useState<Record<string, GoalMilestone[]>>({});
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>('Deen');
  const [targetDate, setTargetDate] = useState('');
  const [goalStatus, setGoalStatus] = useState<Goal['status']>('InProgress');
  
  // New Milestone input state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Dynamic categories state
  const [categories, setCategories] = useState<string[]>(['Deen', 'Health', 'Education', 'Career', 'Finance', 'Family']);

  useEffect(() => {
    loadGoalsData();
    loadProfileCategories();
  }, []);

  const loadProfileCategories = async () => {
    try {
      const data = await db.getProfile();
      if (data.goal_categories && data.goal_categories.length > 0) {
        setCategories(data.goal_categories);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGoalsData = async () => {
    try {
      setLoading(true);
      const data = await db.getGoals();
      setGoals(data);
      
      // Pre-fetch milestones for all goals
      const msp: Record<string, GoalMilestone[]> = {};
      await Promise.all(
        data.map(async (g) => {
          const ms = await db.getGoalMilestones(g.id);
          msp[g.id] = ms;
        })
      );
      setMilestonesMap(msp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    try {
      await db.createGoal(title, description, category, targetDate);
      setIsAddOpen(false);
      resetForm();
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Goal
  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !title.trim() || !targetDate) return;

    try {
      await db.updateGoal(editingGoal.id, {
        title,
        description,
        category,
        target_date: targetDate,
        status: goalStatus
      });
      setIsEditOpen(false);
      setEditingGoal(null);
      resetForm();
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal and all its milestones?')) return;
    try {
      await db.deleteGoal(id);
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Goal Status directly (e.g. mark complete)
  const toggleGoalComplete = async (goal: Goal) => {
    const nextStatus = goal.status === 'Completed' ? 'InProgress' : 'Completed';
    try {
      await db.updateGoal(goal.id, { status: nextStatus });
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // Milestones Handlers
  // -------------------------------------------------------------
  const handleAddMilestone = async (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    try {
      const ms = await db.createGoalMilestone(goalId, newMilestoneTitle);
      setMilestonesMap(prev => ({
        ...prev,
        [goalId]: [...(prev[goalId] || []), ms]
      }));
      setNewMilestoneTitle('');
      
      // Re-trigger goal progress re-calculations
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string, isCompleted: boolean) => {
    try {
      const updated = await db.toggleGoalMilestone(milestoneId, !isCompleted);
      setMilestonesMap(prev => ({
        ...prev,
        [goalId]: prev[goalId].map(ms => ms.id === milestoneId ? updated : ms)
      }));
      
      // Auto complete goal if all milestones are complete
      const msList = milestonesMap[goalId].map(ms => ms.id === milestoneId ? updated : ms);
      const allDone = msList.length > 0 && msList.every(m => m.is_completed);
      const targetGoal = goals.find(g => g.id === goalId);
      
      if (allDone && targetGoal && targetGoal.status !== 'Completed') {
        await db.updateGoal(goalId, { status: 'Completed' });
      } else if (!allDone && targetGoal && targetGoal.status === 'Completed') {
        await db.updateGoal(goalId, { status: 'InProgress' });
      }

      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMilestone = async (goalId: string, milestoneId: string) => {
    try {
      await db.deleteGoalMilestone(milestoneId);
      setMilestonesMap(prev => ({
        ...prev,
        [goalId]: prev[goalId].filter(ms => ms.id !== milestoneId)
      }));
      loadGoalsData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category);
    setTargetDate(goal.target_date);
    setGoalStatus(goal.status);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(categories[0] || null);
    setTargetDate('');
    setGoalStatus('InProgress');
  };

  const getGoalProgress = (goalId: string) => {
    const msList = milestonesMap[goalId] || [];
    if (msList.length === 0) {
      const goal = goals.find(g => g.id === goalId);
      return goal?.status === 'Completed' ? 100 : 0;
    }
    const doneCount = msList.filter(m => m.is_completed).length;
    return Math.round((doneCount / msList.length) * 100);
  };

  if (loading && goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading active goals checklist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
            Life Goals
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure high-level personal goals, add milestone targets, and manage growth.
          </p>
        </div>

        <button 
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid list */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="py-20 text-center glass-panel bg-card border border-border rounded-3xl">
            <Target size={32} className="text-muted-foreground/40 mx-auto mb-3 animate-bounce" />
            <p className="text-xs text-muted-foreground">You haven&apos;t set any life goals yet!</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Start by creating a goal in Deen, Health, Career, or Finance.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;
            const progress = getGoalProgress(goal.id);
            const mList = milestonesMap[goal.id] || [];
            
            // Category theme colors
            const cColor = goal.category === 'Deen' ? 'bg-emerald-500 text-emerald-500' :
              goal.category === 'Health' ? 'bg-pink-500 text-pink-500' :
              goal.category === 'Education' ? 'bg-blue-500 text-blue-500' :
              goal.category === 'Career' ? 'bg-cyan-500 text-cyan-500' :
              goal.category === 'Finance' ? 'bg-amber-500 text-amber-500' :
              'bg-purple-500 text-purple-500';

            return (
              <div 
                key={goal.id}
                className="rounded-3xl glass-panel bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Main goals banner */}
                <div 
                  onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border">
                        <Target size={16} className={`${cColor.split(' ')[1]}`} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-foreground leading-none">{goal.title}</h4>
                        {goal.category && (
                          <span className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground mt-1.5 block">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground max-w-2xl leading-relaxed pl-1">
                      {goal.description}
                    </p>
                  </div>

                  {/* Status checklist bars */}
                  <div className="flex items-center gap-5 w-full md:w-auto flex-wrap md:flex-nowrap border-t border-border/40 pt-3 md:pt-0 md:border-0 pl-1">
                    {/* Progress Bar */}
                    <div className="w-full md:w-44 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/60 uppercase">
                        <span>Milestones Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted border border-border/60 overflow-hidden w-full">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${cColor.split(' ')[0]}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar size={12} />
                      <span>{goal.target_date}</span>
                    </div>

                    {/* Expand Collapse Indicators */}
                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGoalComplete(goal);
                        }}
                        className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          goal.status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow shadow-emerald-500/10'
                            : 'border-border bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        title={goal.status === 'Completed' ? 'Mark In Progress' : 'Mark Completed'}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(goal);
                        }}
                        className="p-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="Edit Goal"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGoal(goal.id);
                        }}
                        className="p-1.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="p-1 text-muted-foreground">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sub Panel: Expandable milestones checklist */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <h5 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest pl-1">
                      Checklist Milestones ({mList.filter(m => m.is_completed).length} / {mList.length})
                    </h5>

                    {/* Milestones checklist */}
                    <div className="space-y-2 max-w-xl">
                      {mList.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/60 italic pl-1">No milestones added yet. Create targets below to track progress.</p>
                      ) : (
                        mList.map((ms) => (
                          <div 
                            key={ms.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/65 group"
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={ms.is_completed}
                                onChange={() => handleToggleMilestone(goal.id, ms.id, ms.is_completed)}
                                className="w-4 h-4 rounded border-border text-emerald-500 bg-background cursor-pointer focus:ring-emerald-500"
                              />
                              <span className={`text-xs truncate font-medium ${
                                ms.is_completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {ms.title}
                              </span>
                            </label>
                            
                            <button 
                              onClick={() => handleDeleteMilestone(goal.id, ms.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                              title="Delete Milestone"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Milestone input box */}
                    <form 
                      onSubmit={(e) => handleAddMilestone(goal.id, e)}
                      className="flex items-center gap-2 max-w-xl pt-2"
                    >
                      <input
                        type="text"
                        placeholder="Add a milestone target..."
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-border rounded-xl bg-card/85 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-[10px] rounded-xl hover:bg-primary/95 transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <Plus size={10} />
                        <span>Add</span>
                      </button>
                    </form>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ============================================================================
          Dialog: Add Goal
          ============================================================================ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Target size={16} className="text-amber-500" />
                <span>Set Life Goal</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Complete Memorization of Juz 30..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Description Notes
                </label>
                <textarea
                  placeholder="What is the purpose or plan for this target?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2.5}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Category
                  </label>
                  <select
                    value={category || ''}
                    onChange={(e: any) => setCategory(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="">Uncategorized</option>
                  </select>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                    Tip: You can manage and create custom categories in the Profile settings tab.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  />
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Edit Goal
          ============================================================================ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-amber-500" />
                <span>Edit Goal</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Description Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2.5}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Category
                  </label>
                  <select
                    value={category || ''}
                    onChange={(e: any) => setCategory(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="">Uncategorized</option>
                  </select>
                  <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                    Tip: You can manage and create custom categories in the Profile settings tab.
                  </span>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Status
                  </label>
                  <select
                    value={goalStatus}
                    onChange={(e: any) => setGoalStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
