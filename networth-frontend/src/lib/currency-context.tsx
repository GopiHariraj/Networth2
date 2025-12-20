"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    flag: string;
}

export const CURRENCIES: Currency[] = [
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', flag: '🇴🇲' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', flag: '🇧🇭' },
];

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default to AED

    useEffect(() => {
        // Load saved currency from localStorage
        const savedCurrencyCode = localStorage.getItem('preferredCurrency');
        if (savedCurrencyCode) {
            const savedCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
            if (savedCurrency) {
                setCurrencyState(savedCurrency);
            }
        }
    }, []);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('preferredCurrency', newCurrency.code);
    };

    const formatAmount = (amount: number): string => {
        return `${currency.symbol} ${amount.toLocaleString()}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
