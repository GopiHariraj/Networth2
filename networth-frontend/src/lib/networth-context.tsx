"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { financialDataApi } from './api/financial-data';

interface AssetItem {
    id: string;
    [key: string]: any;
}

interface NetWorthData {
    assets: {
        gold: { items: AssetItem[]; totalValue: number };
        bonds: { items: AssetItem[]; totalValue: number };
        stocks: { items: AssetItem[]; totalValue: number };
        property: { items: AssetItem[]; totalValue: number };
        mutualFunds: { items: AssetItem[]; totalValue: number };
        cash: {
            bankAccounts: AssetItem[];
            wallets: AssetItem[];
            totalBank: number;
            totalWallet: number;
            totalCash: number;
        };
    };
    liabilities: {
        loans: { items: AssetItem[]; totalValue: number };
        creditCards: { items: AssetItem[]; totalValue: number };
    };
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    lastUpdated: string;
}

interface NetWorthContextType {
    data: NetWorthData;
    updateGold: (items: AssetItem[]) => Promise<void>;
    updateBonds: (items: AssetItem[]) => void;
    updateStocks: (items: AssetItem[]) => Promise<void>;
    updateProperty: (items: AssetItem[]) => Promise<void>;
    updateMutualFunds: (items: AssetItem[]) => void;
    updateCash: (bankAccounts: AssetItem[], wallets: AssetItem[]) => Promise<void>;
    updateLoans: (items: AssetItem[]) => Promise<void>;
    updateCreditCards: (items: AssetItem[]) => void;
    refreshNetWorth: () => Promise<void>;
    resetNetWorth: () => void;
    isLoading: boolean;
}

const NetWorthContext = createContext<NetWorthContextType | undefined>(undefined);

export function NetWorthProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Raw data states for "super fast" response
    const [goldItems, setGoldItems] = useState<AssetItem[]>([]);
    const [bondItems, setBondItems] = useState<AssetItem[]>([]);
    const [stockItems, setStockItems] = useState<AssetItem[]>([]);
    const [propertyItems, setPropertyItems] = useState<AssetItem[]>([]);
    const [mutualFundItems, setMutualFundItems] = useState<AssetItem[]>([]);
    const [bankAccounts, setBankAccounts] = useState<AssetItem[]>([]);
    const [wallets, setWallets] = useState<AssetItem[]>([]);
    const [loanItems, setLoanItems] = useState<AssetItem[]>([]);
    const [creditCardItems, setCreditCardItems] = useState<AssetItem[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

    // Individual loaders for category-specific refreshes
    const loadGold = async () => {
        try {
            const res = await financialDataApi.goldAssets.getAll();
            setGoldItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading gold:', e); }
    };

    const loadStocks = async () => {
        try {
            const res = await financialDataApi.stockAssets.getAll();
            setStockItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading stocks:', e); }
    };

    const loadProperties = async () => {
        try {
            const res = await financialDataApi.properties.getAll();
            setPropertyItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading properties:', e); }
    };

    const loadBankAccounts = async () => {
        try {
            const res = await financialDataApi.bankAccounts.getAll();
            const all = res.data || [];
            setBankAccounts(all.filter((a: any) => a.accountType !== 'Wallet'));
            setWallets(all.filter((a: any) => a.accountType === 'Wallet'));
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading bank accounts:', e); }
    };

    const loadLoans = async () => {
        try {
            const res = await financialDataApi.loans.getAll();
            setLoanItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading loans:', e); }
    };

    const loadBonds = async () => {
        try {
            const res = await financialDataApi.bondAssets.getAll();
            setBondItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading bonds:', e); }
    };

    const loadMutualFunds = async () => {
        try {
            const res = await financialDataApi.mutualFunds.getAll();
            setMutualFundItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading mutual funds:', e); }
    };

    const loadCreditCards = async () => {
        try {
            const res = await financialDataApi.creditCards.getAll();
            setCreditCardItems(res.data || []);
            setLastUpdated(new Date().toISOString());
        } catch (e) { console.error('Error loading credit cards:', e); }
    };

    // Individually memoized categories for "super fast" performance
    const goldData = React.useMemo(() => {
        const items = goldItems.map((item: any) => ({
            id: item.id,
            ornamentName: item.name,
            grams: parseFloat(item.weightGrams),
            pricePerGram: parseFloat(item.purchasePrice),
            totalValue: parseFloat(item.currentValue),
            purchaseDate: item.purchaseDate || new Date().toISOString(),
            purity: item.notes?.split(' ')[0] || '24K',
            imageUrl: item.imageUrl
        }));
        const total = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
        return { items, totalValue: total };
    }, [goldItems]);

    const stockData = React.useMemo(() => {
        const items = stockItems.map((item: any) => ({
            id: item.id,
            market: item.exchange,
            stockName: item.name,
            units: parseFloat(item.quantity),
            unitPrice: parseFloat(item.currentPrice),
            totalValue: parseFloat(item.quantity) * parseFloat(item.currentPrice),
            purchaseDate: item.createdAt
        }));
        const total = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
        return { items, totalValue: total };
    }, [stockItems]);

    const propertyData = React.useMemo(() => {
        const items = propertyItems.map((item: any) => ({
            id: item.id,
            propertyName: item.name,
            location: item.location,
            address: item.address || '',
            purchasePrice: parseFloat(item.purchasePrice),
            currentValue: parseFloat(item.currentValue),
            propertyType: item.propertyType,
            purchaseDate: item.purchaseDate || new Date().toISOString(),
            area: item.area ? parseFloat(item.area) : 0,
            imageUrl: item.imageUrl
        }));
        const total = items.reduce((sum, item) => sum + (item.currentValue || 0), 0);
        return { items, totalValue: total };
    }, [propertyItems]);

    const loanData = React.useMemo(() => {
        const items = loanItems.map((item: any) => ({
            id: item.id,
            lenderName: item.lenderName,
            linkedProperty: item.loanType,
            originalAmount: parseFloat(item.principal),
            outstandingBalance: parseFloat(item.outstanding),
            emiAmount: parseFloat(item.emiAmount),
            interestRate: parseFloat(item.interestRate),
            loanStartDate: item.startDate,
            loanEndDate: item.endDate,
            notes: item.notes || '',
            emiDueDate: 1
        }));
        const total = items.reduce((sum, item) => sum + (item.outstandingBalance || 0), 0);
        return { items, totalValue: total };
    }, [loanItems]);

    const bondData = React.useMemo(() => {
        const items = bondItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            issuer: item.issuer,
            faceValue: parseFloat(item.faceValue),
            currentValue: parseFloat(item.currentValue),
            interestRate: parseFloat(item.interestRate),
            maturityDate: item.maturityDate,
            notes: item.notes
        }));
        const total = items.reduce((sum, item) => sum + (item.currentValue || item.faceValue || 0), 0);
        return { items, totalValue: total };
    }, [bondItems]);

    const mutualFundData = React.useMemo(() => {
        const items = mutualFundItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            fundHouse: item.fundHouse,
            units: parseFloat(item.units),
            avgNav: parseFloat(item.avgNav),
            currentNav: parseFloat(item.currentNav),
            currentValue: parseFloat(item.currentValue),
            notes: item.notes
        }));
        const total = items.reduce((sum, item) => sum + (item.currentValue || 0), 0);
        return { items, totalValue: total };
    }, [mutualFundItems]);

    const creditCardData = React.useMemo(() => {
        const items = creditCardItems.map((item: any) => ({
            id: item.id,
            cardName: item.cardName,
            bankName: item.bankName,
            creditLimit: parseFloat(item.creditLimit),
            usedAmount: parseFloat(item.usedAmount),
            dueDate: item.dueDate,
            interestRate: item.interestRate,
            notes: item.notes
        }));
        const total = items.reduce((sum, item) => sum + (item.usedAmount || 0), 0);
        return { items, totalValue: total };
    }, [creditCardItems]);

    const cashData = React.useMemo(() => {
        const bankTotal = bankAccounts.reduce((sum, item: any) => sum + (parseFloat(item.balance) || 0), 0);
        const walletTotal = wallets.reduce((sum, item: any) => sum + (parseFloat(item.balance) || 0), 0);
        const cashTotal = bankTotal + walletTotal;
        return {
            bankAccounts,
            wallets,
            totalBank: bankTotal,
            totalWallet: walletTotal,
            totalCash: cashTotal
        };
    }, [bankAccounts, wallets]);

    // Final combined net worth data
    const data = React.useMemo(() => {
        const totalAssets = goldData.totalValue + bondData.totalValue + stockData.totalValue +
            propertyData.totalValue + mutualFundData.totalValue + cashData.totalCash;
        const totalLiabilities = loanData.totalValue + creditCardData.totalValue;
        const netWorth = totalAssets - totalLiabilities;

        return {
            assets: {
                gold: goldData,
                bonds: bondData,
                stocks: stockData,
                property: propertyData,
                mutualFunds: mutualFundData,
                cash: cashData
            },
            liabilities: {
                loans: loanData,
                creditCards: creditCardData
            },
            totalAssets,
            totalLiabilities,
            netWorth,
            lastUpdated
        };
    }, [goldData, bondData, stockData, propertyData, mutualFundData, cashData, loanData, creditCardData, lastUpdated]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (!token || !savedUser) {
                setIsLoading(false);
                return;
            }

            try {
                const user = JSON.parse(savedUser);
                setCurrentUserId(user.id);
            } catch (e) {
                setIsLoading(false);
                return;
            }

            // Fetch everything in parallel
            await Promise.all([
                loadGold(), loadStocks(), loadProperties(), loadBankAccounts(),
                loadLoans(), loadBonds(), loadMutualFunds(), loadCreditCards()
            ]);
        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const checkUserChange = () => {
            const savedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (savedUser && token) {
                try {
                    const user = JSON.parse(savedUser);
                    if (user.id !== currentUserId) {
                        loadData();
                    }
                } catch (e) { }
            } else if (currentUserId !== null && !token) {
                resetNetWorth();
            }
        };

        const interval = setInterval(checkUserChange, 1000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    const updateGold = async () => await loadGold();
    const updateBonds = async () => await loadBonds();
    const updateStocks = async () => await loadStocks();
    const updateProperty = async () => await loadProperties();
    const updateMutualFunds = async () => await loadMutualFunds();
    const updateCash = async () => await loadBankAccounts();
    const updateLoans = async () => await loadLoans();
    const updateCreditCards = async () => await loadCreditCards();
    const refreshNetWorth = async () => await loadData();

    const resetNetWorth = () => {
        setGoldItems([]);
        setBondItems([]);
        setStockItems([]);
        setPropertyItems([]);
        setMutualFundItems([]);
        setBankAccounts([]);
        setWallets([]);
        setLoanItems([]);
        setCreditCardItems([]);
        setCurrentUserId(null);
    };

    return (
        <NetWorthContext.Provider value={{
            data,
            updateGold,
            updateBonds,
            updateStocks,
            updateProperty,
            updateMutualFunds,
            updateCash,
            updateLoans,
            updateCreditCards,
            refreshNetWorth,
            resetNetWorth,
            isLoading
        }}>
            {children}
        </NetWorthContext.Provider>
    );
}

export function useNetWorth() {
    const context = useContext(NetWorthContext);
    if (context === undefined) {
        throw new Error('useNetWorth must be used within a NetWorthProvider');
    }
    return context;
}
