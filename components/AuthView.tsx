import React, { useState } from 'react';
import { SparklesIcon, LoaderIcon } from './icons';
import { registerUser, loginUser } from '../services/authService';

export const AuthView: React.FC<{
  onAuthSuccess: (token: string, user: any) => void;
}> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(email, password);
        onAuthSuccess(data.token, null); // user info normally comes after /user fetch but token relies on App
      } else {
        const data = await registerUser(name, email, password);
        onAuthSuccess(data.token, null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-fade-in p-4">
      <div className="w-full max-w-md glass-card rounded-[2.5rem] border border-white/10 shadow-2xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 transform translate-x-1/2 -translate-y-1/2 rotate-12 opacity-10 pointer-events-none">
          <SparklesIcon className="w-64 h-64 text-indigo-500" />
        </div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3 mb-4 bg-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 font-medium mt-2">
            {isLogin
              ? 'Sign in to access your smart wardrobe'
              : 'Join Clothe.AI to revolutionize your style'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {!isLogin && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-4 bg-slate-900/40 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">
              {isLogin ? 'Email Address or Username' : 'Email Address'}
            </label>
            <input
              type={isLogin ? 'text' : 'email'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isLogin ? 'you@example.com or Username' : 'you@example.com'}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full p-4 bg-slate-900/40 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full p-4 bg-slate-900/40 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center p-4 rounded-xl text-white font-black bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center z-10 relative">
          <p className="text-slate-400 font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-indigo-400 font-black hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
