"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';

interface Stock {
    id: string;
    market: string;
    stockName: string;
    units: number;
    unitPrice: number;
    totalValue: number;
    purchaseDate: string;
}

export default function StocksPage() {
    const { currency } = useCurrency();
    const { updateStocks } = useNetWorth();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        market: 'NASDAQ',
        stockName: '',
        units: '',
        unitPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    // Load stocks from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('networth-stocks');
        if (saved) {
            try {
                setStocks(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load stocks data', e);
            }
        }
    }, []);

    const markets = [
        'NASDAQ',
        'NYSE',
        'DFM (Dubai)',
        'ADX (Abu Dhabi)',
        'TADAWUL (Saudi)',
        'LSE (London)',
        'BSE (Bombay)',
        'NSE (India)',
        'Other'
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const calculateTotalValue = () => {
        const units = parseFloat(formData.units) || 0;
        const price = parseFloat(formData.unitPrice) || 0;
        return units * price;
    };

    const handleEdit = (stock: Stock) => {
        setEditingId(stock.id);
        setFormData({
            market: stock.market,
            stockName: stock.stockName,
            units: stock.units.toString(),
            unitPrice: stock.unitPrice.toString(),
            purchaseDate: stock.purchaseDate
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddStock = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.stockName || !formData.units || !formData.unitPrice) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingId) {
            // Update existing stock
            const updatedStocks = stocks.map(stock =>
                stock.id === editingId
                    ? {
                        ...stock,
                        market: formData.market,
                        stockName: formData.stockName,
                        units: parseFloat(formData.units),
                        unitPrice: parseFloat(formData.unitPrice),
                        totalValue: calculateTotalValue(),
                        purchaseDate: formData.purchaseDate
                    }
                    : stock
            );
            setStocks(updatedStocks);
            updateStocks(updatedStocks);
            setEditingId(null);
        } else {
            // Add new stock
            const newStock: Stock = {
                id: Date.now().toString(),
                market: formData.market,
                stockName: formData.stockName,
                units: parseFloat(formData.units),
                unitPrice: parseFloat(formData.unitPrice),
                totalValue: calculateTotalValue(),
                purchaseDate: formData.purchaseDate
            };

            const updatedStocks = [...stocks, newStock];
            setStocks(updatedStocks);
            updateStocks(updatedStocks);
        }

        // Reset form
        setFormData({
            market: 'NASDAQ',
            stockName: '',
            units: '',
            unitPrice: '',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            market: 'NASDAQ',
            stockName: '',
            units: '',
            unitPrice: '',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteStock = (id: string) => {
        if (confirm('Are you sure you want to delete this stock?')) {
            const updatedStocks = stocks.filter(stock => stock.id !== id);
            setStocks(updatedStocks);

            // Save to localStorage and trigger net worth update
            updateStocks(updatedStocks);
        }
    };

    const getTotalPortfolioValue = () => {
        return stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📈 Stock Portfolio</h1>
                    <p className="text-slate-500 mt-2">Manage your stock investments and track portfolio value</p>
                </header>

                {/* Portfolio Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Portfolio Value</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalPortfolioValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Total Holdings</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stocks.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Markets</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{new Set(stocks.map(s => s.market)).size}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add/Edit Stock Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                                {editingId ? '✏️ Edit Stock' : '➕ Add Stock'}
                            </h2>

                            <form onSubmit={handleAddStock} className="space-y-4">
                                {/* Market Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Market / Exchange
                                    </label>
                                    <select
                                        value={formData.market}
                                        onChange={(e) => handleInputChange('market', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {markets.map(market => (
                                            <option key={market} value={market}>{market}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Stock Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Stock Name / Symbol *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.stockName}
                                        onChange={(e) => handleInputChange('stockName', e.target.value)}
                                        placeholder="e.g., AAPL, TSLA, Google"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Units */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Number of Units *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.units}
                                        onChange={(e) => handleInputChange('units', e.target.value)}
                                        placeholder="e.g., 100"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Unit Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Unit Price ({currency.code}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.unitPrice}
                                        onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                                        placeholder="e.g., 150.50"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Total Value Preview */}
                                {(formData.units && formData.unitPrice) && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Total Value</div>
                                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                                            {currency.symbol} {calculateTotalValue().toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex gap-2">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                                        >
                                            ✖️ Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                                    >
                                        {editingId ? '💾 Update Stock' : '➕ Add Stock to Portfolio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Stocks Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📊 Your Holdings</h2>
                            </div>

                            {stocks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">📈</div>
                                    <div className="text-slate-500 dark:text-slate-400">No stocks added yet</div>
                                    <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Add your first stock using the form</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Market</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Stock</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Units</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Unit Price</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total Value</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {stocks.map((stock) => (
                                                <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                                                            {stock.market}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 dark:text-white">{stock.stockName}</div>
                                                        <div className="text-xs text-slate-500">{new Date(stock.purchaseDate).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-medium">
                                                        {stock.units.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                                                        {currency.symbol} {stock.unitPrice.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-green-600 dark:text-green-400">
                                                            {currency.symbol} {stock.totalValue.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => handleEdit(stock)}
                                                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteStock(stock.id)}
                                                                className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
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
