"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency, CURRENCIES } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { useAuth } from '../../lib/auth-context';
import apiClient from '../../lib/api/client';
import { useTour } from '../../lib/tour-context';

export default function SettingsPage() {
    const { currency, setCurrency, exchangeRates, lastUpdate, isUsingCache, updateExchangeRates } = useCurrency();
    const { data: networthData } = useNetWorth();
    const { user, updateModuleVisibility } = useAuth();
    const { startTour } = useTour();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: 'en'
    });

    const handleSaveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        alert('Settings saved successfully! ⚙️');
    };

    const handleRefreshRates = async () => {
        setIsRefreshing(true);
        try {
            await updateExchangeRates();
            alert('✅ Exchange rates updated successfully!');
        } catch (error) {
            alert('❌ Failed to update exchange rates. Using cached rates.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Export user-specific data as backup
    const handleExportData = async () => {
        if (!user?.id) {
            alert('❌ Please login to export your data');
            return;
        }

        try {
            // Fetch all user's financial data from API
            const [assets, liabilities, transactions, goals] = await Promise.all([
                apiClient.get('/bank-accounts'),
                apiClient.get('/credit-cards'),
                apiClient.get('/transactions'),
                apiClient.get('/goals')
            ]);

            const backup = {
                version: '2.0',
                timestamp: new Date().toISOString(),
                appName: 'Net Worth Tracker',
                userId: user.id,
                userEmail: user.email,
                userData: {
                    // User-specific localStorage
                    preferredCurrency: localStorage.getItem(`preferredCurrency_${user.id}`),
                    activeGoal: localStorage.getItem(`activeGoal_${user.id}`),
                    // Financial data from API
                    bankAccounts: assets.data || [],
                    creditCards: liabilities.data || [],
                    transactions: transactions.data || [],
                    goals: goals.data || []
                }
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `networth-backup-${user.email}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert('✅ Backup downloaded successfully!');
        } catch (error) {
            console.error('Backup error:', error);
            alert('❌ Failed to create backup. Please try again.');
        }
    };

    // Import user-specific data from backup file
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!user?.id) {
            alert('❌ Please login to restore your data');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target?.result as string);

                // Validate format and version
                if (!backup.version || !backup.userData) {
                    alert('❌ Invalid backup file format');
                    return;
                }

                // Warn if backup is from a different user
                if (backup.userId && backup.userId !== user.id) {
                    const confirmDifferentUser = window.confirm(
                        `⚠️ This backup is from ${backup.userEmail || 'another user'}. Your current data will be replaced. Continue?`
                    );
                    if (!confirmDifferentUser) return;
                }

                const confirmRestore = window.confirm(
                    '⚠️ This will replace your current data. Continue?'
                );

                if (confirmRestore) {
                    // Restore user-specific localStorage
                    if (backup.userData.preferredCurrency) {
                        localStorage.setItem(`preferredCurrency_${user.id}`, backup.userData.preferredCurrency);
                    }
                    if (backup.userData.activeGoal) {
                        localStorage.setItem(`activeGoal_${user.id}`, backup.userData.activeGoal);
                    }

                    alert('✅ Data restored successfully! Page will reload.');
                    window.location.reload();
                }
            } catch (error) {
                alert('❌ Failed to read backup file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">⚙️ Settings</h1>
                    <p className="text-slate-500 mt-2">Manage your preferences and application settings</p>
                </header>

                <div className="space-y-6">
                    {/* Backup & Restore */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-2xl">
                                💾
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Backup & Restore</h2>
                                <p className="text-sm text-slate-500">Export and import your data</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={handleExportData}
                                className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                                <div className="text-3xl mb-2">📥</div>
                                <div className="font-bold text-slate-900 dark:text-white">Export Backup</div>
                                <div className="text-sm text-slate-500 mt-1">Download all your data</div>
                            </button>

                            <label className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                                <div className="text-3xl mb-2">📤</div>
                                <div className="font-bold text-slate-900 dark:text-white">Import Backup</div>
                                <div className="text-sm text-slate-500 mt-1">Restore from file</div>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportData}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                💡 <strong>Tip:</strong> Export your data regularly to keep a backup of your financial information.
                            </p>
                        </div>
                    </div>

                    {/* Currency Settings */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl">
                                💱
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Currency Settings</h2>
                                <p className="text-sm text-slate-500">Select your preferred currency for display</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Selected Currency
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {CURRENCIES.map((curr) => (
                                        <button
                                            key={curr.code}
                                            onClick={() => setCurrency(curr)}
                                            className={`p-4 rounded-xl border-2 transition-all ${currency.code === curr.code
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{curr.flag}</div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{curr.code}</div>
                                            <div className="text-xs text-slate-500">{curr.symbol}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{currency.flag}</span>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {currency.name}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {currency.code} ({currency.symbol})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Exchange Rate Information */}
                            {currency.code !== 'AED' && (
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Exchange Rates
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {lastUpdate ? (
                                                    <>Last updated: {lastUpdate.toLocaleString()}</>
                                                ) : (
                                                    'No rates loaded yet'
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRefreshRates}
                                            disabled={isRefreshing}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                                            {isRefreshing ? 'Updating...' : 'Refresh Rates'}
                                        </button>
                                    </div>

                                    {isUsingCache && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                ⚠️ <strong>Using cached rates:</strong> Live rates unavailable. Click refresh to try again.
                                            </p>
                                        </div>
                                    )}

                                    {Object.keys(exchangeRates).length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                                            <div className="text-xs font-medium text-slate-500 mb-2">Current Rates (from AED)</div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                {Object.entries(exchangeRates).slice(0, 6).map(([curr, rate]) => (
                                                    <div key={curr} className="flex justify-between">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{curr}:</span>
                                                        <span className="text-slate-900 dark:text-white">{Number(rate).toFixed(4)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* General Settings */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-2xl">
                                🎨
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">General Settings</h2>
                                <p className="text-sm text-slate-500">Customize your experience</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">Notifications</div>
                                    <div className="text-sm text-slate-500">Receive updates and alerts</div>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${settings.notifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-6' : ''
                                        }`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">Language</div>
                                    <div className="text-sm text-slate-500">Select your preferred language</div>
                                </div>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="zh">中文</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Module Visibility Settings */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl">
                                📋
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Module Visibility</h2>
                                <p className="text-sm text-slate-500">Enable or disable optional dashboard modules</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'gold', name: 'Gold Asset Tracking', icon: '🥇' },
                                { id: 'stocks', name: 'Stock Portfolio', icon: '📈' },
                                { id: 'bonds', name: 'Fixed Income (Bonds)', icon: '📜' },
                                { id: 'property', name: 'Real Estate / Property', icon: '🏠' },
                                { id: 'mutualFunds', name: 'Mutual Funds', icon: '📊' },
                                { id: 'loans', name: 'Loans & Debt', icon: '💳' },
                                { id: 'insurance', name: 'Insurance Module', icon: '🛡️' }
                            ].map((module) => {
                                const isEnabled = user?.moduleVisibility?.[module.id] !== false;

                                return (
                                    <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl group transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{module.icon}</span>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white text-sm">{module.name}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const currentVisibility = user?.moduleVisibility || {
                                                    gold: true, stocks: true, bonds: true, property: true, mutualFunds: true, loans: true, insurance: true
                                                };
                                                const newVisibility = {
                                                    ...currentVisibility,
                                                    [module.id]: !isEnabled
                                                };
                                                await updateModuleVisibility(newVisibility);
                                            }}
                                            className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : ''}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Help & Support */}
                    <div id="settings-help-section" className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl">
                                ❓
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">Help & Support</h2>
                                <p className="text-sm text-slate-500">Need a refresher on how to use the app?</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Product Tour</h3>
                                    <p className="text-xs text-slate-500 mt-1">Re-run the guided introduction of Net Worth features.</p>
                                </div>
                                <button
                                    onClick={startTour}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all shadow-sm"
                                >
                                    Repeat Tour
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSaveSettings}
                            className="flex-1 lg:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                        >
                            💾 Save Settings
                        </button>
                        <button
                            onClick={() => {
                                setCurrency(CURRENCIES[0]); // Reset to AED
                                setSettings({ notifications: true, darkMode: false, language: 'en' });
                                localStorage.removeItem('appSettings');
                            }}
                            className="px-8 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
                        >
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
