"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface TourStep {
    targetId?: string; // Optional for welcome/centered steps
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
    isTourVisible: boolean;
    currentStep: number;
    steps: TourStep[];
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    finishTour: () => void;
    startTour: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        title: 'Welcome to Net Worth! 🚀',
        description: 'Take a quick tour to learn how to track your net worth, expenses, and investments like a pro.',
    },
    {
        targetId: 'sidebar-nav-container',
        title: 'Your Command Center 🧭',
        description: 'Access all main modules here: Assets, Expenses, Investments, Insurance, and Reports.',
        position: 'right'
    },
    {
        targetId: 'calculator-toggle-button',
        title: 'Quick Calculations 🧮',
        description: 'Quickly calculate EMI, investment returns, profit/loss, and conversions on the fly.',
        position: 'left'
    },
    {
        targetId: 'dashboard-summary-cards',
        title: 'Dashboard Overview 📊',
        description: 'See your real-time net worth, charts, and financial status at a glance.',
        position: 'bottom'
    },
    {
        targetId: 'dashboard-goals-button',
        title: 'Set Your Goals 🎯',
        description: 'Set and track your financial goals here. Changes reflect across the entire app.',
        position: 'bottom'
    },
    {
        targetId: 'sidebar-link-expenses',
        title: 'Master Your Expenses 💵',
        description: 'Add expenses manually, via Gemini AI, or by uploading bills to stay on budget.',
        position: 'right'
    },
    {
        targetId: 'sidebar-link-cash',
        title: 'Track All Assets 💎',
        description: 'Manage Cash, Gold, Stocks, Mutual Funds, and Property to see your complete wealth.',
        position: 'right'
    },
    {
        targetId: 'sidebar-link-ai-analysis',
        title: 'AI Smart Insights ✨',
        description: 'Chat with our AI for deep financial analysis and custom graph-based insights.',
        position: 'right'
    },
    {
        targetId: 'sidebar-settings-link',
        title: 'Personalize Your App ⚙️',
        description: 'Pick your currency, enable/disable modules, and manage your preferences in settings.',
        position: 'right'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, updateUser } = useAuth();
    const router = useRouter();
    const [isTourVisible, setIsTourVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Check if tour was already finished in user profile
        // Also check localStorage as fallback for legacy or guest behavior if needed (optional)
        if (!user.isTourCompleted) {
            const timer = setTimeout(() => {
                setIsTourVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user?.isTourCompleted]);

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const completeTourInBackend = async () => {
        if (!user) return;

        try {
            // Optimistic update
            updateUser({ isTourCompleted: true });

            // Persist to backend
            // We use fetch directly here to avoid circular dependencies if we used an API client that uses auth context
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isTourCompleted: true })
            });
        } catch (error) {
            console.error('Failed to save tour status', error);
        }
    };

    const skipTour = () => {
        setIsTourVisible(false);
        completeTourInBackend();
    };

    const finishTour = () => {
        setIsTourVisible(false);
        if (user) {
            completeTourInBackend();
        }
        router.push('/');
    };

    const startTour = () => {
        setCurrentStep(0);
        setIsTourVisible(true);
    };

    return (
        <TourContext.Provider value={{
            isTourVisible,
            currentStep,
            steps: TOUR_STEPS,
            nextStep,
            prevStep,
            skipTour,
            finishTour,
            startTour
        }}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
