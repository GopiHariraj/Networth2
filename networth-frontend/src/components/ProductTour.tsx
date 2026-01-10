"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../lib/tour-context';

export default function ProductTour() {
    const { isTourVisible, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTourVisible) {
            setCoords(null);
            return;
        }

        const updateCoords = () => {
            const step = steps[currentStep];
            const element = document.getElementById(step.targetId);

            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found (e.g. sidebar collapsed or menu closed), try to find parent or fallback
                setCoords(null);
            }
        };

        // Initial update with a slight delay for sidebar animations
        const timer = setTimeout(updateCoords, 300);

        window.addEventListener('resize', updateCoords);
        return () => {
            window.removeEventListener('resize', updateCoords);
            clearTimeout(timer);
        };
    }, [isTourVisible, currentStep, steps]);

    if (!isTourVisible || !coords) return null;

    const currentTourStep = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with Hole */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto transition-all duration-500"
                style={{
                    clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        ${coords.left}px 100%, 
                        ${coords.left}px ${coords.top}px, 
                        ${coords.left + coords.width}px ${coords.top}px, 
                        ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                        ${coords.left}px ${coords.top + coords.height}px, 
                        ${coords.left}px 100%, 
                        100% 100%, 
                        100% 0%
                    )`
                }}
                onClick={skipTour}
            />

            {/* Spotlight Border */}
            <div
                className="absolute border-2 border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-500"
                style={{
                    top: coords.top - 4,
                    left: coords.left - 4,
                    width: coords.width + 8,
                    height: coords.height + 8
                }}
            />

            {/* Popover Card */}
            <div
                ref={popoverRef}
                className="absolute pointer-events-auto transition-all duration-500"
                style={{
                    top: coords.top + (coords.height / 2),
                    left: coords.left + coords.width + 24,
                    transform: 'translateY(-50%)'
                }}
            >
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900/50 w-[320px] relative animate-in fade-in zoom-in duration-300">
                    {/* Arrow */}
                    <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-b border-blue-100 dark:border-blue-900/50 rotate-45 -translate-y-1/2" />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <button
                                onClick={skipTour}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            {currentTourStep.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {currentTourStep.description}
                        </p>

                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={skipTour}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                Skip Product Tour
                            </button>
                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={prevStep}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={nextStep}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
