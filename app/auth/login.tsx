'use client'

import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


// Poppins in globals.css:
// @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
// html, body { font-family: 'Poppins', sans-serif; }

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://nvccz-pi.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userID', data.user.id);
        console.log(data.token,data.user.id )
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ===== Background Layer ===== */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background image with subtle zoom/fade (Ken Burns) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 -z-10"
        >
          <Image
            src="/login/bg-login.png"  // ← update extension if needed
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        {/* Blue/Gray gradient overlay with slow ambient movement */}
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.8 }}
          style={{
            background:
              'linear-gradient(135deg, rgba(0,86,164,0.45), rgba(203,213,225,0.55))',
          }}
        />
        <div className="absolute inset-0 -z-10 pointer-events-none animate-slow-shift"
             style={{
               background:
                 'radial-gradient(1200px 600px at 80% 20%, rgba(0,86,164,0.18), transparent 60%), radial-gradient(1000px 500px at 10% 90%, rgba(148,163,184,0.22), transparent 60%)'
             }}
        />

        {/* ===== Content Layer ===== */}
        <div className="flex items-center justify-center min-h-screen p-4 font-poppins">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div
              className="p-8 rounded-2xl shadow-xl backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-light text-black mb-2 tracking-wide">
                  Welcome
                </h1>
                <p className="text-lg text-gray-700">
                  Sign in to your NVCCZ account
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-gray-200 text-gray-800 rounded-lg text-base"
                >
                  {error}
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <label htmlFor="email" className="block text-lg font-light text-black mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-100 border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0056A4] focus:border-transparent transition"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                  <label htmlFor="password" className="block text-lg font-light text-black mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-100 border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0056A4] focus:border-transparent transition"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </motion.div>

                {/* Remember + Forgot */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 rounded bg-gray-200 border-gray-500 text-[#0056A4] focus:ring-[#0056A4]"
                    />
                    <span className="text-base text-gray-700">Remember me</span>
                  </label>
                  <div className="text-base">
                    <Link href="/forgot-password" className="font-medium text-[#0056A4] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </motion.div>

                {/* Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-lg font-semibold text-white bg-[#0056A4] hover:bg-[#064f94] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0056A4] transition-colors duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </motion.div>
              </form>

              {/* Signup link */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-6 text-center">
                <p className="text-lg text-gray-700">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/register" className="font-medium text-[#0056A4] hover:underline">
                    Sign up
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Local styles for background animation */}
        <style jsx>{`
          @keyframes slowShift {
            0%   { transform: translate3d(0,0,0); }
            50%  { transform: translate3d(-1.5%, -1.5%, 0); }
            100% { transform: translate3d(0,0,0); }
          }
          .animate-slow-shift {
            animation: slowShift 18s ease-in-out infinite;
          }
        `}</style>
      </div>
    </>
  );
};

export default LoginPage;
