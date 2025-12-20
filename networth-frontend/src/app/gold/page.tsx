"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import ImageLightbox from '../../components/ImageLightbox';

interface GoldOrnament {
    id: string;
    ornamentName: string;
    grams: number;
    pricePerGram: number;
    totalValue: number;
    purchaseDate: string;
    purity: string;
    imageUrl?: string;
}

export default function GoldPage() {
    const { currency } = useCurrency();
    const { updateGold } = useNetWorth();
    const [ornaments, setOrnaments] = useState<GoldOrnament[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [formData, setFormData] = useState({
        ornamentName: '',
        grams: '',
        pricePerGram: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purity: '24K',
        imageUrl: ''
    });

    // Load ornaments from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('networth-gold');
        if (saved) {
            try {
                setOrnaments(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load gold data', e);
            }
        }
    }, []);

    const ornamentTypes = [
        'Necklace',
        'Ring',
        'Bracelet',
        'Earrings',
        'Chain',
        'Bangle',
        'Anklet',
        'Coin',
        'Bar',
        'Other'
    ];

    const purityOptions = ['24K', '22K', '18K', '14K', '10K'];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Convert image to base64 for storage
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateTotalValue = () => {
        const grams = parseFloat(formData.grams) || 0;
        const price = parseFloat(formData.pricePerGram) || 0;
        return grams * price;
    };

    const handleEdit = (ornament: GoldOrnament) => {
        setEditingId(ornament.id);
        setFormData({
            ornamentName: ornament.ornamentName,
            grams: ornament.grams.toString(),
            pricePerGram: ornament.pricePerGram.toString(),
            purchaseDate: ornament.purchaseDate,
            purity: ornament.purity,
            imageUrl: ornament.imageUrl || ''
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddOrnament = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ornamentName || !formData.grams || !formData.pricePerGram) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingId) {
            // Update existing ornament
            const updatedOrnaments = ornaments.map(ornament =>
                ornament.id === editingId
                    ? {
                        ...ornament,
                        ornamentName: formData.ornamentName,
                        grams: parseFloat(formData.grams),
                        pricePerGram: parseFloat(formData.pricePerGram),
                        totalValue: calculateTotalValue(),
                        purchaseDate: formData.purchaseDate,
                        purity: formData.purity,
                        imageUrl: formData.imageUrl
                    }
                    : ornament
            );
            setOrnaments(updatedOrnaments);
            updateGold(updatedOrnaments);
            setEditingId(null);
        } else {
            // Add new ornament
            const newOrnament: GoldOrnament = {
                id: Date.now().toString(),
                ornamentName: formData.ornamentName,
                grams: parseFloat(formData.grams),
                pricePerGram: parseFloat(formData.pricePerGram),
                totalValue: calculateTotalValue(),
                purchaseDate: formData.purchaseDate,
                purity: formData.purity,
                imageUrl: formData.imageUrl
            };

            const updatedOrnaments = [...ornaments, newOrnament];
            setOrnaments(updatedOrnaments);
            updateGold(updatedOrnaments);
        }

        // Reset form
        setFormData({
            ornamentName: '',
            grams: '',
            pricePerGram: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            purity: '24K',
            imageUrl: ''
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            ornamentName: '',
            grams: '',
            pricePerGram: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            purity: '24K',
            imageUrl: ''
        });
    };

    const handleDeleteOrnament = (id: string) => {
        if (confirm('Are you sure you want to delete this ornament?')) {
            const updatedOrnaments = ornaments.filter(ornament => ornament.id !== id);
            setOrnaments(updatedOrnaments);

            // Save to localStorage and trigger net worth update
            updateGold(updatedOrnaments);
        }
    };

    const handleImageDownload = async (imageUrl: string, index: number) => {
        try {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `gold-photo-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image');
        }
    };

    const getTotalGrams = () => {
        return ornaments.reduce((sum, ornament) => sum + ornament.grams, 0);
    };

    const getTotalValue = () => {
        return ornaments.reduce((sum, ornament) => sum + ornament.totalValue, 0);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🥇 Gold Inventory</h1>
                    <p className="text-slate-500 mt-2">Track your gold ornaments and investment value</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Gold Weight</div>
                        <div className="text-3xl font-bold mt-2">{getTotalGrams().toLocaleString()} grams</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Value</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Total Items</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{ornaments.length}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add/Edit Ornament Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                                {editingId ? '✏️ Edit Gold Item' : '➕ Add Gold Item'}
                            </h2>

                            <form onSubmit={handleAddOrnament} className="space-y-4">
                                {/* Ornament Name/Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Ornament Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ornamentName}
                                        onChange={(e) => handleInputChange('ornamentName', e.target.value)}
                                        placeholder="e.g., Gold Necklace, Wedding Ring"
                                        required
                                        list="ornament-types"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                    <datalist id="ornament-types">
                                        {ornamentTypes.map(type => (
                                            <option key={type} value={type} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Purity */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Purity/Karat
                                    </label>
                                    <select
                                        value={formData.purity}
                                        onChange={(e) => handleInputChange('purity', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    >
                                        {purityOptions.map(purity => (
                                            <option key={purity} value={purity}>{purity}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grams */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Weight (Grams) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={formData.grams}
                                        onChange={(e) => handleInputChange('grams', e.target.value)}
                                        placeholder="e.g., 25.5"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                </div>

                                {/* Price per Gram */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Price per Gram ({currency.code}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.pricePerGram}
                                        onChange={(e) => handleInputChange('pricePerGram', e.target.value)}
                                        placeholder="e.g., 250"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
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
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Photo (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200 file:cursor-pointer"
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-3">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-xl border-2 border-yellow-200 dark:border-yellow-800"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Total Value Preview */}
                                {(formData.grams && formData.pricePerGram) && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                        <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Total Value</div>
                                        <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
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
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-600/20"
                                    >
                                        {editingId ? '💾 Update Item' : '➕ Add to Inventory'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Ornaments Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📋 Gold Inventory</h2>
                            </div>

                            {ornaments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-6xl mb-4">🥇</div>
                                    <div className="text-slate-500 dark:text-slate-400">No gold items added yet</div>
                                    <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Add your first gold ornament using the form</div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Photo</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Ornament</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Purity</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Grams</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Price/Gram</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total Value</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {ornaments.map((ornament) => (
                                                <tr key={ornament.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        {ornament.imageUrl ? (
                                                            <div className="relative group">
                                                                <img
                                                                    src={ornament.imageUrl}
                                                                    alt={ornament.ornamentName}
                                                                    className="w-16 h-16 object-cover rounded-lg border-2 border-amber-200 dark:border-amber-800 cursor-pointer hover:scale-110 hover:shadow-lg transition-all"
                                                                    onClick={() => {
                                                                        setLightboxImages([ornament.imageUrl!]);
                                                                        setLightboxIndex(0);
                                                                        setLightboxOpen(true);
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all pointer-events-none">
                                                                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-2xl">
                                                                🥇
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900 dark:text-white">{ornament.ornamentName}</div>
                                                        <div className="text-xs text-slate-500">{new Date(ornament.purchaseDate).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">
                                                            {ornament.purity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-bold text-slate-900 dark:text-white">
                                                            {ornament.grams.toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-slate-500 ml-1">g</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                                                        {currency.symbol} {ornament.pricePerGram.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-green-600 dark:text-green-400">
                                                            {currency.symbol} {ornament.totalValue.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button
                                                                onClick={() => handleEdit(ornament)}
                                                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOrnament(ornament.id)}
                                                                className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr className="font-bold">
                                                <td className="px-6 py-4 text-slate-900 dark:text-white" colSpan={3}>Total</td>
                                                <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                                                    {getTotalGrams().toLocaleString()} g
                                                </td>
                                                <td className="px-6 py-4"></td>
                                                <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                                                    {currency.symbol} {getTotalValue().toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Lightbox */}
            <ImageLightbox
                images={lightboxImages}
                currentIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onDownload={handleImageDownload}
            />
        </div>
    );
}
