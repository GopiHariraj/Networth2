"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency, CURRENCIES } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';

export default function SettingsPage() {
    const { currency, setCurrency } = useCurrency();
    const { data: networthData } = useNetWorth();
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: 'en'
    });

    const [activeGoal, setActiveGoal] = useState({
        goalNetWorth: '',
        targetDate: '',
        notes: ''
    });

    // Load active goal from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('activeGoal');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setActiveGoal(parsed);
            } catch (e) {
                console.error('Failed to load active goal', e);
            }
        }
    }, []);

    const handleSaveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        alert('Settings saved successfully! ⚙️');
    };

    // Save active goal to localStorage
    const saveActiveGoal = () => {
        if (activeGoal.goalNetWorth && activeGoal.targetDate) {
            const goalData = {
                ...activeGoal,
                currentNetWorth: networthData.netWorth,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('activeGoal', JSON.stringify(goalData));
            // Trigger storage event for dashboard update
            window.dispatchEvent(new Event('storage'));
            alert('✅ Goal saved and synced to Dashboard!');
        } else {
            alert('⚠️ Please enter both Goal Net Worth and Target Date');
        }
    };

    // Export all data as backup
    const handleExportData = () => {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            appName: 'Net Worth Tracker',
            data: {
                activeGoal: localStorage.getItem('activeGoal'),
                appSettings: localStorage.getItem('appSettings'),
                currency: localStorage.getItem('currency'),
                // Add all other localStorage keys
                ...Object.keys(localStorage).reduce((acc, key) => {
                    acc[key] = localStorage.getItem(key);
                    return acc;
                }, {} as Record<string, string | null>)
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `networth-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('✅ Backup downloaded successfully!');
    };

    // Import data from backup file
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target?.result as string);

                // Validate format
                if (backup.version && backup.data) {
                    // Clear existing data
                    const confirmRestore = window.confirm(
                        '⚠️ This will replace all your current data. Continue?'
                    );

                    if (confirmRestore) {
                        // Restore data
                        Object.keys(backup.data).forEach(key => {
                            if (backup.data[key] !== null) {
                                localStorage.setItem(key, backup.data[key]);
                            }
                        });
                        alert('✅ Data restored successfully! Page will reload.');
                        window.location.reload();
                    }
                } else {
                    alert('❌ Invalid backup file format');
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

                    {/* Active Goal Management */}
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg border border-purple-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                                🎯
                            </div>
                            <div>
                                <h2 className="font-bold text-white">Active Net Worth Goal</h2>
                                <p className="text-sm text-purple-100">Syncs to your dashboard</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-purple-100 mb-2">
                                    Goal Net Worth ({currency.code})
                                </label>
                                <input
                                    type="number"
                                    value={activeGoal.goalNetWorth}
                                    onChange={(e) => setActiveGoal({ ...activeGoal, goalNetWorth: e.target.value })}
                                    placeholder="e.g., 5000000"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-purple-100 mb-2">
                                    Target Date
                                </label>
                                <input
                                    type="date"
                                    value={activeGoal.targetDate}
                                    onChange={(e) => setActiveGoal({ ...activeGoal, targetDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-purple-100 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={activeGoal.notes}
                                onChange={(e) => setActiveGoal({ ...activeGoal, notes: e.target.value })}
                                placeholder="Add any notes about your goal..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                            />
                        </div>

                        <button
                            onClick={saveActiveGoal}
                            className="w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
                        >
                            💾 Save Goal & Sync to Dashboard
                        </button>
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
