'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Flame, 
  ListTodo, 
  Target, 
  BookOpen, 
  BarChart3, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Sparkles,
  Compass
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { db, Profile, isCloudMode, supabase } from '@/lib/supabase/client';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await db.getProfile();
        setProfile(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (isCloudMode && supabase) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem('lifehub_session');
      }
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-500 dark:text-blue-400' },
    { name: 'Prayers', href: '/prayers', icon: Compass, color: 'text-emerald-500 dark:text-emerald-400' },
    { name: 'Habits', href: '/habits', icon: Flame, color: 'text-pink-500 dark:text-pink-400' },
    { name: 'Tasks', href: '/tasks', icon: ListTodo, color: 'text-indigo-500 dark:text-indigo-400' },
    { name: 'Goals', href: '/goals', icon: Target, color: 'text-amber-500 dark:text-amber-400' },
    { name: 'Journal', href: '/journal', icon: BookOpen, color: 'text-purple-500 dark:text-purple-400' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, color: 'text-cyan-500 dark:text-cyan-400' },
    { name: 'Profile', href: '/profile', icon: User, color: 'text-slate-500 dark:text-slate-400' },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r transition-transform duration-300 ease-in-out lg:translate-x-0 glass-panel border-border bg-background/90 lg:bg-background/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black shadow-md shadow-primary/20">
              LH
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
                LifeHub
              </span>
              <span className="text-[10px] block font-medium text-emerald-500 dark:text-emerald-400 tracking-wider uppercase leading-none">
                Operating System
              </span>
            </div>
          </Link>
          <button 
            className="p-1 rounded-md hover:bg-muted text-muted-foreground lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-current' : item.color
                  } group-hover:scale-105 duration-200`} 
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings / Profile */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
              <span>Theme</span>
            </div>
            <span className="text-xs text-muted-foreground/60 capitalize">{theme} mode</span>
          </button>

          {/* User Section */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-semibold text-sm shadow-sm flex-shrink-0">
              {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground leading-tight">
                {profile?.name || 'Brother Farhan'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {isCloudMode ? (profile?.email || 'Cloud Sync Mode') : 'Local Dev Mode'}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
