'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { isCloudMode, supabase } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isCloudMode && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/login');
            return;
          }
        } else {
          const session = localStorage.getItem('lifehub_session');
          if (session !== 'authenticated') {
            router.push('/login');
            return;
          }
        }
        setAuthLoading(false);
      } catch (err) {
        console.error('Auth guard redirection:', err);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-foreground flex flex-col items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-xs text-muted-foreground mt-3 font-semibold tracking-wider">Verifying LifeHub Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content grid */}
      <div className="lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
        {/* Sticky Header Top Bar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Dynamic page contents wrapper */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
