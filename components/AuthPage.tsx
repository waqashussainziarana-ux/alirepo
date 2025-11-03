import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface AuthPageProps {
  onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Common state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot Password state
  const [resetStep, setResetStep] = useState(1);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  const USERS_KEY = 'daily-transactions-users';

  // NOTE: In a real-world app, NEVER store passwords like this.
  // This should be handled by a secure backend with proper hashing (e.g., bcrypt).
  // Using base64 for simple obfuscation in this client-only example.
  const encodePassword = (pass: string) => btoa(pass);

  const getUsers = (): Record<string, { passwordHash: string }> => {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : {};
    } catch {
      return {};
    }
  };
  
  const resetFormState = () => {
      setUsername('');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    const users = getUsers();
    const user = users[username];
    if (user && user.passwordHash === encodePassword(password)) {
      onLogin(username);
    } else {
      setError('Invalid username or password.');
    }
  };
  
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    
    const users = getUsers();
    
    if (users[username]) {
      setError('Username already exists. Please choose another one.');
      return;
    }
    const newUsers = {
      ...users,
      [username]: { passwordHash: encodePassword(password) }
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    onLogin(username); // Auto-login after signup
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetStep === 1) {
      const users = getUsers();
      if(users[resetUsername]) {
        setResetStep(2);
      } else {
        setError('Username not found.');
      }
    } else {
      if(newPassword.length < 1) {
        setError('Password cannot be empty.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      
      const users = getUsers();
      users[resetUsername] = { passwordHash: encodePassword(newPassword) };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      setSuccess('Password has been reset successfully. Please log in.');
      setView('login');
      resetFormState();
      setUsername(resetUsername); // Pre-fill username for convenience
      setResetUsername('');
      setResetStep(1);
    }
  };
  
  const renderLogin = () => (
    <>
      <p className="text-center text-slate-500 mb-8">Welcome back!</p>
      {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md text-center mb-4">{success}</p>}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="sr-only">Username</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="Username"
              required
              autoComplete="username"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password"  className="sr-only">Password</label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="text-right mt-1">
            <button
                type="button"
                onClick={() => { setView('forgot'); resetFormState(); }}
                className="text-xs font-semibold text-primary hover:underline"
            >
                Forgot Password?
            </button>
          </div>
        </div>
        
        {error && <p className="text-sm text-danger text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors"
        >
          Login
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?
        <button
          onClick={() => { setView('signup'); resetFormState(); }}
          className="font-semibold text-primary hover:underline ml-1"
        >
          Sign Up
        </button>
      </p>
    </>
  );

  const renderSignup = () => (
    <>
      <p className="text-center text-slate-500 mb-8">Create your account</p>
      <form onSubmit={handleSignupSubmit} className="space-y-4">
        <div>
            <label htmlFor="username-signup" className="sr-only">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="username-signup"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Username"
                required
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password-signup"  className="sr-only">Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password-signup"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="Password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors"
        >
          Sign Up
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?
        <button
          onClick={() => { setView('login'); resetFormState(); }}
          className="font-semibold text-primary hover:underline ml-1"
        >
          Login
        </button>
      </p>
    </>
  );

  const renderForgotPassword = () => (
    <>
       <p className="text-center text-slate-500 mb-8">Reset your password</p>
       <form onSubmit={handleForgotSubmit} className="space-y-4">
        {resetStep === 1 ? (
             <div>
                <label htmlFor="reset-username" className="sr-only">Username</label>
                <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    id="reset-username"
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Enter your username"
                    required
                />
                </div>
            </div>
        ) : (
            <>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-xs text-yellow-800">
                        <span className="font-bold">Security Warning:</span> This is an insecure password reset. In a real app, a link would be sent to your email. Anyone with access to this device can reset your password.
                    </p>
                </div>
                <p className="text-sm text-slate-600">Enter a new password for <span className="font-bold">{resetUsername}</span>.</p>
                <div>
                    <label htmlFor="new-password"  className="sr-only">New Password</label>
                    <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                        placeholder="New Password"
                        required
                        autoComplete="new-password"
                    />
                    </div>
                </div>
                <div>
                    <label htmlFor="confirm-password"  className="sr-only">Confirm New Password</label>
                    <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                        placeholder="Confirm New Password"
                        required
                        autoComplete="new-password"
                    />
                    </div>
                </div>
            </>
        )}
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors"
        >
          {resetStep === 1 ? 'Next' : 'Reset Password'}
        </button>
       </form>
       <p className="text-center text-sm text-slate-500 mt-6">
          Remember your password?
          <button
            onClick={() => { setView('login'); resetFormState(); }}
            className="font-semibold text-primary hover:underline ml-1"
          >
            Back to Login
          </button>
        </p>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary mb-2">Daily Transactions</h1>
        {view === 'login' && renderLogin()}
        {view === 'signup' && renderSignup()}
        {view === 'forgot' && renderForgotPassword()}
      </div>
    </div>
  );
};

export default AuthPage;
