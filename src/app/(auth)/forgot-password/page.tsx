'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { isCloudMode, supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isCloudMode && supabase) {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) throw error;
        setSuccessMsg('A password reset link has been sent to your email address.');
      } else {
        setErrorMsg('Password recovery is only available in cloud/online mode.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while requesting password reset.');
    } finally {
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
            Recover Password
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {/* Offline mode warning */}
        {!isCloudMode ? (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs space-y-3">
            <div className="flex gap-2.5 items-center">
              <Sparkles size={16} className="flex-shrink-0 animate-pulse" />
              <span className="font-bold">Offline/Local Mode Active</span>
            </div>
            <p className="leading-relaxed text-[11px] text-muted-foreground">
              Password recovery is only available when online cloud database mode is configured. Since you are in local mode, you can log in with any email and password instantly.
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

            {/* Forgot Password Form */}
            <form onSubmit={handleResetRequest} className="space-y-4">
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

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                ) : (
                  <span>Send Reset Link</span>
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
