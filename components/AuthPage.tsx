import React, { useState } from 'react';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface AuthPageProps {
  onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    const users = getUsers();
    
    if (isLogin) {
      // Handle Login
      const user = users[username];
      if (user && user.passwordHash === encodePassword(password)) {
        onLogin(username);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      // Handle Signup
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-primary mb-2">Daily Transactions</h1>
        <p className="text-center text-slate-500 mb-8">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
            }}
            className="font-semibold text-primary hover:underline ml-1"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
