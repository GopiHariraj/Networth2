"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';

interface Expense {
    id: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    merchant?: string;
    paymentMethod?: string;
    accountId?: string;
    recurrence: string;
    notes?: string;
    source: string;
}

const DEFAULT_CATEGORIES = [
    'Groceries', 'Restaurants', 'Transport', 'Fuel', 'Utilities (DEWA)',
    'Rent/EMI', 'School Fees', 'Insurance', 'Self-care', 'Shopping',
    'Entertainment', 'Medical', 'Travel', 'Misc'
];

const PAYMENT_METHODS = ['cash', 'bank', 'credit_card'];
const RECURRENCE_OPTIONS = ['one-time', 'monthly', 'yearly'];

export default function ExpensesPage() {
    const { currency } = useCurrency();
    const [activeTab, setActiveTab] = useState('daily');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'AED',
        category: 'Groceries',
        merchant: '',
        paymentMethod: 'cash',
        accountId: '',
        recurrence: 'one-time',
        notes: ''
    });

    // AI Text Parser state
    const [aiText, setAiText] = useState('');
    const [aiParsedItems, setAiParsedItems] = useState<any[]>([]);
    const [showAiPreview, setShowAiPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Load expenses from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('expenses');
        if (saved) {
            try {
                setExpenses(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load expenses', e);
            }
        }
    }, []);

    // Save expenses to localStorage
    const saveExpenses = (newExpenses: Expense[]) => {
        setExpenses(newExpenses);
        localStorage.setItem('expenses', JSON.stringify(newExpenses));
    };

    // Calculate totals
    const getToday = () => new Date().toISOString().split('T')[0];
    const getTodayTotal = () => expenses.filter(e => e.date === getToday()).reduce((sum, e) => sum + e.amount, 0);
    const getMonthTotal = () => {
        const now = new Date();
        return expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
    };
    const getYearTotal = () => {
        const now = new Date();
        return expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
    };

    // Handle manual entry
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (editingId) {
            // Update existing
            const updated = expenses.map(exp =>
                exp.id === editingId
                    ? {
                        ...exp,
                        ...formData,
                        amount: parseFloat(formData.amount),
                        source: 'manual'
                    }
                    : exp
            );
            saveExpenses(updated);
            setEditingId(null);
        } else {
            // Add new
            const newExpense: Expense = {
                id: Date.now().toString(),
                ...formData,
                amount: parseFloat(formData.amount),
                source: 'manual'
            };
            saveExpenses([...expenses, newExpense]);
        }

        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            amount: '',
            currency: 'AED',
            category: 'Groceries',
            merchant: '',
            paymentMethod: 'cash',
            accountId: '',
            recurrence: 'one-time',
            notes: ''
        });
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData({
            date: expense.date,
            amount: expense.amount.toString(),
            currency: expense.currency,
            category: expense.category,
            merchant: expense.merchant || '',
            paymentMethod: expense.paymentMethod || 'cash',
            accountId: expense.accountId || '',
            recurrence: expense.recurrence,
            notes: expense.notes || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            saveExpenses(expenses.filter(e => e.id !== id));
        }
    };

    // OpenAI AI text parsing
    const handleAiAnalyze = async () => {
        if (!aiText.trim()) return;

        setIsAiLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/expenses/ai-parse-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text: aiText })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze text');
            }

            const result = await response.json();

            if (result.error) {
                alert('Error: ' + result.error);
                setIsAiLoading(false);
                return;
            }

            if (result.items && result.items.length > 0) {
                setAiParsedItems(result.items);
                setShowAiPreview(true);
            } else {
                alert('No expenses detected in the text. Please try again with more details.');
            }
        } catch (error) {
            console.error('AI parsing error:', error);
            alert('Failed to parse expenses. Please check your OpenAI API key and try again.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiConfirm = () => {
        const newExpenses = aiParsedItems.map(item => ({
            id: Date.now().toString() + Math.random(),
            ...item,
            recurrence: 'one-time',
            source: 'gemini_text'
        }));

        saveExpenses([...expenses, ...newExpenses]);
        setAiText('');
        setAiParsedItems([]);
        setShowAiPreview(false);
        alert('✅ Expenses saved successfully!');
    };

    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const today = new Date();

        switch (activeTab) {
            case 'daily':
                return e.date === getToday();
            case 'monthly':
                return expenseDate.getMonth() === today.getMonth() &&
                    expenseDate.getFullYear() === today.getFullYear();
            case 'yearly':
                return expenseDate.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">💵 Expenses Management</h1>
                    <p className="text-slate-500 mt-2">Track and manage all your expenses with AI-powered tools</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {['daily', 'monthly', 'yearly', 'insights'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Today's Expenses</div>
                        <div className="text-3xl font-bold mt-2">د.إ {getTodayTotal().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">This Month</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">د.إ {getMonthTotal().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">This Year</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">د.إ {getYearTotal().toLocaleString()}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Forms */}
                    <div className="space-y-6">
                        {/* Manual Entry Form */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                                {editingId ? '✏️ Edit Expense' : '➕ Add Expense'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date *</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Merchant/Payee</label>
                                    <input
                                        type="text"
                                        value={formData.merchant}
                                        onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                                        placeholder="e.g., Carrefour, DEWA"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                                        <select
                                            value={formData.paymentMethod}
                                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank</option>
                                            <option value="credit_card">Credit Card</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recurrence</label>
                                        <select
                                            value={formData.recurrence}
                                            onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="one-time">One-time</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Optional notes..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(null);
                                                setFormData({
                                                    date: new Date().toISOString().split('T')[0],
                                                    amount: '',
                                                    currency: 'AED',
                                                    category: 'Groceries',
                                                    merchant: '',
                                                    paymentMethod: 'cash',
                                                    accountId: '',
                                                    recurrence: 'one-time',
                                                    notes: ''
                                                });
                                            }}
                                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                                        >
                                            ✖️ Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                    >
                                        {editingId ? '💾 Update' : '➕ Add Expense'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* AI Text Parser */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">✨ AI Text Parser</h2>
                            <p className="text-sm text-slate-500 mb-4">Paste expense text and let AI extract structured data</p>
                            <textarea
                                value={aiText}
                                onChange={(e) => setAiText(e.target.value)}
                                rows={4}
                                placeholder="Example: Spent 450 AED at Carrefour for groceries yesterday. Paid 120 for fuel at ENOC today."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none mb-4"
                            />
                            <button
                                onClick={handleAiAnalyze}
                                disabled={isAiLoading || !aiText.trim()}
                                className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAiLoading ? '🤖 Analyzing...' : '🤖 Analyze with OpenAI'}
                            </button>

                            {/* AI Preview */}
                            {showAiPreview && aiParsedItems.length > 0 && (
                                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3">📋 Extracted Expenses ({aiParsedItems.length})</h3>
                                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                        {aiParsedItems.map((item, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{item.category}</div>
                                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                                            {item.merchant || 'Unknown'} • {new Date(item.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-purple-600 dark:text-purple-400">
                                                            {item.currency} {item.amount}
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {item.paymentMethod}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">{item.notes}</span>
                                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                        {Math.round((item.confidence || 0) * 100)}% confident
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setShowAiPreview(false);
                                                setAiParsedItems([]);
                                            }}
                                            className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAiConfirm}
                                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                                        >
                                            ✓ Confirm & Save {aiParsedItems.length} Expense{aiParsedItems.length > 1 ? 's' : ''}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Expense List */}
                    <div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    📋 {activeTab === 'daily' ? 'Today' : activeTab === 'monthly' ? 'This Month' : 'This Year'} ({filteredExpenses.length})
                                </h2>
                            </div>
                            {filteredExpenses.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">💸</div>
                                    <div className="text-slate-500">No expenses yet</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                                    {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <div key={expense.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-bold text-slate-900 dark:text-white">{expense.category}</div>
                                                        {expense.merchant && (
                                                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                                                {expense.merchant}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod}
                                                    </div>
                                                    {expense.notes && (
                                                        <div className="text-xs text-slate-500 mt-1">{expense.notes}</div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-red-600 dark:text-red-400 text-lg">
                                                        -د.إ {expense.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    🗑️
                                                </button>
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
