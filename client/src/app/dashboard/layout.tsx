'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import axios from 'axios'; // Keep axios if needed for other things, or remove if unused

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Mock User Default
    const [user, setUser] = useState({
        name: 'Oliver Brown',
        email: 'oliver.brown@domain.io',
        avatar: 'https://ui-avatars.com/api/?name=Oliver+Brown'
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data) {
                    setUser({
                        name: res.data.displayName || 'Oliver Brown',
                        email: res.data.emails?.[0]?.value || 'oliver.brown@domain.io',
                        avatar: res.data.photos?.[0]?.value || 'https://ui-avatars.com/api/?name=Oliver+Brown'
                    });
                }
            } catch (error: any) {
                // If 401, redirect to login
                if (error.response && error.response.status === 401) {
                    window.location.href = '/login';
                }
            }
        };
        checkAuth();
    }, []);

    const handleLogout = () => {
        window.location.href = 'http://localhost:5000/auth/logout';
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">ReachInbox Scheduler</h1>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <img src={user.avatar} alt="Avatar" className="h-8 w-8 rounded-full" />
                        <div className="text-sm">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer">Logout</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
