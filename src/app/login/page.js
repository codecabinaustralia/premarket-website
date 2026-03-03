'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/clientApp';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'reset'

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      console.error('Reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.');
      } else {
        setResetError('Something went wrong. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const switchToReset = () => {
    setView('reset');
    setResetEmail(email);
    setResetError('');
    setResetSent(false);
  };

  const switchToLogin = () => {
    setView('login');
    setError('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {view === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Welcome Back
                </h1>
                <p className="text-slate-400 text-lg">
                  Sign in to your Premarket account
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      placeholder="john@agency.com.au"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={switchToReset}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold text-xl rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing In...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Don&apos;t have an account?{' '}
                    <Link href="/join" className="text-orange-600 hover:underline font-medium">
                      Sign up free
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Reset Password
                </h1>
                <p className="text-slate-400 text-lg">
                  {resetSent
                    ? 'Check your email for a reset link'
                    : 'Enter your email to receive a reset link'}
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-900 font-semibold text-lg mb-2">Email sent</p>
                    <p className="text-slate-500 text-sm mb-6">
                      We&apos;ve sent a password reset link to <strong className="text-slate-700">{resetEmail}</strong>. Check your inbox and follow the instructions.
                    </p>
                    <button
                      onClick={switchToLogin}
                      className="w-full py-4 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold text-xl rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-900 text-lg"
                        placeholder="john@agency.com.au"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    {resetError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                      >
                        {resetError}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={resetLoading}
                      whileHover={{ scale: resetLoading ? 1 : 1.02 }}
                      whileTap={{ scale: resetLoading ? 1 : 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold text-xl rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </motion.button>
                  </form>
                )}

                {!resetSent && (
                  <div className="mt-6">
                    <button
                      onClick={switchToLogin}
                      className="flex items-center justify-center gap-2 w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
