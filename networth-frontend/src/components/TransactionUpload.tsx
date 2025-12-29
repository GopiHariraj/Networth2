import React, { useState, useRef } from 'react';
import { transactionsApi } from '../lib/api/client';
import Link from 'next/link';
import { useCurrency } from '../lib/currency-context';

export default function TransactionUpload({ onTransactionAdded }: { onTransactionAdded: () => void }) {
    const { currency, convert } = useCurrency();
    const [activeTab, setActiveTab] = useState<'sms' | 'receipt'>('sms');
    const [smsText, setSmsText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAnalyzeSMS = async () => {
        if (!smsText.trim()) return;
        setLoading(true);
        try {
            const res = await transactionsApi.parseSMS(smsText);
            setResult(res.data);
            onTransactionAdded();
            setSmsText('');
        } catch (error) {
            console.error(error);
            alert('Failed to parse SMS');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        setLoading(true);
        try {
            // Convert to base64
            const base64 = await fileToBase64(file);
            setImagePreview(base64);

            // Send to backend
            const res = await transactionsApi.analyzeReceipt(base64);
            setResult({
                ...res.data,
                type: 'EXPENSE'
            });
            onTransactionAdded();
            setImagePreview(null);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze receipt. Please try again with a clearer image.');
        } finally {
            setLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const getTypeBadge = (type: string) => {
        const badges: Record<string, { color: string; emoji: string; label: string }> = {
            GOLD: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', emoji: '🥇', label: 'Gold' },
            STOCK: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', emoji: '📈', label: 'Stock' },
            BOND: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', emoji: '📜', label: 'Bond' },
            EXPENSE: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', emoji: '💰', label: 'Expense' },
        };
        const badge = badges[type] || badges.EXPENSE;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
            </span>
        );
    };

    const getModuleLink = (type: string) => {
        const links: Record<string, string> = {
            GOLD: '/gold',
            STOCK: '/stocks',
            BOND: '/bonds',
            EXPENSE: '/expenses',
        };
        return links[type] || '/';
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">🤖 AI Transaction Assistant</h3>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('sms')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sms' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        📱 SMS
                    </button>
                    <button
                        onClick={() => setActiveTab('receipt')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'receipt' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        📸 Receipt
                    </button>
                </div>
            </div>

            {activeTab === 'sms' ? (
                <div>
                    <textarea
                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                        rows={3}
                        placeholder="Paste transaction SMS here... 
Examples:
• 'Bought 50g 22K gold chain at AED 10,000'
• 'Bought 10 shares AAPL at $150'
• 'Spent AED 500 at Carrefour'"
                        value={smsText}
                        onChange={(e) => setSmsText(e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-xs text-slate-500">✨ AI will detect type and extract fields automatically.</p>
                        <button
                            onClick={handleAnalyzeSMS}
                            disabled={loading || !smsText}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Analyzing...' : 'Analyze & Add'}
                            {!loading && <span>✨</span>}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                        {imagePreview ? (
                            <div className="space-y-4">
                                <img src={imagePreview} alt="Receipt" className="max-h-48 mx-auto rounded-lg" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Processing receipt...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-5xl">📷</div>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Upload Receipt Image</p>
                                    <p className="text-sm text-slate-500 mt-1">Click to select or drag & drop</p>
                                    <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG (max 5MB)</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                    />
                    <p className="text-xs text-slate-500 mt-2">🔒 Powered by Google Gemini Vision AI</p>
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between mb-3">
                        {getTypeBadge(result.type)}
                        <Link
                            href={getModuleLink(result.type)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            View in module →
                        </Link>
                    </div>

                    <div className="text-emerald-700 dark:text-emerald-300 text-sm space-y-1">
                        <p className="font-semibold">✓ Transaction Created Successfully!</p>
                        <p><b>Amount:</b> {currency.symbol} {convert(result.amount || 0, 'AED').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

                        {/* Gold-specific */}
                        {result.type === 'GOLD' && result.weight && (
                            <>
                                <p><b>Weight:</b> {result.weight}g</p>
                                <p><b>Purity:</b> {result.purity || '22K'}</p>
                                <p><b>Item:</b> {result.ornamentName || 'Gold Item'}</p>
                            </>
                        )}

                        {/* Stock-specific */}
                        {result.type === 'STOCK' && result.stockSymbol && (
                            <>
                                <p><b>Symbol:</b> {result.stockSymbol}</p>
                                <p><b>Units:</b> {result.units || 0}</p>
                                <p><b>Price/Unit:</b> {currency.symbol} {convert(result.unitPrice || 0, 'AED').toFixed(2)}</p>
                                <p><b>Market:</b> {result.market || 'NASDAQ'}</p>
                            </>
                        )}

                        {/* Bond-specific */}
                        {result.type === 'BOND' && result.bondName && (
                            <>
                                <p><b>Bond:</b> {result.bondName}</p>
                                {result.interestRate > 0 && <p><b>Interest:</b> {result.interestRate}%</p>}
                                {result.maturityDate && <p><b>Maturity:</b> {result.maturityDate}</p>}
                            </>
                        )}

                        {/* Expense-specific */}
                        {result.type === 'EXPENSE' && (
                            <>
                                <p><b>Merchant:</b> {result.merchant || result.receiptData?.merchant || 'Unknown'}</p>
                                <p><b>Category:</b> {result.category?.name || result.category || result.receiptData?.category || 'Uncategorized'}</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
