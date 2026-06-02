'use client';

import React, { useState, useEffect } from 'react';
import { 
  ListTodo, 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  X, 
  Edit2, 
  ArrowRight,
  Filter,
  Kanban,
  List
} from 'lucide-react';
import { db, Task } from '@/lib/supabase/client';
import { toLocalDateString } from '@/lib/utils/date';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Task['category']>('Personal');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<Task['recurring_pattern']>(null);

  const todayStr = toLocalDateString();

  useEffect(() => {
    loadTasksData();
  }, []);

  const loadTasksData = async () => {
    try {
      setLoading(true);
      const data = await db.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await db.createTask(
        title, 
        description, 
        category, 
        priority, 
        dueDate || null,
        isRecurring,
        isRecurring ? recurringPattern : null
      );
      setIsAddOpen(false);
      resetForm();
      loadTasksData();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Task
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !title.trim()) return;

    try {
      await db.updateTask(editingTask.id, {
        title,
        description,
        category,
        priority,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurring_pattern: isRecurring ? recurringPattern : null
      });
      setIsEditOpen(false);
      setEditingTask(null);
      resetForm();
      loadTasksData();
    } catch (err) {
      console.error(err);
    }
  };

  // Update Status directly (used for Drag & Drop or quick check-ins)
  const handleStatusChange = async (taskId: string, targetStatus: Task['status']) => {
    // Optimistic UI updates
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await db.updateTask(taskId, { status: targetStatus });
      loadTasksData(); // refresh full list in case a recurring task was cloned!
    } catch (err) {
      console.error(err);
      loadTasksData();
    }
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await db.deleteTask(taskToDelete);
      loadTasksData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.due_date || '');
    setIsRecurring(task.is_recurring);
    setRecurringPattern(task.recurring_pattern);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setPriority('Medium');
    setDueDate('');
    setIsRecurring(false);
    setRecurringPattern(null);
  };

  // -------------------------------------------------------------
  // HTML5 Native Drag & Drop Handlers
  // -------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      handleStatusChange(taskId, targetStatus);
    }
  };

  // -------------------------------------------------------------
  // Filter & Sorting Logic
  // -------------------------------------------------------------
  const filteredTasks = tasks.filter(t => {
    const catMatch = filterCategory === 'All' || t.category === filterCategory;
    const priMatch = filterPriority === 'All' || t.priority === filterPriority;
    return catMatch && priMatch;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'Todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'InProgress');
  const completedTasks = filteredTasks.filter(t => t.status === 'Done');

  const categories = ['Personal', 'Study', 'Work', 'Islamic', 'Family'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  if (loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading task checklist board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl tracking-tight text-foreground">
            Task Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize personal, study, work, and islamic goals via board or checklist formats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle view mode buttons */}
          <div className="flex items-center rounded-xl bg-muted/40 border border-border p-1">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Kanban Board"
            >
              <Kanban size={15} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Checklist List"
            >
              <List size={15} />
            </button>
          </div>

          <button 
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Options toolbar */}
      <div className="p-4 rounded-2xl glass-panel bg-card border border-border flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Filter size={14} />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Priority</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none"
            >
              <option value="All">All Priorities</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          VIEW: Kanban Board
          ------------------------------------------------------------- */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Todo */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Todo')}
            className="p-4 rounded-3xl glass-panel bg-muted/5 border border-border/80 shadow-sm space-y-4 min-h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 block" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Todo</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {todoTasks.map(t => <TaskCard key={t.id} task={t} onDragStart={handleDragStart} onEdit={openEditDialog} onDelete={handleDeleteTask} onCheck={handleStatusChange} />)}
              {todoTasks.length === 0 && <EmptyColumn placeholder="No todo tasks" />}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'InProgress')}
            className="p-4 rounded-3xl glass-panel bg-muted/5 border border-border/80 shadow-sm space-y-4 min-h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block shadow shadow-blue-500/20 animate-pulse" />
                <span className="font-extrabold text-xs uppercase tracking-wider">In Progress</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {inProgressTasks.map(t => <TaskCard key={t.id} task={t} onDragStart={handleDragStart} onEdit={openEditDialog} onDelete={handleDeleteTask} onCheck={handleStatusChange} />)}
              {inProgressTasks.length === 0 && <EmptyColumn placeholder="No active tasks" />}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'Done')}
            className="p-4 rounded-3xl glass-panel bg-muted/5 border border-border/80 shadow-sm space-y-4 min-h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow shadow-emerald-500/20" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Completed</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {completedTasks.map(t => <TaskCard key={t.id} task={t} onDragStart={handleDragStart} onEdit={openEditDialog} onDelete={handleDeleteTask} onCheck={handleStatusChange} />)}
              {completedTasks.length === 0 && <EmptyColumn placeholder="No completed tasks" />}
            </div>
          </div>

        </div>
      ) : (
        /* -------------------------------------------------------------
            VIEW: Checklist List View
            ============================================================= */
        <div className="p-6 rounded-3xl glass-panel bg-card border border-border shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isDone = t.status === 'Done';
                    return (
                      <tr key={t.id} className={`hover:bg-muted/10 transition-colors ${isDone ? 'opacity-60' : ''}`}>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleStatusChange(t.id, isDone ? 'Todo' : 'Done')}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border mx-auto transition-all ${
                              isDone 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-border bg-background text-transparent hover:border-emerald-500'
                            }`}
                          >
                            <Check size={11} className="stroke-[3.5]" />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <p className={`text-xs ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-normal truncate max-w-sm">
                            {t.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold uppercase tracking-wider">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            t.priority === 'Urgent' ? 'text-red-500' :
                            t.priority === 'High' ? 'text-orange-500' :
                            t.priority === 'Medium' ? 'text-blue-500' :
                            'text-slate-500'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {t.due_date ? (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar size={12} />
                              <span>{t.due_date}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex gap-2 items-center justify-center">
                            <button onClick={() => openEditDialog(t)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Edit">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => handleDeleteTask(t.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Add Task
          ============================================================================ */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-500" />
                <span>Create New Task</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Description
                </label>
                <textarea
                  placeholder="Supporting notes regarding this task"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Recurring Task
                  </label>
                  <div className="flex gap-2 items-center pt-2">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">Enable</span>
                  </div>
                </div>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Recurrence Pattern
                  </label>
                  <select
                    value={recurringPattern || 'daily'}
                    onChange={(e: any) => setRecurringPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

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
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          Dialog: Edit Task
          ============================================================================ */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel bg-card border border-border shadow-2xl animate-in scale-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-indigo-500" />
                <span>Edit Task Details</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                  Task Title
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
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Recurring Task
                  </label>
                  <div className="flex gap-2 items-center pt-2">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">Enable</span>
                  </div>
                </div>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-0.5">
                    Recurrence Pattern
                  </label>
                  <select
                    value={recurringPattern || 'daily'}
                    onChange={(e: any) => setRecurringPattern(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-muted/10 text-xs focus:outline-none text-foreground"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

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
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
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
              <h3 className="font-extrabold text-sm text-foreground">Delete Task</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this task?
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 border border-border bg-muted/10 hover:bg-muted text-xs font-semibold rounded-xl text-muted-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
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

// -------------------------------------------------------------
// Component: Kanban Task Card
// -------------------------------------------------------------
interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCheck: (id: string, nextStatus: Task['status']) => void;
}

function TaskCard({ task, onDragStart, onEdit, onDelete, onCheck }: TaskCardProps) {
  const isDone = task.status === 'Done';

  return (
    <div
      draggable={!isDone}
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`p-4 rounded-2xl glass-panel bg-card border border-border flex flex-col gap-3.5 shadow-sm hover:shadow transition-all relative group cursor-grab active:cursor-grabbing ${
        isDone ? 'opacity-65' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <h4 className={`text-xs font-bold text-foreground leading-snug ${
            isDone ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.title}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1 leading-normal line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Check Button */}
        <button
          onClick={() => onCheck(task.id, isDone ? 'Todo' : 'Done')}
          className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 transition-all cursor-pointer ${
            isDone 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow shadow-emerald-500/20' 
              : 'border-border bg-background text-transparent hover:border-emerald-500'
          }`}
          title={isDone ? 'Mark Todo' : 'Mark Completed'}
        >
          <Check size={11} className="stroke-[3.5]" />
        </button>
      </div>

      {/* Metadata footer */}
      <div className="flex items-center justify-between border-t border-border/80 pt-2.5 text-[9px] font-semibold text-muted-foreground">
        
        {/* Due Date */}
        {task.due_date ? (
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-zinc-400" />
            <span className={new Date(task.due_date) < new Date() && !isDone ? 'text-red-500' : ''}>
              {task.due_date}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/30">No due date</span>
        )}

        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.2 rounded bg-muted border border-border/60 text-[8px] font-bold uppercase tracking-wider">
            {task.category}
          </span>
          <span className={`text-[8px] font-bold uppercase tracking-wider ${
            task.priority === 'Urgent' ? 'text-red-500' :
            task.priority === 'High' ? 'text-orange-500' :
            task.priority === 'Medium' ? 'text-blue-500' :
            'text-slate-500'
          }`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Hover action menu overlay */}
      <div className="absolute top-2.5 right-2 px-1.5 py-0.5 rounded-lg bg-card border border-border flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(task)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit">
          <Edit2 size={10} />
        </button>
        <button onClick={() => onDelete(task.id)} className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-muted" title="Delete">
          <Trash2 size={10} />
        </button>
      </div>

    </div>
  );
}

// Helper Components
function EmptyColumn({ placeholder }: { placeholder: string }) {
  return (
    <div className="border border-dashed border-border/60 rounded-2xl py-12 text-center text-[10px] font-medium text-muted-foreground/50">
      {placeholder}
    </div>
  );
}
