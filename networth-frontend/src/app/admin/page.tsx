"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiClient } from '../../lib/api/client';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    // Form State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });

    // Edit User State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user?.role !== 'SUPER_ADMIN') {
            router.push('/');
        }
        if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
            fetchUsers();
        }
    }, [isAuthenticated, user, router]);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/users/create', newUser);
            setMessage(`Success: User ${newUser.name} created!`);
            setNewUser({ name: '', email: '', password: '', role: 'USER' });
            fetchUsers(); // Refresh list
        } catch (error) {
            setMessage('Failed to create user.');
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to reset the password for ${userName}?`)) return;

        try {
            const res = await apiClient.post('/users/reset-password', { userId });
            setMessage(`Success: Password for ${userName} reset to '${res.data.newPassword}'`);
        } catch (error) {
            setMessage('Failed to reset password.');
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser({ ...user });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await apiClient.put(`/users/${editingUser.id}`, {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role
            });
            setMessage(`Success: User ${editingUser.name} updated!`);
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            setMessage('Failed to update user.');
        }
    };

    const handleBackup = () => {
        // Gather all application data
        const backupData = {
            version: '1.0.0',
            appName: 'E-Daily Finance Tracker',
            timestamp: new Date().toISOString(),
            exportedBy: user?.email || 'Admin',

            // User data
            users: users,

            // Settings data from localStorage
            settings: {
                preferredCurrency: localStorage.getItem('preferredCurrency') || 'AED',
                appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                theme: localStorage.getItem('theme') || 'light',
            },

            // Goals data from localStorage (if exists)
            goals: JSON.parse(localStorage.getItem('userGoals') || '{}'),

            // User profile
            currentUser: JSON.parse(localStorage.getItem('user') || '{}'),

            // Additional metadata
            metadata: {
                browserInfo: navigator.userAgent,
                backupSize: 0, // Will be calculated
            }
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        backupData.metadata.backupSize = new Blob([dataStr]).size;

        const finalDataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([finalDataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `edaily-complete-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        setMessage(`✅ Complete backup created successfully!\nFile: ${fileName}\nSize: ${(blob.size / 1024).toFixed(2)} KB`);
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);

                // Validate backup file
                if (!backupData.version || !backupData.appName || backupData.appName !== 'E-Daily Finance Tracker') {
                    setMessage('❌ Invalid backup file format or wrong application');
                    return;
                }

                // Show comprehensive restore confirmation
                const confirmMessage = `⚠️ COMPLETE DATA RESTORE\n\n` +
                    `From: ${new Date(backupData.timestamp).toLocaleString()}\n` +
                    `Exported by: ${backupData.exportedBy}\n` +
                    `Version: ${backupData.version}\n\n` +
                    `This will restore:\n` +
                    `• ${backupData.users?.length || 0} users\n` +
                    `• All application settings\n` +
                    `• All goals and preferences\n\n` +
                    `⚠️ Current data will be OVERWRITTEN!\n\n` +
                    `Continue with restore?`;

                if (!confirm(confirmMessage)) {
                    setMessage('ℹ️ Restore cancelled');
                    return;
                }

                // Restore all data
                if (backupData.users) {
                    setUsers(backupData.users);
                }

                if (backupData.settings) {
                    if (backupData.settings.preferredCurrency) {
                        localStorage.setItem('preferredCurrency', backupData.settings.preferredCurrency);
                    }
                    if (backupData.settings.appSettings) {
                        localStorage.setItem('appSettings', JSON.stringify(backupData.settings.appSettings));
                    }
                    if (backupData.settings.theme) {
                        localStorage.setItem('theme', backupData.settings.theme);
                    }
                }

                if (backupData.goals) {
                    localStorage.setItem('userGoals', JSON.stringify(backupData.goals));
                }

                if (backupData.currentUser) {
                    localStorage.setItem('user', JSON.stringify(backupData.currentUser));
                }

                setMessage(`✅ Complete restore successful!\n\nRestored:\n• ${backupData.users?.length || 0} users\n• App settings\n• Goals data\n\nPlease refresh the page to apply all changes.`);

                // Optionally trigger page refresh after delay
                setTimeout(() => {
                    if (confirm('Refresh page now to apply all changes?')) {
                        window.location.reload();
                    }
                }, 2000);

            } catch (error) {
                console.error('Restore error:', error);
                setMessage('❌ Error reading backup file. Please ensure it\'s a valid E-Daily backup.');
            }
        };
        reader.readAsText(file);
    };

    if (!user || user.role !== 'SUPER_ADMIN') {
        return <div className="p-8 text-center">Access Denied. Admins only.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <header className="mb-8 lg:col-span-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-500 mt-2">Manage users and security settings.</p>
            </header>

            {/* Backup & Restore */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 lg:col-span-3">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">💾 Backup & Restore</h2>
                    <div className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                        Complete Data Export
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleBackup}
                        className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 transition-all flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">📥</div>
                        <div className="text-left">
                            <div className="font-bold text-slate-900 dark:text-white">Create Complete Backup</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Export all users, settings & data</div>
                        </div>
                    </button>
                    <label className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl hover:border-emerald-400 transition-all flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-2xl">📤</div>
                        <div className="text-left">
                            <div className="font-bold text-slate-900 dark:text-white">Restore Complete Backup</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Import all data from backup file</div>
                        </div>
                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                </div>

                {/* Backup Info */}
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">📋 What's Included in Backup:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>✓ All user accounts</div>
                        <div>✓ Currency preferences</div>
                        <div>✓ Application settings</div>
                        <div>✓ Goals & targets</div>
                        <div>✓ User profiles</div>
                        <div>✓ System configuration</div>
                    </div>
                </div>
            </div>

            {/* Create User Form */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="font-bold text-lg">Create New User</h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                            <input
                                type="text" required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <input
                                type="email" required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input
                                type="password" required
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="USER">User</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                            Create User
                        </button>
                    </form>
                </div>
            </div>

            {/* User List */}
            <div className="lg:col-span-2 space-y-6">
                {message && (
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                        {message}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-lg">User Management</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm">
                                <tr>
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {u.name?.charAt(0)}
                                                </div>
                                                {u.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditUser(u)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/20"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(u.id, u.name)}
                                                    className="text-xs text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors border border-red-100 dark:border-red-900/20"
                                                >
                                                    🔑 Reset Password
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="font-bold text-xl text-slate-900 dark:text-white">✏️ Edit User</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingUser.email}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    💾 Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
