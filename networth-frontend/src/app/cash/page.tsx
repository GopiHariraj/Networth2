"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BankAccount {
    id: string;
    accountName: string;
    bankName: string;
    currency: string;
    balance: number;
    lastUpdated: string;
    notes?: string;
}

interface CashWallet {
    id: string;
    walletName: string;
    balance: number;
    lastUpdated: string;
    notes?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6'];

export default function CashPage() {
    const { currency } = useCurrency();
    const { updateCash } = useNetWorth();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [wallets, setWallets] = useState<CashWallet[]>([]);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
    const [periodFilter, setPeriodFilter] = useState('6');

    const [bankFormData, setBankFormData] = useState({
        accountName: '',
        bankName: '',
        currency: 'AED',
        balance: '',
        notes: ''
    });

    const [walletFormData, setWalletFormData] = useState({
        walletName: '',
        balance: '',
        notes: ''
    });

    // Load data from localStorage
    useEffect(() => {
        const savedBanks = localStorage.getItem('networth-cash-bank');
        const savedWallets = localStorage.getItem('networth-cash-wallet');

        if (savedBanks) {
            try {
                setBankAccounts(JSON.parse(savedBanks));
            } catch (e) {
                console.error('Failed to load bank accounts', e);
            }
        }

        if (savedWallets) {
            try {
                setWallets(JSON.parse(savedWallets));
            } catch (e) {
                console.error('Failed to load wallets', e);
            }
        }
    }, []);

    const getTotalBank = () => bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const getTotalWallet = () => wallets.reduce((sum, w) => sum + w.balance, 0);
    const getTotalCash = () => getTotalBank() + getTotalWallet();

    // Bank Account Functions
    const handleEditBank = (account: BankAccount) => {
        setEditingBankId(account.id);
        setBankFormData({
            accountName: account.accountName,
            bankName: account.bankName,
            currency: account.currency,
            balance: account.balance.toString(),
            notes: account.notes || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddBank = (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankFormData.accountName || !bankFormData.bankName || !bankFormData.balance) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingBankId) {
            const updated = bankAccounts.map(acc =>
                acc.id === editingBankId
                    ? {
                        ...acc,
                        accountName: bankFormData.accountName,
                        bankName: bankFormData.bankName,
                        currency: bankFormData.currency,
                        balance: parseFloat(bankFormData.balance),
                        lastUpdated: new Date().toISOString(),
                        notes: bankFormData.notes
                    }
                    : acc
            );
            setBankAccounts(updated);
            updateCash(updated, wallets);
            setEditingBankId(null);
        } else {
            const newAccount: BankAccount = {
                id: Date.now().toString(),
                accountName: bankFormData.accountName,
                bankName: bankFormData.bankName,
                currency: bankFormData.currency,
                balance: parseFloat(bankFormData.balance),
                lastUpdated: new Date().toISOString(),
                notes: bankFormData.notes
            };
            const updated = [...bankAccounts, newAccount];
            setBankAccounts(updated);
            updateCash(updated, wallets);
        }

        setBankFormData({ accountName: '', bankName: '', currency: 'AED', balance: '', notes: '' });
    };

    const handleDeleteBank = (id: string) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            const updated = bankAccounts.filter(acc => acc.id !== id);
            setBankAccounts(updated);
            updateCash(updated, wallets);
        }
    };

    const handleCancelBankEdit = () => {
        setEditingBankId(null);
        setBankFormData({ accountName: '', bankName: '', currency: 'AED', balance: '', notes: '' });
    };

    // Wallet Functions
    const handleEditWallet = (wallet: CashWallet) => {
        setEditingWalletId(wallet.id);
        setWalletFormData({
            walletName: wallet.walletName,
            balance: wallet.balance.toString(),
            notes: wallet.notes || ''
        });
    };

    const handleAddWallet = (e: React.FormEvent) => {
        e.preventDefault();

        if (!walletFormData.walletName || !walletFormData.balance) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingWalletId) {
            const updated = wallets.map(w =>
                w.id === editingWalletId
                    ? {
                        ...w,
                        walletName: walletFormData.walletName,
                        balance: parseFloat(walletFormData.balance),
                        lastUpdated: new Date().toISOString(),
                        notes: walletFormData.notes
                    }
                    : w
            );
            setWallets(updated);
            updateCash(bankAccounts, updated);
            setEditingWalletId(null);
        } else {
            const newWallet: CashWallet = {
                id: Date.now().toString(),
                walletName: walletFormData.walletName,
                balance: parseFloat(walletFormData.balance),
                lastUpdated: new Date().toISOString(),
                notes: walletFormData.notes
            };
            const updated = [...wallets, newWallet];
            setWallets(updated);
            updateCash(bankAccounts, updated);
        }

        setWalletFormData({ walletName: '', balance: '', notes: '' });
    };

    const handleDeleteWallet = (id: string) => {
        if (confirm('Are you sure you want to delete this wallet?')) {
            const updated = wallets.filter(w => w.id !== id);
            setWallets(updated);
            updateCash(bankAccounts, updated);
        }
    };

    const handleCancelWalletEdit = () => {
        setEditingWalletId(null);
        setWalletFormData({ walletName: '', balance: '', notes: '' });
    };

    // Chart data
    const chartData = {
        bankVsCash: [
            { name: 'Bank Accounts', value: getTotalBank() },
            { name: 'Cash Wallets', value: getTotalWallet() }
        ].filter(item => item.value > 0),
        trend: Array.from({ length: parseInt(periodFilter) }, (_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            value: getTotalCash()
        }))
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">💰 Liquid Cash</h1>
                    <p className="text-slate-500 mt-2">Manage your bank accounts and cash wallets</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Liquid Cash</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalCash().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Bank Balance</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {getTotalBank().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Wallet Cash</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {getTotalWallet().toLocaleString()}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Liquid Cash Trend</h3>
                            <select
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                            >
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">12 Months</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={chartData.trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Bank vs Cash Split</h3>
                        {chartData.bankVsCash.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={chartData.bankVsCash} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {chartData.bankVsCash.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-slate-400">
                                No data to display
                            </div>
                        )}
                    </div>
                </div>

                {/* Bank Accounts & Wallets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bank Accounts Section */}
                    <div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                                {editingBankId ? '✏️ Edit Bank Account' : '🏦 Add Bank Account'}
                            </h2>
                            <form onSubmit={handleAddBank} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Name *</label>
                                    <input
                                        type="text"
                                        value={bankFormData.accountName}
                                        onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                                        placeholder="e.g., Savings Account"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Name *</label>
                                    <input
                                        type="text"
                                        value={bankFormData.bankName}
                                        onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                                        placeholder="e.g., ADCB, Emirates NBD"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                                    <select
                                        value={bankFormData.currency}
                                        onChange={(e) => setBankFormData({ ...bankFormData, currency: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    >
                                        <option value="AED">AED</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="INR">INR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Balance *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bankFormData.balance}
                                        onChange={(e) => setBankFormData({ ...bankFormData, balance: e.target.value })}
                                        placeholder="e.g., 50000"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                                    <textarea
                                        value={bankFormData.notes}
                                        onChange={(e) => setBankFormData({ ...bankFormData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingBankId && (
                                        <button
                                            type="button"
                                            onClick={handleCancelBankEdit}
                                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                                        >
                                            ✖️ Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20"
                                    >
                                        {editingBankId ? '💾 Update' : '➕ Add Bank Account'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Bank Accounts List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📋 Bank Accounts ({bankAccounts.length})</h2>
                            </div>
                            {bankAccounts.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">🏦</div>
                                    <div className="text-slate-500">No bank accounts added yet</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {bankAccounts.map(account => (
                                        <div key={account.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{account.accountName}</div>
                                                    <div className="text-sm text-slate-500">{account.bankName}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-green-600 dark:text-green-400">{currency.symbol} {account.balance.toLocaleString()}</div>
                                                    <div className="text-xs text-slate-400">{account.currency}</div>
                                                </div>
                                            </div>
                                            {account.notes && (
                                                <div className="text-xs text-slate-400 mb-2">{account.notes}</div>
                                            )}
                                            <div className="flex gap-2 justify-between items-center">
                                                <div className="text-xs text-slate-400">Updated: {new Date(account.lastUpdated).toLocaleDateString()}</div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditBank(account)}
                                                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBank(account.id)}
                                                        className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cash Wallets Section */}
                    <div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                                {editingWalletId ? '✏️ Edit Cash Wallet' : '👛 Add Cash Wallet'}
                            </h2>
                            <form onSubmit={handleAddWallet} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Wallet Name *</label>
                                    <input
                                        type="text"
                                        value={walletFormData.walletName}
                                        onChange={(e) => setWalletFormData({ ...walletFormData, walletName: e.target.value })}
                                        placeholder="e.g., Pocket Money, Emergency Cash"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Balance *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={walletFormData.balance}
                                        onChange={(e) => setWalletFormData({ ...walletFormData, balance: e.target.value })}
                                        placeholder="e.g., 5000"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                                    <textarea
                                        value={walletFormData.notes}
                                        onChange={(e) => setWalletFormData({ ...walletFormData, notes: e.target.value })}
                                        placeholder="Optional notes..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingWalletId && (
                                        <button
                                            type="button"
                                            onClick={handleCancelWalletEdit}
                                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                                        >
                                            ✖️ Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20"
                                    >
                                        {editingWalletId ? '💾 Update' : '➕ Add Wallet'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Wallets List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📋 Cash Wallets ({wallets.length})</h2>
                            </div>
                            {wallets.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">👛</div>
                                    <div className="text-slate-500">No wallets added yet</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {wallets.map(wallet => (
                                        <div key={wallet.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-slate-900 dark:text-white">{wallet.walletName}</div>
                                                <div className="font-bold text-purple-600 dark:text-purple-400">{currency.symbol} {wallet.balance.toLocaleString()}</div>
                                            </div>
                                            {wallet.notes && (
                                                <div className="text-xs text-slate-400 mb-2">{wallet.notes}</div>
                                            )}
                                            <div className="flex gap-2 justify-between items-center">
                                                <div className="text-xs text-slate-400">Updated: {new Date(wallet.lastUpdated).toLocaleDateString()}</div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditWallet(wallet)}
                                                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWallet(wallet.id)}
                                                        className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
