"use client";

import React, { useState } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { depreciatingAssetsApi } from '../../lib/api/client';
import { Plus, Edit2, Trash2, TrendingDown, Calendar, DollarSign, Tag } from 'lucide-react';

export default function DepreciatingAssetsPage() {
    const { currency, convert } = useCurrency();
    const { data, updateDepreciatingAssets, refreshNetWorth } = useNetWorth();
    const { items, totalValue } = data.assets.depreciatingAssets;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'Electronics',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        depreciationRate: '10',
        notes: ''
    });

    const assetTypes = ['Electronics', 'Vehicle', 'Appliance', 'Furniture', 'Other'];

    const handleOpenModal = (asset?: any) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                name: asset.name,
                type: asset.type,
                purchasePrice: asset.purchasePrice.toString(),
                purchaseDate: new Date(asset.purchaseDate).toISOString().split('T')[0],
                depreciationRate: asset.depreciationRate.toString(),
                notes: asset.notes || ''
            });
        } else {
            setEditingAsset(null);
            setFormData({
                name: '',
                type: 'Electronics',
                purchasePrice: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                depreciationRate: '10',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                purchasePrice: parseFloat(formData.purchasePrice),
                depreciationRate: parseFloat(formData.depreciationRate)
            };

            if (editingAsset) {
                await depreciatingAssetsApi.update(editingAsset.id, payload);
            } else {
                await depreciatingAssetsApi.create(payload);
            }

            await updateDepreciatingAssets();
            await refreshNetWorth();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save asset', error);
            alert('Failed to save asset');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        setIsLoading(true);
        try {
            await depreciatingAssetsApi.delete(id);
            await updateDepreciatingAssets();
            await refreshNetWorth();
        } catch (error) {
            console.error('Failed to delete asset', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📉 Depreciating Assets</h1>
                        <p className="text-slate-500 mt-2">Track value of vehicles, electronics, and other depreciating items</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        Add Asset
                    </button>
                </header>

                {/* Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Total Current Value</div>
                        <div className="text-4xl font-black">{currency.symbol} {convert(totalValue, 'AED').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>

                {/* Assets List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Value</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Depr. Rate</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No depreciating assets added yet.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                                                <div className="text-xs text-slate-400 mt-1">Bought: {new Date(asset.purchaseDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {asset.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {currency.symbol} {convert(asset.purchasePrice, 'AED').toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {currency.symbol} {convert(asset.currentValue, 'AED').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                    <TrendingDown className="w-3 h-3" />
                                                    {((1 - (asset.currentValue / asset.purchasePrice)) * 100).toFixed(1)}% drop
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {asset.depreciationRate}% / yr
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(asset)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl w-full max-w-lg animate-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., MacBook Pro M3"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Purchase Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.purchaseDate}
                                            onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Purchase Price ({currency.symbol})</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.purchasePrice}
                                            onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Depreciation Rate (%/yr)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={formData.depreciationRate}
                                            onChange={e => setFormData({ ...formData, depreciationRate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                        placeholder="Optional details..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mt-4"
                                >
                                    {isLoading ? 'Saving...' : (editingAsset ? 'Save Changes' : 'Add Asset')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
