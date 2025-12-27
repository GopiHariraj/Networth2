"use client";

import React from 'react';
import Link from 'next/link';

const AssetCard = React.memo(({ asset, currencySymbol }: { asset: any; currencySymbol: string }) => {
    return (
        <div className="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer">
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b ${asset.color}`}></div>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {asset.type}
                </span>
                <span className="text-emerald-500 text-xs font-bold">{asset.change}</span>
            </div>
            <h4 className="text-slate-600 dark:text-slate-400 text-sm">{asset.name}</h4>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{currencySymbol} {asset.value.toLocaleString()}</p>
        </div>
    );
});
AssetCard.displayName = 'AssetCard';

interface PortfolioOverviewProps {
    currency: { symbol: string };
    networthData: any;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ currency, networthData }) => {
    const dynamicAssets = React.useMemo(() => [
        { id: '1', name: 'Cash & Bank', value: networthData.assets.cash.totalCash, change: '+2.4%', type: 'Liquid', color: 'from-blue-500 to-blue-600', path: '/cash' },
        { id: '2', name: 'Gold', value: networthData.assets.gold.totalValue, change: '+5.1%', type: 'Asset', color: 'from-amber-400 to-amber-500', path: '/gold' },
        { id: '3', name: 'Stocks', value: networthData.assets.stocks.totalValue, change: '+12.3%', type: 'Investment', color: 'from-purple-500 to-purple-600', path: '/stocks' },
        { id: '4', name: 'Property', value: networthData.assets.property.totalValue, change: '+1.5%', type: 'Real Estate', color: 'from-emerald-500 to-emerald-600', path: '/property' },
    ].filter(a => a.value > 0 || (a.name === 'Cash & Bank')), [networthData.assets]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4">Your Portfolio</h3>
            <div className="space-y-4">
                {dynamicAssets.map(asset => (
                    <Link key={asset.id} href={asset.path}>
                        <AssetCard asset={asset} currencySymbol={currency.symbol} />
                    </Link>
                ))}
                {networthData.liabilities.loans.totalValue > 0 && (
                    <Link href="/loans">
                        <AssetCard
                            asset={{
                                id: 'loan-stat',
                                name: 'Loans Outstanding',
                                value: networthData.liabilities.loans.totalValue,
                                change: 'Liability',
                                type: 'Debt',
                                color: 'from-red-500 to-rose-600'
                            }}
                            currencySymbol={currency.symbol}
                        />
                    </Link>
                )}
            </div>
        </div>
    );
};

export default PortfolioOverview;
