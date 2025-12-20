"use client";

import React, { useState } from 'react';
import { useCurrency, CURRENCIES } from '../../lib/currency-context';

export default function SettingsPage() {
    const { currency, setCurrency } = useCurrency();
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        language: 'en'
    });

    const handleSaveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        alert('Settings saved successfully! ⚙️');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">⚙️ Settings</h1>
                    <p className="text-slate-500 mt-2">Manage your preferences and application settings</p>
                </header>

                <div className="space-y-6">
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
