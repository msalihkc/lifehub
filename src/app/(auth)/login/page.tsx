'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { isCloudMode, supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isCloudMode && supabase) {
        // Supabase Cloud Authenticator
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        setSuccessMsg('Successfully authenticated! Syncing data...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        // Local Mode Authenticator (Instant Success)
        setSuccessMsg('Offline Mode Activated. Welcome back, Farhan!');
        localStorage.setItem('lifehub_session', 'authenticated');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl -z-10" />

      {/* Main card panel */}
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-border bg-card shadow-2xl relative">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 mb-4 animate-bounce">
            LH
          </div>
          <h2 className="font-bold text-2xl tracking-tight text-foreground bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
            Welcome back to LifeHub
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to access your prayers, tasks, and journals.
          </p>
        </div>

        {/* Local mode banner */}
        {!isCloudMode && (
          <div className="mb-6 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs flex gap-2.5 items-center">
            <Sparkles size={16} className="flex-shrink-0 animate-pulse" />
            <span>
              <strong>Local Mode Enabled</strong>: Login instantly with any credentials to explore offline.
            </span>
          </div>
        )}

        {/* Notifications boxes */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex gap-2.5 items-center">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs flex gap-2.5 items-center">
            <CheckCircle size={16} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-muted/20 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Form Options */}
          <div className="flex items-center justify-between text-xs py-1">
            <label className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary bg-background w-4 h-4 cursor-pointer"
              />
              <span>Remember Me</span>
            </label>
            
            <button
              type="button"
              onClick={() => alert('Offline Mode password recovery: Use any email and password to log in instantly!')}
              className="font-semibold text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-8 text-center border-t border-border/80 pt-6">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
