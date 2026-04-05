import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { setAuth, setError, setLoading } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const data = await loginApi({ email, password });
      dispatch(setAuth({ user: data, token: data.token }));
      navigate('/');
    } catch (err) {
      dispatch(setError(err.response?.data?.error || 'Login failed. Check your credentials.'));
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-emerald-100/20 dark:from-blue-900/10 dark:to-emerald-900/10"></div>
      
      <Card className="w-full max-w-md border-white/20 dark:border-slate-800/50 shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-[#020617]/70">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 animate-in zoom-in duration-500">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Armor AI</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">Secure your financial future with AI-driven intelligence.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-md font-semibold"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline decoration-2 underline-offset-4">
                Create one now
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
