"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../lib/tour-context';

export default function ProductTour() {
    const { isTourVisible, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [isCentered, setIsCentered] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTourVisible) {
            setCoords(null);
            setIsCentered(false);
            return;
        }

        const updateCoords = () => {
            const step = steps[currentStep];

            if (!step.targetId) {
                setCoords(null);
                setIsCentered(true);
                return;
            }

            let element = document.getElementById(step.targetId);

            // Fallback logic for Settings inside user menu
            if (!element && step.targetId === 'sidebar-settings-link') {
                element = document.getElementById('sidebar-user-menu-trigger');
            }

            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                setIsCentered(false);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setCoords(null);
                setIsCentered(true);
            }
        };

        const timer = setTimeout(updateCoords, 300);
        window.addEventListener('resize', updateCoords);
        return () => {
            window.removeEventListener('resize', updateCoords);
            clearTimeout(timer);
        };
    }, [isTourVisible, currentStep, steps]);

    if (!isTourVisible) return null;

    const currentTourStep = steps[currentStep];
    const hasSpotlight = coords && !isCentered;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto transition-all duration-500"
                style={{
                    clipPath: hasSpotlight ? `polygon(
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
                    )` : 'none'
                }}
                onClick={skipTour}
            />

            {/* Spotlight Border */}
            {hasSpotlight && (
                <div
                    className="absolute border-2 border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-500"
                    style={{
                        top: coords.top - 4,
                        left: coords.left - 4,
                        width: coords.width + 8,
                        height: coords.height + 8
                    }}
                />
            )}

            {/* Popover Card */}
            <div
                ref={popoverRef}
                className="absolute pointer-events-auto transition-all duration-500"
                style={isCentered ? {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                } : {
                    top: coords ? coords.top + (coords.height / 2) : '50%',
                    left: coords ? coords.left + coords.width + 24 : '50%',
                    transform: coords ? 'translateY(-50%)' : 'translate(-50%, -50%)'
                }}
            >
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-blue-100 dark:border-blue-900/50 w-[360px] relative animate-in fade-in zoom-in duration-300">
                    {/* Arrow (only if not centered) */}
                    {!isCentered && coords && (
                        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-b border-blue-100 dark:border-blue-900/50 rotate-45 -translate-y-1/2" />
                    )}

                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                            <button
                                onClick={skipTour}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            {currentTourStep.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            {currentTourStep.description}
                        </p>

                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={skipTour}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                Skip Tour
                            </button>
                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={prevStep}
                                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={nextStep}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
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
