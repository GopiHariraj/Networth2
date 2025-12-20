"use client";

import React, { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from './Sidebar';
import Calculator from './Calculator';
import { useAuth } from '../lib/auth-context';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state
    const [isMobile, setIsMobile] = useState(false);

    // Load sidebar state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) {
            setIsSidebarCollapsed(JSON.parse(saved));
        }

        // Detect mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save collapse state to localStorage
    const toggleCollapse = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    // Toggle mobile drawer
    const toggleOpen = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Calculate main content padding based on sidebar state
    const getContentPadding = () => {
        if (!isAuthenticated) return '';
        if (isMobile) return '';
        return isSidebarCollapsed ? 'pl-20' : 'pl-64';
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            {isAuthenticated && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onToggleOpen={toggleOpen}
                    onToggleCollapse={toggleCollapse}
                />
            )}

            <div className={`flex-1 transition-all duration-300 ${getContentPadding()}`}>
                {/* Header with Hamburger */}
                {isAuthenticated && isMobile && (
                    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 z-20 flex items-center gap-4">
                        <HamburgerButton onClick={toggleOpen} isOpen={isSidebarOpen} />
                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">E-Daily</h1>
                    </header>
                )}

                <div className={isMobile && isAuthenticated ? 'pt-16' : ''}>
                    {children}
                </div>
            </div>

            {isAuthenticated && <Calculator />}
        </div>
    );
}
