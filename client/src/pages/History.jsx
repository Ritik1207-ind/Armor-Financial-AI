import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { fetchDashboardData, fetchConversation, deleteConversation } from '../services/api';
import { setHistory, removeConversation } from '../store/slices/conversationSlice';
import { formatDate } from '../utils/helpers';
import { Search, Filter, ShieldAlert, FileText, Activity, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function History() {
    const dispatch = useDispatch();
    const history = useSelector((state) => state.conversation.history);
    const [loading, setLoading] = useState(history.length === 0);
    const [expandedId, setExpandedId] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsData, setDetailsData] = useState({});

    const handleExpand = async (convId) => {
        if (expandedId === convId) {
            setExpandedId(null);
            return;
        }
        setExpandedId(convId);
        if (!detailsData[convId]) {
            setLoadingDetails(true);
            try {
                const data = await fetchConversation(convId);
                setDetailsData(prev => ({ ...prev, [convId]: data }));
            } catch (err) {
                console.error("Failed to fetch conversation details", err);
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const handleDelete = (convId, e) => {
        if (e) e.stopPropagation();
        
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[200px]">
                <span className="font-medium">Delete this conversation?</span>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white" 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await deleteConversation(convId);
                                dispatch(removeConversation(convId));
                                toast.success("Conversation deleted");
                            } catch (error) {
                                toast.error("Failed to delete conversation.");
                                console.error(error);
                            }
                        }}
                    >
                        Delete
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    useEffect(() => {
        if (history.length === 0) {
            const loadHistory = async () => {
                const resp = await fetchDashboardData();
                // Map dashboard recent_conversations to history shape
                dispatch(setHistory(resp.recent_conversations));
                setLoading(false);
            };
            loadHistory();
        } else {
            setLoading(false);
        }
    }, [dispatch, history.length]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Conversation History</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Review past intelligence captures and financial decisions.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search keywords..." 
                            className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>
                    <Button variant="outline" className="shrink-0 group">
                        <Filter className="h-4 w-4 mr-2 group-hover:text-blue-500 transition-colors" />
                        Filter
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No conversations yet</h3>
                        <p>Upload an audio clip or enter text to get started.</p>
                    </div>
                ) : (
                    history.map((conv, i) => (
                        <Card key={conv.id || i} className="overflow-hidden border-l-4 border-l-transparent hover:border-l-blue-500 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{formatDate(conv.date || conv.created_at)}</span>
                                            {conv.is_financial && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800">
                                                    Financial Context
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-medium leading-snug">
                                            {conv.snippet || conv.summary || "Conversation transcribed. Review required."}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 shrink-0">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mb-1">
                                                Risk Level
                                                <ShieldAlert className="h-3 w-3" />
                                            </div>
                                            <div className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                                                conv.risk_level === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                                                conv.risk_level === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                                            }`}>
                                                {(conv.risk_level || 'low').toUpperCase()}
                                            </div>
                                        </div>
                                        
                                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                                        
                                        <div className="flex gap-1 items-center">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 px-2"
                                                onClick={(e) => handleDelete(conv.id || conv._id, e)}
                                                title="Delete Conversation"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-3"
                                                onClick={() => handleExpand(conv.id || conv._id)}
                                            >
                                                {expandedId === (conv.id || conv._id) ? "Hide Details" : "View More"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {expandedId === (conv.id || conv._id) && (
                                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {loadingDetails && !detailsData[conv.id || conv._id] ? (
                                            <div className="flex justify-center p-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                            </div>
                                        ) : detailsData[conv.id || conv._id] ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 text-blue-600">Summary</h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            {detailsData[conv.id || conv._id].insight?.summary || "No summary available."}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 text-blue-600">Extracted Datapoints</h4>
                                                        <div className="flex flex-wrap gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            {Object.entries(detailsData[conv.id || conv._id].insight?.entities || {}).map(([key, val]) => (
                                                                <span key={key} className="bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                                                    <strong>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                </span>
                                                            ))}
                                                            {Object.keys(detailsData[conv.id || conv._id].insight?.entities || {}).length === 0 && <span className="text-slate-500">No entities extracted.</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 text-blue-600">Psychological Profile</h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            <div><span className="text-slate-500 w-20 inline-block text-right pr-2">Sentiment:</span> {detailsData[conv.id || conv._id].conversation?.sentiment || "N/A"}</div>
                                                            <div><span className="text-slate-500 w-20 inline-block text-right pr-2">Emotion:</span> {detailsData[conv.id || conv._id].conversation?.user_emotion || "N/A"}</div>
                                                            <div className="col-span-2"><span className="text-slate-500 w-20 inline-block text-right pr-2">Confidence:</span> {detailsData[conv.id || conv._id].conversation?.user_confidence || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 text-blue-600">Financial Insights</h4>
                                                        <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            {Array.isArray(detailsData[conv.id || conv._id].insight?.financial_advice) && detailsData[conv.id || conv._id].insight.financial_advice.length > 0 ? (
                                                                detailsData[conv.id || conv._id].insight.financial_advice.map((tip, idx) => (
                                                                    <li key={idx}>{typeof tip === 'object' ? JSON.stringify(tip) : String(tip)}</li>
                                                                ))
                                                            ) : (
                                                                <li className="list-none text-slate-500">No specific advice available.</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 text-red-500 text-sm">Failed to load details.</div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
