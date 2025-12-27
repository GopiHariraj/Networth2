"use client";

import React from 'react';

const StatCard = React.memo(({ label, value, trend, trendUp }: { label: string, value: string, trend: string, trendUp: boolean }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
            <div className={`flex items-center mt-2 text-sm font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span>{trendUp ? '↑' : '↓'} {trend}</span>
                <span className="ml-2 text-slate-400 font-normal">vs last month</span>
            </div>
        </div>
    );
});
StatCard.displayName = 'StatCard';

interface SummaryCardsProps {
    currency: { symbol: string };
    dashboardData: any;
    filterPeriod: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ currency, dashboardData, filterPeriod }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
                label={`Income (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                value={`${currency.symbol} ${(dashboardData?.summary?.income || 0).toLocaleString()}`}
                trend="-"
                trendUp={true}
            />
            <StatCard
                label={`Expenses (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                value={`${currency.symbol} ${(dashboardData?.summary?.expense || 0).toLocaleString()}`}
                trend="-"
                trendUp={false}
            />
            <StatCard
                label={`Net (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                value={`${currency.symbol} ${(dashboardData?.summary?.net || 0).toLocaleString()}`}
                trend="-"
                trendUp={(dashboardData?.summary?.net || 0) >= 0}
            />
        </div>
    );
};

export default SummaryCards;
