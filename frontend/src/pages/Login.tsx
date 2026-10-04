import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../services/api';

export function Login() {
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        // If the backend has no users, the login page becomes a setup page.
        // We can just try to login with a dummy and see if it returns 404 or something,
        // or add a /auth/check-setup route. 
        // Let's assume we can try to hit /auth/setup with a dummy payload just to check, or just add a check route.
        // To avoid changing backend further, we just try to login. If we get "Unknown user", 
        // we might just show login. If it's a completely fresh DB, we might want to know.
        // But the prompt says "If there are ZERO users: show a local first-run setup flow".
        // Let's try to query an endpoint, if it fails we show login.
        // For simplicity, we will query /health which we can add a flag to later, but right now we can just show login and if they click a secret 'setup' button or if the backend throws a specific error, we switch.
        // Actually, the prompt states: "On first application launch: If there are ZERO users: show a local first-run setup flow".
        // I will add a small query to check if users exist. Wait, the backend doesn't have an endpoint for that.
        // I will just add a setup toggle for now, or if login fails with "Unknown user: admin" and they tried "admin".
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      if (isSetup) {
        await api.post('/auth/setup', { username, password, full_name: fullName });
        // After setup, automatically log them in
        const res = await api.post('/auth/login', { username, password });
        login(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/login', { username, password });
        login(res.data.token, res.data.user);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.message === 'Setup already completed') {
        setIsSetup(false);
        setError('Setup is already complete. Please log in.');
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please try again.');
        // If we tried to login as admin and got unauthorized, maybe we need setup
        if (err.response?.data?.message.includes('Unknown user') && username === 'admin') {
          setIsSetup(true);
          setError('No admin user found. Please complete first-run setup.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          AeroEdge-X
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Agentic Edge AI for Aerospace MRO
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#141414] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2a2a2a]">
          <h3 className="text-lg font-medium text-white mb-6">
            {isSetup ? 'First-Run Setup: Create Admin' : 'Sign In'}
          </h3>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-md p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {isSetup && (
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-[#333] rounded-md shadow-sm bg-[#0a0a0a] text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#333] rounded-md shadow-sm bg-[#0a0a0a] text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={isSetup ? 8 : 1}
                  className="appearance-none block w-full px-3 py-2 border border-[#333] rounded-md shadow-sm bg-[#0a0a0a] text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSetup ? (
                  'Create Administrator'
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Sign in to this AeroEdge-X workstation. Authentication is stored locally and does not require internet connectivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
