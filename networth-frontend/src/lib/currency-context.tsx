"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { financialDataApi } from './api/financial-data';

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
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
];

interface ExchangeRates {
    [currencyCode: string]: number;
}

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
    resetCurrency: () => void;
    exchangeRates: ExchangeRates;
    lastUpdate: Date | null;
    isUsingCache: boolean;
    updateExchangeRates: () => Promise<void>;
    convert: (amount: number, fromCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default to AED
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isUsingCache, setIsUsingCache] = useState(false);

    // Load user and currency preference
    useEffect(() => {
        const loadInitialCurrency = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    const userId = user.id;
                    setCurrentUserId(userId);

                    // Priority 1: User object from login/me response
                    if (user.currency) {
                        const userCurrency = CURRENCIES.find(c => c.code === user.currency);
                        if (userCurrency) {
                            setCurrencyState(userCurrency);
                            return;
                        }
                    }

                    // Priority 2: User-specific currency preference in localStorage
                    const savedCurrencyCode = localStorage.getItem(`preferredCurrency_${userId}`);
                    if (savedCurrencyCode) {
                        const savedCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
                        if (savedCurrency) {
                            setCurrencyState(savedCurrency);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Error loading user currency preference:', e);
                }
            }
            // Default: AED
            setCurrencyState(CURRENCIES[0]);
        };

        loadInitialCurrency();

        // Listen for login/logout events
        const handleLogin = (e: any) => {
            loadInitialCurrency();
        };

        const handleLogout = () => {
            resetCurrency();
        };

        window.addEventListener('userLogin', handleLogin);
        window.addEventListener('userLogout', handleLogout);

        return () => {
            window.removeEventListener('userLogin', handleLogin);
            window.removeEventListener('userLogout', handleLogout);
        };
    }, []);

    // Fetch exchange rates when currency changes or on mount
    useEffect(() => {
        if (currentUserId) {
            fetchExchangeRates();
        }
    }, [currency, currentUserId]);

    const fetchExchangeRates = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exchange-rates`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }

            const data = await response.json();

            setExchangeRates(data.rates || {});
            setLastUpdate(data.fetchedAt ? new Date(data.fetchedAt) : new Date());
            setIsUsingCache(data.usingCache || false);
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            // Keep existing rates if fetch fails
        }
    };

    const updateExchangeRates = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/exchange-rates/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to refresh exchange rates');
            }

            const data = await response.json();

            setExchangeRates(data.rates || {});
            setLastUpdate(data.fetchedAt ? new Date(data.fetchedAt) : new Date());
            setIsUsingCache(false);
        } catch (error) {
            console.error('Failed to refresh exchange rates:', error);
            throw error;
        }
    };

    const setCurrency = async (newCurrency: Currency) => {
        setCurrencyState(newCurrency);

        // Save with user-specific key
        if (currentUserId) {
            localStorage.setItem(`preferredCurrency_${currentUserId}`, newCurrency.code);

            // Also update the user object in localStorage for consistency
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    user.currency = newCurrency.code;
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (e) {
                    console.error('Failed to update user object with new currency:', e);
                }
            }

            // Update on backend
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/currency`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ currency: newCurrency.code }),
                    });
                }
            } catch (error) {
                console.error('Failed to update currency preference:', error);
            }
        }
    };

    const resetCurrency = () => {
        setCurrencyState(CURRENCIES[0]);
        setCurrentUserId(null);
    };

    const formatAmount = (amount: number): string => {
        return `${currency.symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    /**
     * Convert amount from one currency to display currency
     * @param amount - The amount to convert
     * @param fromCurrency - The currency code the amount is in (e.g., 'AED', 'USD')
     * @returns Converted amount in display currency
     */
    const convert = (amount: number, fromCurrency: string = 'AED'): number => {
        // If same currency, no conversion needed
        if (fromCurrency === currency.code) {
            return amount;
        }

        // If no exchange rates loaded, return original amount
        if (Object.keys(exchangeRates).length === 0) {
            return amount;
        }

        try {
            // Convert through AED as base currency
            let amountInAED = amount;

            // If fromCurrency is not AED, convert to AED first
            if (fromCurrency !== 'AED') {
                const rateToAED = exchangeRates[fromCurrency];
                if (!rateToAED) {
                    console.warn(`No exchange rate found for ${fromCurrency}, using original amount`);
                    return amount;
                }
                // If rate is AED->USD = 0.27, then USD->AED = 1/0.27
                amountInAED = amount / rateToAED;
            }

            // Now convert from AED to target currency
            if (currency.code === 'AED') {
                return amountInAED;
            }

            const rateFromAED = exchangeRates[currency.code];
            if (!rateFromAED) {
                console.warn(`No exchange rate found for ${currency.code}, using original amount`);
                return amount;
            }

            return amountInAED * rateFromAED;
        } catch (error) {
            console.error('Currency conversion error:', error);
            return amount;
        }
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            formatAmount,
            resetCurrency,
            exchangeRates,
            lastUpdate,
            isUsingCache,
            updateExchangeRates,
            convert,
        }}>
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
