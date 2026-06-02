'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { isCloudMode, supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isCloudMode && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        if (error) throw error;
        
        setSuccessMsg('Your password has been reset successfully! Redirecting to login page...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrorMsg('Password reset is only available in cloud/online mode.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while resetting your password.');
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
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 mb-4">
            LH
          </div>
          <h2 className="font-bold text-2xl tracking-tight text-foreground bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
            Set New Password
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a strong password to protect your account.
          </p>
        </div>

        {/* Offline mode check */}
        {!isCloudMode ? (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs space-y-3">
            <div className="flex gap-2.5 items-center">
              <Sparkles size={16} className="flex-shrink-0 animate-pulse" />
              <span className="font-bold">Offline/Local Mode Active</span>
            </div>
            <p className="leading-relaxed text-[11px] text-muted-foreground">
              Password modification is disabled in offline mode. Local mode allows logging in with any credentials instantly.
            </p>
            <div className="pt-1">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg font-bold text-[10px] shadow hover:bg-amber-600 transition-all"
              >
                <ArrowLeft size={10} />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
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

            {/* Reset Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  New Password
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

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>

            {/* Footer Toggle */}
            <div className="mt-8 text-center border-t border-border/80 pt-6">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                <ArrowLeft size={14} />
                <span>Back to Login</span>
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
