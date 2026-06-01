'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, Check, CheckSquare } from 'lucide-react';
import { db, Notification } from '@/lib/supabase/client';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ setSidebarOpen }: NavbarProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpenNoti, setIsOpenNoti] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Page Title
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'LifeHub Dashboard';
      case '/prayers': return 'Islamic Prayer Tracker';
      case '/habits': return 'Daily Habits Tracker';
      case '/tasks': return 'Productive Task Board';
      case '/goals': return 'Life Goals & Milestones';
      case '/journal': return 'Reflective Diary Journal';
      case '/analytics': return 'Comprehensive Analytics';
      case '/profile': return 'User Profile & Control';
      default: return 'LifeHub';
    }
  };

  // Fetch Notifications
  const loadNotifications = async () => {
    try {
      const data = await db.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close notifications
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenNoti(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-global-search'));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b glass-panel border-border bg-background/60">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button 
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <h1 className="font-bold text-base md:text-lg tracking-tight text-foreground">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search Input + Notification Tray */}
      <div className="flex items-center gap-3">
        {/* Glass Search Trigger */}
        <button 
          onClick={handleSearchClick}
          className="hidden md:flex items-center gap-2.5 w-60 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 text-left bg-muted/20"
        >
          <Search size={14} className="text-muted-foreground/60" />
          <span className="flex-1">Search anything...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono leading-none tracking-normal">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button 
          onClick={handleSearchClick}
          className="flex md:hidden p-2 rounded-xl text-muted-foreground hover:bg-muted"
        >
          <Search size={20} />
        </button>

        {/* Notifications Dropdown Tray */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpenNoti(!isOpenNoti)}
            className={`relative p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors ${
              unreadCount > 0 ? 'text-primary' : ''
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
            )}
          </button>

          {/* Tray Panel */}
          {isOpenNoti && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl z-50 glass-panel animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <p className="text-xs text-muted-foreground">All caught up! No notifications.</p>
                  </div>
                ) : (
                  notifications.map((noti) => (
                    <div 
                      key={noti.id} 
                      className={`flex gap-3.5 p-4 hover:bg-muted/30 transition-colors ${
                        !noti.read ? 'bg-muted/10 font-medium' : ''
                      }`}
                    >
                      {/* Notification Icons */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          noti.type === 'prayer' ? 'bg-emerald-500/10 text-emerald-500' :
                          noti.type === 'habit' ? 'bg-pink-500/10 text-pink-500' :
                          noti.type === 'task' ? 'bg-indigo-500/10 text-indigo-500' :
                          noti.type === 'goal' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          <CheckSquare size={14} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{noti.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{noti.message}</p>
                        <p className="text-[9px] text-muted-foreground/50 mt-1">
                          {new Date(noti.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {!noti.read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(noti.id, e)}
                          className="flex-shrink-0 self-center p-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
