import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageContainer } from './components/layout/PageContainer';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { Toaster } from 'react-hot-toast';

function App() {
  const theme = useSelector((state) => state.app.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [theme]);

  return (
    <PageContainer>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)', // slate-900 with some transparency
            color: '#f8fafc', // slate-50
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(51, 65, 85, 0.5)', // slate-700
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </PageContainer>
  );
}

export default App;
