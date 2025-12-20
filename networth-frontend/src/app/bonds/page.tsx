"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';

interface Bond {
    id: string;
    companyName: string;
    bondType: string;
    interestRate: number;
    faceValue: number;
    purchasePrice: number;
    maturityDate: string;
    purchaseDate: string;
    currentValue: number;
}

export default function BondsPage() {
    const { currency } = useCurrency();
    const { updateBonds } = useNetWorth();
    const [bonds, setBonds] = useState<Bond[]>([]);
    const [formData, setFormData] = useState({
        companyName: '',
        bondType: 'Corporate',
        interestRate: '',
        faceValue: '',
        purchasePrice: '',
        maturityDate: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    // Load bonds from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('networth-bonds');
        if (saved) {
            try {
                setBonds(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load bonds data', e);
            }
        }
    }, []);

    const bondTypes = [
        'Corporate',
        'Government',
        'Municipal',
        'Treasury',
        'High Yield',
        'Investment Grade',
        'Zero Coupon',
        'Convertible'
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateCurrentValue = () => {
        return parseFloat(formData.purchasePrice) || 0;
    };

    const handleAddBond = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.interestRate || !formData.faceValue || !formData.purchasePrice || !formData.maturityDate) {
            alert('Please fill in all required fields');
            return;
        }

        const newBond: Bond = {
            id: Date.now().toString(),
            companyName: formData.companyName,
            bondType: formData.bondType,
            interestRate: parseFloat(formData.interestRate),
            faceValue: parseFloat(formData.faceValue),
            purchasePrice: parseFloat(formData.purchasePrice),
            maturityDate: formData.maturityDate,
            purchaseDate: formData.purchaseDate,
            currentValue: calculateCurrentValue()
        };

        const updatedBonds = [...bonds, newBond];
        setBonds(updatedBonds);

        // Save to localStorage and trigger net worth update
        updateBonds(updatedBonds);

        // Reset form
        setFormData({
            companyName: '',
            bondType: 'Corporate',
            interestRate: '',
            faceValue: '',
            purchasePrice: '',
            maturityDate: '',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteBond = (id: string) => {
        if (confirm('Are you sure you want to delete this bond?')) {
            const updatedBonds = bonds.filter(bond => bond.id !== id);
            setBonds(updatedBonds);

            // Save to localStorage and trigger net worth update
            updateBonds(updatedBonds);
        }
    };

    const getTotalValue = () => {
        return bonds.reduce((sum, bond) => sum + bond.currentValue, 0);
    };

    const getTotalFaceValue = () => {
        return bonds.reduce((sum, bond) => sum + bond.faceValue, 0);
    };

    const getAverageInterestRate = () => {
        if (bonds.length === 0) return 0;
        const total = bonds.reduce((sum, bond) => sum + bond.interestRate, 0);
        return total / bonds.length;
    };

    const getDaysToMaturity = (maturityDate: string) => {
        const today = new Date();
        const maturity = new Date(maturityDate);
        const diffTime = maturity.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📜 Bond Portfolio</h1>
                    <p className="text-slate-500 mt-2">Track your fixed income investments and maturity dates</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Value</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Face Value</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {getTotalFaceValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Avg Interest Rate</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{getAverageInterestRate().toFixed(2)}%</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Total Bonds</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{bonds.length}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Bond Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">➕ Add Bond</h2>

                            <form onSubmit={handleAddBond} className="space-y-4">
                                {/* Company/Issuer Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Company/Issuer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        placeholder="e.g., Tesla Inc., US Treasury"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Bond Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Bond Type
                                    </label>
                                    <select
                                        value={formData.bondType}
                                        onChange={(e) => handleInputChange('bondType', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {bondTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Interest Rate */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Interest Rate (%) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.interestRate}
                                        onChange={(e) => handleInputChange('interestRate', e.target.value)}
                                        placeholder="e.g., 5.5"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Face Value */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Face Value ({currency.code}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.faceValue}
                                        onChange={(e) => handleInputChange('faceValue', e.target.value)}
                                        placeholder="e.g., 10000"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Purchase Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Purchase Price ({currency.code}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                                        placeholder="e.g., 9800"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Maturity Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Maturity Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.maturityDate}
                                        onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Purchase Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    ➕ Add Bond to Portfolio
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Bonds Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📊 Your Bonds</h2>
                            </div>

                            {bonds.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">📜</div>
                                    <div className="text-slate-500 dark:text-slate-400">No bonds added yet</div>
                                    <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Add your first bond using the form</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Company</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Type</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Interest Rate</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Face Value</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Current Value</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Maturity</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {bonds.map((bond) => {
                                                const daysToMaturity = getDaysToMaturity(bond.maturityDate);
                                                const isMatured = daysToMaturity < 0;

                                                return (
                                                    <tr key={bond.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900 dark:text-white">{bond.companyName}</div>
                                                            <div className="text-xs text-slate-500">Purchased: {new Date(bond.purchaseDate).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-semibold">
                                                                {bond.bondType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-bold text-green-600 dark:text-green-400">
                                                                {bond.interestRate.toFixed(2)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                                                            {currency.symbol} {bond.faceValue.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {currency.symbol} {bond.currentValue.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {new Date(bond.maturityDate).toLocaleDateString()}
                                                            </div>
                                                            <div className={`text-xs ${isMatured ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                                                                {isMatured ? 'Matured' : `${daysToMaturity} days`}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => handleDeleteBond(bond.id)}
                                                                className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
