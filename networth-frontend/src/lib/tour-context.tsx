"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
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
        targetId: 'sidebar-link-goals',
        title: 'Track Your Goals 🎯',
        description: 'Set and track your financial milestones here. Whether it\'s a new home or early retirement, keep your progress in sight.',
        position: 'right'
    },
    {
        targetId: 'sidebar-settings-link',
        title: 'Personalize Your Experience ⚙️',
        description: 'Configure your currency settings, module visibility, and profile details in the settings page.',
        position: 'right'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
    const [isTourVisible, setIsTourVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if tour was already finished or skipped
        const tourStatus = localStorage.getItem('product-tour-status');
        if (!tourStatus) {
            // Only show for the very first time after a short delay to ensure layout is ready
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
        localStorage.setItem('product-tour-status', 'skipped');
        setIsTourVisible(false);
    };

    const finishTour = () => {
        localStorage.setItem('product-tour-status', 'completed');
        setIsTourVisible(false);
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
