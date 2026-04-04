import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageContainer } from './components/layout/PageContainer';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import History from './pages/History';

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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/history" element={<History />} />
        {/* Vault is optional but we can add a stub */}
        <Route path="/vault" element={<div className="p-6 text-center text-slate-500">Vault implementation coming soon...</div>} />
      </Routes>
    </PageContainer>
  );
}

export default App;
