"use client";

import React, { useState } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface HousingLoan {
    id: string;
    lenderName: string;
    linkedProperty: string;
    originalAmount: number;
    outstandingBalance: number;
    interestRate: number;
    emiAmount: number;
    emiDueDate: number;
    loanStartDate: string;
    loanEndDate: string;
    notes: string;
}

interface CreditCard {
    id: string;
    cardName: string;
    bankName: string;
    totalLimit: number;
    usedAmount: number;
    minimumDue: number;
    dueDate: number;
    statementDate: number;
    monthlyInstallment: number;
    lastPaymentAmount: number;
    lastPaymentDate: string;
}

export default function LoansPage() {
    const { currency } = useCurrency();
    const [loans, setLoans] = useState<HousingLoan[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [activeTab, setActiveTab] = useState<'loans' | 'cards'>('loans');

    const [loanForm, setLoanForm] = useState({
        lenderName: '',
        linkedProperty: '',
        originalAmount: '',
        outstandingBalance: '',
        interestRate: '',
        emiAmount: '',
        emiDueDate: '1',
        loanStartDate: '',
        loanEndDate: '',
        notes: ''
    });

    const [cardForm, setCardForm] = useState({
        cardName: '',
        bankName: '',
        totalLimit: '',
        usedAmount: '',
        minimumDue: '',
        dueDate: '1',
        statementDate: '1',
        monthlyInstallment: '',
        lastPaymentAmount: '',
        lastPaymentDate: ''
    });

    // Loan handlers
    const handleAddLoan = (e: React.FormEvent) => {
        e.preventDefault();
        const newLoan: HousingLoan = {
            id: Date.now().toString(),
            lenderName: loanForm.lenderName,
            linkedProperty: loanForm.linkedProperty,
            originalAmount: parseFloat(loanForm.originalAmount),
            outstandingBalance: parseFloat(loanForm.outstandingBalance),
            interestRate: parseFloat(loanForm.interestRate),
            emiAmount: parseFloat(loanForm.emiAmount),
            emiDueDate: parseInt(loanForm.emiDueDate),
            loanStartDate: loanForm.loanStartDate,
            loanEndDate: loanForm.loanEndDate,
            notes: loanForm.notes
        };
        setLoans(prev => [...prev, newLoan]);
        setLoanForm({
            lenderName: '', linkedProperty: '', originalAmount: '', outstandingBalance: '',
            interestRate: '', emiAmount: '', emiDueDate: '1', loanStartDate: '', loanEndDate: '', notes: ''
        });
    };

    const handleDeleteLoan = (id: string) => {
        if (confirm('Delete this loan?')) setLoans(prev => prev.filter(l => l.id !== id));
    };

    // Credit card handlers
    const handleAddCard = (e: React.FormEvent) => {
        e.preventDefault();
        const newCard: CreditCard = {
            id: Date.now().toString(),
            cardName: cardForm.cardName,
            bankName: cardForm.bankName,
            totalLimit: parseFloat(cardForm.totalLimit),
            usedAmount: parseFloat(cardForm.usedAmount),
            minimumDue: parseFloat(cardForm.minimumDue),
            dueDate: parseInt(cardForm.dueDate),
            statementDate: parseInt(cardForm.statementDate),
            monthlyInstallment: parseFloat(cardForm.monthlyInstallment) || 0,
            lastPaymentAmount: parseFloat(cardForm.lastPaymentAmount) || 0,
            lastPaymentDate: cardForm.lastPaymentDate
        };
        setCreditCards(prev => [...prev, newCard]);
        setCardForm({
            cardName: '', bankName: '', totalLimit: '', usedAmount: '', minimumDue: '',
            dueDate: '1', statementDate: '1', monthlyInstallment: '', lastPaymentAmount: '', lastPaymentDate: ''
        });
    };

    const handleDeleteCard = (id: string) => {
        if (confirm('Delete this credit card?')) setCreditCards(prev => prev.filter(c => c.id !== id));
    };

    // Calculations
    const getTotalLoanBalance = () => loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const getTotalCreditUsed = () => creditCards.reduce((sum, card) => sum + card.usedAmount, 0);
    const getTotalCreditLimit = () => creditCards.reduce((sum, card) => sum + card.totalLimit, 0);
    const getTotalLoanEMI = () => loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    const getTotalCardEMI = () => creditCards.reduce((sum, card) => sum + card.monthlyInstallment, 0);
    const getTotalEMI = () => getTotalLoanEMI() + getTotalCardEMI();
    const getTotalLiabilities = () => getTotalLoanBalance() + getTotalCreditUsed();

    // Chart data
    const emiChartData = [
        { name: 'Housing Loans', value: getTotalLoanEMI(), color: '#3b82f6' },
        { name: 'Credit Cards', value: getTotalCardEMI(), color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    const liabilitiesChartData = [
        { name: 'Loans Outstanding', value: getTotalLoanBalance(), color: '#ef4444' },
        { name: 'Credit Card Debt', value: getTotalCreditUsed(), color: '#f97316' }
    ].filter(item => item.value > 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">💳 Loans & Liabilities</h1>
                    <p className="text-slate-500 mt-2">Manage housing loans and credit cards</p>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Liabilities</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {getTotalLiabilities().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Loan Outstanding</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{currency.symbol} {getTotalLoanBalance().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Credit Used</div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">{currency.symbol} {getTotalCreditUsed().toLocaleString()}</div>
                        <div className="text-xs text-slate-400">of {currency.symbol} {getTotalCreditLimit().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Total Monthly EMI</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {getTotalEMI().toLocaleString()}</div>
                    </div>
                </div>

                {/* Charts */}
                {(emiChartData.length > 0 || liabilitiesChartData.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {liabilitiesChartData.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Liabilities Breakdown</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={liabilitiesChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                            {liabilitiesChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {emiChartData.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Monthly EMI Breakdown</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={emiChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                            {emiChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('loans')}
                        className={`px-6 py-3 font-bold rounded-xl transition-all ${activeTab === 'loans' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                        🏠 Housing Loans ({loans.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`px-6 py-3 font-bold rounded-xl transition-all ${activeTab === 'cards' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                        💳 Credit Cards ({creditCards.length})
                    </button>
                </div>

                {/* Housing Loans Section */}
                {activeTab === 'loans' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">➕ Add Housing Loan</h2>
                                <form onSubmit={handleAddLoan} className="space-y-4">
                                    <input type="text" placeholder="Lender Name *" required value={loanForm.lenderName} onChange={e => setLoanForm({ ...loanForm, lenderName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="text" placeholder="Linked Property" value={loanForm.linkedProperty} onChange={e => setLoanForm({ ...loanForm, linkedProperty: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`Original Amount (${currency.code}) *`} required value={loanForm.originalAmount} onChange={e => setLoanForm({ ...loanForm, originalAmount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`Outstanding Balance (${currency.code}) *`} required value={loanForm.outstandingBalance} onChange={e => setLoanForm({ ...loanForm, outstandingBalance: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="number" step="0.01" placeholder="Interest Rate (%) *" required value={loanForm.interestRate} onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`EMI Amount (${currency.code}) *`} required value={loanForm.emiAmount} onChange={e => setLoanForm({ ...loanForm, emiAmount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <select value={loanForm.emiDueDate} onChange={e => setLoanForm({ ...loanForm, emiDueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">EMI Due Date</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month</option>)}
                                    </select>
                                    <input type="date" placeholder="Loan Start Date" value={loanForm.loanStartDate} onChange={e => setLoanForm({ ...loanForm, loanStartDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <input type="date" placeholder="Loan End Date" value={loanForm.loanEndDate} onChange={e => setLoanForm({ ...loanForm, loanEndDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <textarea placeholder="Notes" rows={2} value={loanForm.notes} onChange={e => setLoanForm({ ...loanForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <button type="submit" className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg">➕ Add Loan</button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            {loans.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-6xl mb-4">🏠</div>
                                    <div className="text-slate-500 dark:text-slate-400">No housing loans added yet</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {loans.map(loan => (
                                        <div key={loan.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{loan.lenderName}</h3>
                                                    {loan.linkedProperty && <p className="text-sm text-slate-500">🏠 {loan.linkedProperty}</p>}
                                                </div>
                                                <button onClick={() => handleDeleteLoan(loan.id)} className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">🗑️</button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div><div className="text-xs text-slate-500">Outstanding</div><div className="font-bold text-red-600 dark:text-red-400">{currency.symbol} {loan.outstandingBalance.toLocaleString()}</div></div>
                                                <div><div className="text-xs text-slate-500">Interest Rate</div><div className="font-semibold text-slate-900 dark:text-white">{loan.interestRate}%</div></div>
                                                <div><div className="text-xs text-slate-500">Monthly EMI</div><div className="font-bold text-blue-600 dark:text-blue-400">{currency.symbol} {loan.emiAmount.toLocaleString()}</div></div>
                                                <div><div className="text-xs text-slate-500">Due Date</div><div className="font-semibold text-slate-900 dark:text-white">{loan.emiDueDate}{loan.emiDueDate === 1 ? 'st' : loan.emiDueDate === 2 ? 'nd' : loan.emiDueDate === 3 ? 'rd' : 'th'}</div></div>
                                            </div>
                                            {loan.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">{loan.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Credit Cards Section */}
                {activeTab === 'cards' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">➕ Add Credit Card</h2>
                                <form onSubmit={handleAddCard} className="space-y-4">
                                    <input type="text" placeholder="Card Name *" required value={cardForm.cardName} onChange={e => setCardForm({ ...cardForm, cardName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="text" placeholder="Bank Name *" required value={cardForm.bankName} onChange={e => setCardForm({ ...cardForm, bankName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`Total Limit (${currency.code}) *`} required value={cardForm.totalLimit} onChange={e => setCardForm({ ...cardForm, totalLimit: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`Used Amount (${currency.code}) *`} required value={cardForm.usedAmount} onChange={e => setCardForm({ ...cardForm, usedAmount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="number" step="0.01" placeholder={`Minimum Due (${currency.code}) *`} required value={cardForm.minimumDue} onChange={e => setCardForm({ ...cardForm, minimumDue: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <select value={cardForm.dueDate} onChange={e => setCardForm({ ...cardForm, dueDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="">Payment Due Date</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>)}
                                    </select>
                                    <select value={cardForm.statementDate} onChange={e => setCardForm({ ...cardForm, statementDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="">Statement Date</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>)}
                                    </select>
                                    <input type="number" step="0.01" placeholder="Monthly Installment (if any)" value={cardForm.monthlyInstallment} onChange={e => setCardForm({ ...cardForm, monthlyInstallment: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="number" step="0.01" placeholder="Last Payment Amount" value={cardForm.lastPaymentAmount} onChange={e => setCardForm({ ...cardForm, lastPaymentAmount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <input type="date" placeholder="Last Payment Date" value={cardForm.lastPaymentDate} onChange={e => setCardForm({ ...cardForm, lastPaymentDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                                    <button type="submit" className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg">➕ Add Card</button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            {creditCards.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-6xl mb-4">💳</div>
                                    <div className="text-slate-500 dark:text-slate-400">No credit cards added yet</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {creditCards.map(card => {
                                        const availableBalance = card.totalLimit - card.usedAmount;
                                        const utilizationPercent = (card.usedAmount / card.totalLimit) * 100;
                                        return (
                                            <div key={card.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{card.cardName}</h3>
                                                        <p className="text-sm text-slate-500">🏦 {card.bankName}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteCard(card.id)} className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">🗑️</button>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                        <span>Utilization: {utilizationPercent.toFixed(1)}%</span>
                                                        <span>{currency.symbol} {card.usedAmount.toLocaleString()} / {currency.symbol} {card.totalLimit.toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div className={`h-2 rounded-full ${utilizationPercent > 80 ? 'bg-red-500' : utilizationPercent > 50 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilizationPercent, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div><div className="text-xs text-slate-500">Available</div><div className="font-bold text-green-600 dark:text-green-400">{currency.symbol} {availableBalance.toLocaleString()}</div></div>
                                                    <div><div className="text-xs text-slate-500">Minimum Due</div><div className="font-bold text-orange-600 dark:text-orange-400">{currency.symbol} {card.minimumDue.toLocaleString()}</div></div>
                                                    <div><div className="text-xs text-slate-500">Due Date</div><div className="font-semibold text-slate-900 dark:text-white">{card.dueDate}{card.dueDate === 1 ? 'st' : card.dueDate === 2 ? 'nd' : card.dueDate === 3 ? 'rd' : 'th'}</div></div>
                                                    {card.monthlyInstallment > 0 && <div><div className="text-xs text-slate-500">Monthly EMI</div><div className="font-bold text-purple-600 dark:text-purple-400">{currency.symbol} {card.monthlyInstallment.toLocaleString()}</div></div>}
                                                </div>
                                                {card.lastPaymentAmount > 0 && (
                                                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                                        Last Payment: {currency.symbol} {card.lastPaymentAmount.toLocaleString()} on {new Date(card.lastPaymentDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
