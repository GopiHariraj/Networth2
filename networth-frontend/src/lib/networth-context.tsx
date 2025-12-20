"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    updateGold: (items: AssetItem[]) => void;
    updateBonds: (items: AssetItem[]) => void;
    updateStocks: (items: AssetItem[]) => void;
    updateProperty: (items: AssetItem[]) => void;
    updateMutualFunds: (items: AssetItem[]) => void;
    updateCash: (bankAccounts: AssetItem[], wallets: AssetItem[]) => void;
    updateLoans: (items: AssetItem[]) => void;
    updateCreditCards: (items: AssetItem[]) => void;
    refreshNetWorth: () => void;
}

const NetWorthContext = createContext<NetWorthContextType | undefined>(undefined);

export function NetWorthProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<NetWorthData>({
        assets: {
            gold: { items: [], totalValue: 0 },
            bonds: { items: [], totalValue: 0 },
            stocks: { items: [], totalValue: 0 },
            property: { items: [], totalValue: 0 },
            mutualFunds: { items: [], totalValue: 0 },
            cash: {
                bankAccounts: [],
                wallets: [],
                totalBank: 0,
                totalWallet: 0,
                totalCash: 0
            }
        },
        liabilities: {
            loans: { items: [], totalValue: 0 },
            creditCards: { items: [], totalValue: 0 }
        },
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        lastUpdated: new Date().toISOString()
    });

    // Load data from localStorage
    const loadData = () => {
        const gold = JSON.parse(localStorage.getItem('networth-gold') || '[]');
        const bonds = JSON.parse(localStorage.getItem('networth-bonds') || '[]');
        const stocks = JSON.parse(localStorage.getItem('networth-stocks') || '[]');
        const property = JSON.parse(localStorage.getItem('networth-property') || '[]');
        const mutualFunds = JSON.parse(localStorage.getItem('networth-mutualfunds') || '[]');
        const bankAccounts = JSON.parse(localStorage.getItem('networth-cash-bank') || '[]');
        const wallets = JSON.parse(localStorage.getItem('networth-cash-wallet') || '[]');
        const loans = JSON.parse(localStorage.getItem('networth-loans') || '[]');
        const cards = JSON.parse(localStorage.getItem('networth-cards') || '[]');

        // Calculate totals
        const goldTotal = gold.reduce((sum: number, item: any) => sum + (parseFloat(item.totalValue) || 0), 0);
        const bondsTotal = bonds.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || parseFloat(item.faceValue) || 0), 0);
        const stocksTotal = stocks.reduce((sum: number, item: any) => sum + (parseFloat(item.totalValue) || 0), 0);
        const propertyTotal = property.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || 0), 0);
        const mutualFundsTotal = mutualFunds.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || 0), 0);
        const bankTotal = bankAccounts.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || 0), 0);
        const walletTotal = wallets.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || 0), 0);
        const cashTotal = bankTotal + walletTotal;
        const loansTotal = loans.reduce((sum: number, item: any) => sum + (parseFloat(item.principalAmount) || parseFloat(item.currentBalance) || 0), 0);
        const cardsTotal = cards.reduce((sum: number, item: any) => sum + (parseFloat(item.usedAmount) || 0), 0);

        const totalAssets = goldTotal + bondsTotal + stocksTotal + propertyTotal + mutualFundsTotal + cashTotal;
        const totalLiabilities = loansTotal + cardsTotal;
        const netWorth = totalAssets - totalLiabilities;

        setData({
            assets: {
                gold: { items: gold, totalValue: goldTotal },
                bonds: { items: bonds, totalValue: bondsTotal },
                stocks: { items: stocks, totalValue: stocksTotal },
                property: { items: property, totalValue: propertyTotal },
                mutualFunds: { items: mutualFunds, totalValue: mutualFundsTotal },
                cash: {
                    bankAccounts,
                    wallets,
                    totalBank: bankTotal,
                    totalWallet: walletTotal,
                    totalCash: cashTotal
                }
            },
            liabilities: {
                loans: { items: loans, totalValue: loansTotal },
                creditCards: { items: cards, totalValue: cardsTotal }
            },
            totalAssets,
            totalLiabilities,
            netWorth,
            lastUpdated: new Date().toISOString()
        });

        // Update active goal with current net worth
        const activeGoal = localStorage.getItem('activeGoal');
        if (activeGoal) {
            try {
                const goal = JSON.parse(activeGoal);
                goal.currentNetWorth = netWorth;
                localStorage.setItem('activeGoal', JSON.stringify(goal));
            } catch (e) {
                console.error('Error updating active goal', e);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateGold = (items: AssetItem[]) => {
        localStorage.setItem('networth-gold', JSON.stringify(items));
        loadData();
    };

    const updateBonds = (items: AssetItem[]) => {
        localStorage.setItem('networth-bonds', JSON.stringify(items));
        loadData();
    };

    const updateStocks = (items: AssetItem[]) => {
        localStorage.setItem('networth-stocks', JSON.stringify(items));
        loadData();
    };

    const updateProperty = (items: AssetItem[]) => {
        localStorage.setItem('networth-property', JSON.stringify(items));
        loadData();
    };

    const updateMutualFunds = (items: AssetItem[]) => {
        localStorage.setItem('networth-mutualfunds', JSON.stringify(items));
        loadData();
    };

    const updateCash = (bankAccounts: AssetItem[], wallets: AssetItem[]) => {
        localStorage.setItem('networth-cash-bank', JSON.stringify(bankAccounts));
        localStorage.setItem('networth-cash-wallet', JSON.stringify(wallets));
        loadData();
    };

    const updateLoans = (items: AssetItem[]) => {
        localStorage.setItem('networth-loans', JSON.stringify(items));
        loadData();
    };

    const updateCreditCards = (items: AssetItem[]) => {
        localStorage.setItem('networth-cards', JSON.stringify(items));
        loadData();
    };

    const refreshNetWorth = () => {
        loadData();
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
            refreshNetWorth
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
