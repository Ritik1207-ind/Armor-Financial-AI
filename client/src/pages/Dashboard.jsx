import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { fetchDashboardData, clearDashboardData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, ShieldAlert, TrendingUp, Users, Trash2, RefreshCw } from 'lucide-react';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [error, setError] = useState(null);

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

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to delete all stored data? This action cannot be undone.")) return;
        
        setIsResetting(true);
        try {
            await clearDashboardData();
            await loadDocs(); // Reload with fresh state
        } catch (err) {
            alert("Failed to reset dashboard: " + err.message);
        } finally {
            setIsResetting(false);
        }
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

    const formatEntityData = (obj) => Object.keys(obj).map(key => ({ name: key.toUpperCase().replace(/_/g, ' '), value: obj[key] }));

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

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>Risk Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.risk_trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="risk_score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader className="p-6 pb-2">
                        <CardTitle>Entity Mentions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={formatEntityData(data.entity_distribution)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Insights */}
            <Card>
                <CardHeader className="p-6 pb-2">
                    <CardTitle>Recent Insights</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                    <div className="space-y-4">
                        {data.recent_conversations.map(conv => (
                            <div key={conv.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{conv.snippet}</p>
                                    <p className="text-xs text-slate-500">{conv.date}</p>
                                </div>
                                <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    conv.risk_level === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    conv.risk_level === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                    {conv.risk_level.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
