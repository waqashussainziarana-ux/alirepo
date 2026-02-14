
import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { cloudGetUsers, cloudSaveUsers, isVercelEnabled } from '../services/vercelDb';

interface AuthPageProps {
  onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const encodePassword = (pass: string) => btoa(pass);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      setLoading(false);
      return;
    }

    try {
      const users = isVercelEnabled() 
        ? await cloudGetUsers() 
        : JSON.parse(localStorage.getItem('daily-transactions-users') || '{}');

      const user = users[username.toLowerCase().trim()];
      if (user && user.passwordHash === encodePassword(password)) {
        onLogin(username);
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername || !password.trim()) {
      setError('Username and password are required.');
      setLoading(false);
      return;
    }
    
    try {
      const users = isVercelEnabled() 
        ? await cloudGetUsers() 
        : JSON.parse(localStorage.getItem('daily-transactions-users') || '{}');
      
      if (users[cleanUsername]) {
        setError('Username already exists.');
        setLoading(false);
        return;
      }

      const newUsers = {
        ...users,
        [cleanUsername]: { passwordHash: encodePassword(password) }
      };

      if (isVercelEnabled()) {
        await cloudSaveUsers(newUsers);
      } else {
        localStorage.setItem('daily-transactions-users', JSON.stringify(newUsers));
      }

      onLogin(username);
    } catch (err) {
      setError('Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername || !password.trim()) {
      setError('Username and new password are required.');
      setLoading(false);
      return;
    }

    try {
      const users = isVercelEnabled() 
        ? await cloudGetUsers() 
        : JSON.parse(localStorage.getItem('daily-transactions-users') || '{}');

      if (!users[cleanUsername]) {
        setError('Username not found. Check spelling.');
        setLoading(false);
        return;
      }

      const newUsers = {
        ...users,
        [cleanUsername]: { passwordHash: encodePassword(password) }
      };

      if (isVercelEnabled()) {
        await cloudSaveUsers(newUsers);
      } else {
        localStorage.setItem('daily-transactions-users', JSON.stringify(newUsers));
      }

      alert('Password updated successfully! Logging you in...');
      onLogin(username);
    } catch (err) {
      setError('Could not reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary mb-2">Daily Transactions</h1>
        <p className="text-center text-slate-500 mb-8">
          {view === 'login' && 'Welcome back!'}
          {view === 'signup' && 'Create your account'}
          {view === 'forgot' && 'Reset your password'}
        </p>
        
        {!isVercelEnabled() && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 font-bold uppercase text-center">
            ⚠ Supabase not connected. Using local device storage.
          </div>
        )}

        {view === 'forgot' && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 font-bold uppercase text-center">
            Enter your username to set a new password.
          </div>
        )}

        <form 
          onSubmit={
            view === 'login' ? handleLoginSubmit : 
            view === 'signup' ? handleSignupSubmit : 
            handleResetSubmit
          } 
          className="space-y-4"
        >
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="Username"
              required
              disabled={loading}
              autoFocus={view === 'forgot'}
            />
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder={view === 'forgot' ? 'New Password' : 'Password'}
              required
              disabled={loading}
            />
          </div>

          {view === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); }}
                className="text-xs text-primary hover:underline font-bold"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && <p className="text-sm text-danger text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {view === 'login' && 'Login'}
            {view === 'signup' && 'Sign Up'}
            {view === 'forgot' && 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(''); }}
            className="w-full text-sm text-slate-500 hover:text-primary transition-colors font-medium"
          >
            {view === 'login' ? "Don't have an account? Sign Up" : 
             view === 'signup' ? "Already have an account? Login" : 
             "Wait, I remember it! Login"}
          </button>
          
          {view === 'forgot' && (
            <button
              onClick={() => { setView('signup'); setError(''); }}
              className="w-full text-sm text-slate-400 hover:text-primary transition-colors font-medium"
            >
              Need a new account? Sign Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
