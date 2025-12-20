"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';

interface Property {
    id: string;
    propertyName: string;
    propertyType: string;
    location: string;
    address: string;
    purchasePrice: number;
    currentValue: number;
    purchaseDate: string;
    area: number;
    imageUrl?: string;
}

export default function PropertyPage() {
    const { currency } = useCurrency();
    const { updateProperty } = useNetWorth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [formData, setFormData] = useState({
        propertyName: '',
        propertyType: 'Apartment',
        location: '',
        address: '',
        purchasePrice: '',
        currentValue: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        area: '',
        imageUrl: ''
    });

    // Load properties from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('networth-property');
        if (saved) {
            try {
                setProperties(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load property data', e);
            }
        }
    }, []);

    const propertyTypes = [
        'Apartment',
        'Villa',
        'Townhouse',
        'Penthouse',
        'Studio',
        'Land/Plot',
        'Commercial',
        'Office',
        'Warehouse',
        'Building'
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddProperty = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.propertyName || !formData.location || !formData.purchasePrice || !formData.currentValue) {
            alert('Please fill in all required fields');
            return;
        }

        const newProperty: Property = {
            id: Date.now().toString(),
            propertyName: formData.propertyName,
            propertyType: formData.propertyType,
            location: formData.location,
            address: formData.address,
            purchasePrice: parseFloat(formData.purchasePrice),
            currentValue: parseFloat(formData.currentValue),
            purchaseDate: formData.purchaseDate,
            area: parseFloat(formData.area),
            imageUrl: formData.imageUrl
        };

        const updatedProperties = [...properties, newProperty];
        setProperties(updatedProperties);

        // Save to localStorage and trigger net worth update
        updateProperty(updatedProperties);

        // Reset form
        setFormData({
            propertyName: '',
            propertyType: 'Apartment',
            location: '',
            address: '',
            purchasePrice: '',
            currentValue: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            area: '',
            imageUrl: ''
        });
    };

    const handleDeleteProperty = (id: string) => {
        if (confirm('Are you sure you want to delete this property?')) {
            const updatedProperties = properties.filter(property => property.id !== id);
            setProperties(updatedProperties);

            // Save to localStorage and trigger net worth update
            updateProperty(updatedProperties);
        }
    };

    const getTotalValue = () => {
        return properties.reduce((sum, property) => sum + property.currentValue, 0);
    };

    const getTotalInvestment = () => {
        return properties.reduce((sum, property) => sum + property.purchasePrice, 0);
    };

    const getTotalGainLoss = () => {
        return getTotalValue() - getTotalInvestment();
    };

    const getGainLossPercentage = () => {
        const investment = getTotalInvestment();
        if (investment === 0) return 0;
        return ((getTotalGainLoss() / investment) * 100);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🏠 Property Portfolio</h1>
                    <p className="text-slate-500 mt-2">Manage your real estate investments and track property values</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Value</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Investment</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {getTotalInvestment().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Gain/Loss</div>
                        <div className={`text-2xl font-bold mt-2 ${getTotalGainLoss() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {getTotalGainLoss() >= 0 ? '+' : ''}{currency.symbol} {getTotalGainLoss().toLocaleString()}
                        </div>
                        <div className={`text-xs ${getTotalGainLoss() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {getTotalGainLoss() >= 0 ? '+' : ''}{getGainLossPercentage().toFixed(2)}%
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Properties</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{properties.length}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Property Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">➕ Add Property</h2>

                            <form onSubmit={handleAddProperty} className="space-y-4">
                                {/* Property Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Property Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.propertyName}
                                        onChange={(e) => handleInputChange('propertyName', e.target.value)}
                                        placeholder="e.g., Downtown Apartment"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Property Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Property Type *
                                    </label>
                                    <select
                                        value={formData.propertyType}
                                        onChange={(e) => handleInputChange('propertyType', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        {propertyTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Location/City *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        placeholder="e.g., Dubai Marina"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Full Address
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        placeholder="Full property address"
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Area */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Area (sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.area}
                                        onChange={(e) => handleInputChange('area', e.target.value)}
                                        placeholder="e.g., 1200"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
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
                                        placeholder="e.g., 1500000"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Current Value */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Current Value ({currency.code}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.currentValue}
                                        onChange={(e) => handleInputChange('currentValue', e.target.value)}
                                        placeholder="e.g., 1750000"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
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
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Property Photo (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 file:cursor-pointer"
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-3">
                                            <img
                                                src={formData.imageUrl}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-xl border-2 border-orange-200 dark:border-orange-800"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/20"
                                >
                                    ➕ Add Property to Portfolio
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Properties Grid */}
                    <div className="lg:col-span-2">
                        {properties.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                                <div className="text-6xl mb-4">🏠</div>
                                <div className="text-slate-500 dark:text-slate-400">No properties added yet</div>
                                <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Add your first property using the form</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {properties.map((property) => {
                                    const gainLoss = property.currentValue - property.purchasePrice;
                                    const gainLossPercentage = ((gainLoss / property.purchasePrice) * 100);

                                    return (
                                        <div key={property.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="grid grid-cols-1 md:grid-cols-3">
                                                {/* Image Section */}
                                                <div className="md:col-span-1">
                                                    {property.imageUrl ? (
                                                        <img
                                                            src={property.imageUrl}
                                                            alt={property.propertyName}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(property.imageUrl, '_blank')}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 flex items-center justify-center">
                                                            <div className="text-6xl">🏠</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details Section */}
                                                <div className="md:col-span-2 p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{property.propertyName}</h3>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold">
                                                                    {property.propertyType}
                                                                </span>
                                                                <span className="text-sm text-slate-500">📍 {property.location}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteProperty(property.id)}
                                                            className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>

                                                    {property.address && (
                                                        <p className="text-sm text-slate-500 mb-4">📮 {property.address}</p>
                                                    )}

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        {property.area > 0 && (
                                                            <div>
                                                                <div className="text-xs text-slate-500">Area</div>
                                                                <div className="font-semibold text-slate-900 dark:text-white">{property.area.toLocaleString()} sq ft</div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-xs text-slate-500">Purchase Price</div>
                                                            <div className="font-semibold text-slate-900 dark:text-white">{currency.symbol} {property.purchasePrice.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-500">Current Value</div>
                                                            <div className="font-semibold text-slate-900 dark:text-white">{currency.symbol} {property.currentValue.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-500">Gain/Loss</div>
                                                            <div className={`font-bold ${gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {gainLoss >= 0 ? '+' : ''}{currency.symbol} {gainLoss.toLocaleString()}
                                                                <div className="text-xs">{gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-slate-400">
                                                        Purchased: {new Date(property.purchaseDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
