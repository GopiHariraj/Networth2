"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
        description: 'Take a quick 2-minute tour to see how you can track your net worth, expenses, and financial goals all in one place.',
    },
    {
        targetId: 'sidebar-nav-container',
        title: 'Your Command Center 🧭',
        description: 'Access all your financial modules here. You can customize which ones are visible in the settings to keep your sidebar clean.',
        position: 'right'
    },
    {
        targetId: 'dashboard-summary-cards',
        title: 'Dashboard at a Glance 📊',
        description: 'See your real-time net worth, current month\'s income vs. expenses, and progress toward your primary goal.',
        position: 'bottom'
    },
    {
        targetId: 'sidebar-link-expenses',
        title: 'Master Your Expenses 💵',
        description: 'Add expenses manually, upload bills, or let our Gemini AI scan your statements to categorize spending automatically.',
        position: 'right'
    },
    {
        targetId: 'sidebar-link-cash',
        title: 'Track All Your Assets 💎',
        description: 'Easily manage your Cash, Gold, Stocks, Mutual Funds, and Properties. Everything is converted to your home currency.',
        position: 'right'
    },
    {
        targetId: 'sidebar-link-goals',
        title: 'Financial Milestones 🎯',
        description: 'Set specific goals for savings, asset accumulation, or debt reduction, and watch your progress update in real-time.',
        position: 'right'
    },
    {
        targetId: 'sidebar-link-ai-analysis',
        title: 'AI Smart Insights ✨',
        description: 'Chat with your personal financial assistant to analyze trends, ask complex questions, or generate custom reports.',
        position: 'right'
    },
    {
        targetId: 'sidebar-settings-link',
        title: 'Settings & Preferences ⚙️',
        description: 'Change your display currency, enable/disable modules, and manage your profile and security settings.',
        position: 'right'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isTourVisible, setIsTourVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if tour was already finished or skipped
        const tourStatus = localStorage.getItem('first_login_completed');
        if (tourStatus !== 'true') {
            const timer = setTimeout(() => {
                setIsTourVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

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

    const skipTour = () => {
        localStorage.setItem('first_login_completed', 'true');
        setIsTourVisible(false);
    };

    const finishTour = () => {
        localStorage.setItem('first_login_completed', 'true');
        setIsTourVisible(false);
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
