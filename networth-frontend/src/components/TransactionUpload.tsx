import React, { useState } from 'react';
import { transactionsApi } from '../lib/api/client';

export default function TransactionUpload({ onTransactionAdded }: { onTransactionAdded: () => void }) {
    const [smsText, setSmsText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!smsText.trim()) return;
        setLoading(true);
        try {
            const res = await transactionsApi.parseSMS(smsText);
            setResult(res.data);
            // Auto refresh dashboard or show confirm
            onTransactionAdded();
            setSmsText('');
        } catch (error) {
            console.error(error);
            alert('Failed to parse SMS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <h3 className="font-bold text-lg mb-4">Add Transaction via SMS</h3>
            <textarea
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                rows={3}
                placeholder="Paste bank SMS here... (e.g., 'Spent AED 120 at Carrefour via Credit Card')"
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-slate-500">AI will extract amount, merchant, and category.</p>
                <button
                    onClick={handleAnalyze}
                    disabled={loading || !smsText}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? 'Analyzing...' : 'Analyze & Add'}
                    {!loading && <span>✨</span>}
                </button>
            </div>
            {result && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm">
                    Added: {result.type} of <b>{result.amount}</b> at <b>{result.merchant}</b> ({result.category?.name || 'Uncategorized'})
                </div>
            )}
        </div>
    );
}
