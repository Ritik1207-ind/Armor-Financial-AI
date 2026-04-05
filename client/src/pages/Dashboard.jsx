import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchDashboardData, clearDashboardData, updateDashboardInsight } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, ShieldAlert, TrendingUp, Users, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState(null);
    
    // Editor State
    const [editingInsight, setEditingInsight] = useState(null);
    const [editForm, setEditForm] = useState({ sip: '', loan: '', emi: '', income: '' });

    const loadDocs = async () => {
        setLoading(true);
        try {
            const resp = await fetchDashboardData();
            setData(resp);
            setError(null);
        } catch (err) {
            console.error("Dashboard failed to load data", err);
            setError("Failed to load dashboard data. Backend may be down.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocs();
    }, []);

    const handleReset = (e) => {
        if (e) e.preventDefault();
        
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <span className="font-medium">Reset dashboard data?</span>
                <span className="text-xs text-slate-500">This action cannot be undone.</span>
                <div className="flex gap-2 mt-1">
                    <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white flex-1" 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setIsResetting(true);
                            try {
                                await clearDashboardData();
                                await loadDocs();
                                toast.success("Dashboard reset successfully");
                            } catch (err) {
                                toast.error("Failed to reset dashboard: " + err.message);
                            } finally {
                                setIsResetting(false);
                            }
                        }}
                    >
                        Yes, Wipe Data
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
                </div>
            </div>
        ), { duration: 6000, position: 'top-center' });
    };

    if (loading && !data) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-red-500 font-medium p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                    {error}
                </div>
            </div>
        );
    }

    const formatEntityData = (obj) => Object.keys(obj || {}).map(key => ({ name: key.toUpperCase().replace(/_/g, ' '), value: obj[key] }));
    const formatYAxis = (val) => new Intl.NumberFormat('en-IN', { notation: "compact", compactDisplay: "short" }).format(val);
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(val);

    const handleEditClick = (insight) => {
        setEditingInsight(insight.insight_id);
        setEditForm({
            sip: insight.sip || 0,
            loan: insight.loan || 0,
            emi: insight.emi || 0,
            income: insight.income || 0
        });
    };

    const handleSaveEdit = async () => {
        try {
            await updateDashboardInsight(editingInsight, editForm);
            toast.success("Extraction updated manually.");
            setEditingInsight(null);
            loadDashboard();
        } catch (error) {
            toast.error("Failed to update extractions");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Intelligence Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Your financial conversation insights organized simply.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadDocs} 
                        disabled={loading || isResetting}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={handleReset}
                        disabled={loading || isResetting}
                        className="bg-red-500 hover:bg-red-600 text-white border-none"
                    >
                        {isResetting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Reset Dashboard
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">Total Conversations</p>
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold">{data.total_conversations}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">Avg Risk Level</p>
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold">Medium</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">AI Confidence</p>
                            <Activity className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold">90%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-slate-500">Identified Entities</p>
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="text-2xl font-bold">12</div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Quadrant Section */}
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-8 mb-4">Financial Quadrant (Timeline)</h2>
            <div className="grid gap-4 md:grid-cols-2">
                
                {/* SIP Chart */}
                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>SIP Portfolio Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        {(data.sip_trend || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.sip_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'SIP Total']}
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }} 
                                        labelStyle={{ color: '#cbd5e1', fontWeight: '500', paddingBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="sip" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fontSize: 10, fill: '#64748b', formatter: formatYAxis }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-slate-500">No SIPs tracked yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Loan Chart */}
                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>Outstanding Loan Exposure</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        {(data.loan_trend || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.loan_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'Loan Exposure']}
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }} 
                                        labelStyle={{ color: '#cbd5e1', fontWeight: '500', paddingBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="loan" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fontSize: 10, fill: '#64748b', formatter: formatYAxis }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-slate-500">No Loans tracked yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* EMI Chart */}
                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>Monthly EMI Burden</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        {(data.emi_trend || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.emi_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'EMI Total']}
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }} 
                                        labelStyle={{ color: '#cbd5e1', fontWeight: '500', paddingBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="emi" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fontSize: 10, fill: '#64748b', formatter: formatYAxis }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-slate-500">No EMIs tracked yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Income Trend Line Chart */}
                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>Income Timeline Tracker</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        {(data.income_trend || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.income_trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value), 'Income']}
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }} 
                                        labelStyle={{ color: '#cbd5e1', fontWeight: '500', paddingBottom: '4px' }}
                                    />
                                    <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: 'top', fontSize: 10, fill: '#64748b', formatter: formatYAxis }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-full text-slate-500">No Income history yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Portfolio Overrides */}
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-8 mb-4">Manage AI Extractions</h2>
            <Card>
                <CardHeader className="p-6 pb-2">
                    <CardTitle>Timeline History Overrides</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {(data.portfolio_trends || []).map((t) => (
                            <div key={t.insight_id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="font-medium text-sm w-full sm:w-1/4">Date: {t.date}</div>
                                {editingInsight === t.insight_id ? (
                                    <div className="flex items-center space-x-2 w-full mt-2 sm:mt-0 max-w-2xl">
                                        <div className="flex flex-col"><span className="text-[10px] text-slate-500">SIP</span><input type="number" className="border rounded p-1 w-20 text-xs" value={editForm.sip} onChange={e => setEditForm({...editForm, sip: e.target.value})} /></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-slate-500">LOAN</span><input type="number" className="border rounded p-1 w-20 text-xs" value={editForm.loan} onChange={e => setEditForm({...editForm, loan: e.target.value})} /></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-slate-500">EMI</span><input type="number" className="border rounded p-1 w-20 text-xs" value={editForm.emi} onChange={e => setEditForm({...editForm, emi: e.target.value})} /></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-slate-500">INCOME</span><input type="number" className="border rounded p-1 w-20 text-xs" value={editForm.income} onChange={e => setEditForm({...editForm, income: e.target.value})} /></div>
                                        <div className="flex space-x-1 ml-auto mt-4">
                                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingInsight(null)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex w-full mt-2 sm:mt-0 justify-between items-center max-w-2xl">
                                        <div className="flex space-x-6 text-sm text-slate-600 dark:text-slate-300">
                                            <div><span className="font-semibold">SIP:</span> {formatCurrency(t.sip)}</div>
                                            <div><span className="font-semibold">LOAN:</span> {formatCurrency(t.loan)}</div>
                                            <div><span className="font-semibold">EMI:</span> {formatCurrency(t.emi)}</div>
                                            <div><span className="font-semibold">INCOME:</span> {formatCurrency(t.income)}</div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(t)}>Edit</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {(!data.portfolio_trends || data.portfolio_trends.length === 0) && (
                            <div className="text-center text-slate-500 text-sm py-4">No portfolio history to modify.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
        </div>
    );
}
