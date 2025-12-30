"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from './api/client';

interface User {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    currency?: string;
    forceChangePassword?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setToken(savedToken);
                setIsAuthenticated(true);
                setIsLoading(false);

                // Force Password Change Check
                if (parsedUser.forceChangePassword) {
                    if (pathname !== '/reset-password' && pathname !== '/auth/logout') {
                        router.push('/reset-password');
                    }
                }
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsLoading(false);
            }
        } else {
            // Redirect to login if not authenticated and not on public page
            const publicPaths = ['/login', '/register', '/reset-password', '/auth/reset-password', '/auth/magic-login', '/auth/reset'];

            setIsLoading(false);
            if (!publicPaths.some(path => pathname.startsWith(path))) {
                router.push('/login');
            }
        }
    }, [pathname, router]);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Store token in cookie for middleware access (server-side)
        document.cookie = `token=${newToken}; path=/; max-age=7200; SameSite=Lax`;

        setUser(userData);
        setToken(newToken);
        setIsAuthenticated(true);

        // Dispatch custom event for context providers to react
        window.dispatchEvent(new CustomEvent('userLogin', { detail: { userId: userData.id } }));

        // Force full page reload to pull fresh data from cloud database
        // This clears all cached state and ensures clean session
        if (userData.forceChangePassword) {
            window.location.href = '/reset-password';
        } else {
            window.location.href = '/';
        }
    };

    const logout = () => {
        // Get user ID before clearing to clean up user-scoped data
        const userId = user?.id;

        // Clear only user-specific data instead of all localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        // Clear auth cookie
        document.cookie = 'token=; path=/; max-age=0';

        // Clear user-scoped data if user ID exists
        if (userId) {
            localStorage.removeItem(`activeGoal_${userId}`);
            localStorage.removeItem(`preferredCurrency_${userId}`);
        }

        // Reset state
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);

        // Dispatch custom event for context providers to react
        window.dispatchEvent(new Event('userLogout'));

        // Force full page reload to completely clear state
        window.location.href = '/login';
    };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated, isLoading }}>
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
