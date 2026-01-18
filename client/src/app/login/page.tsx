'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import axios from 'axios';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/google`;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${endpoint}`;

            const payload = isLogin ? { email, password } : { email, password, name };

            const res = await axios.post(url, payload);

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                // Also set a cookie for middleware compatibility if needed, but for now client-side token is enough for API calls
                document.cookie = `token=${res.data.token}; path=/; max-age=86400`;
                router.push('/dashboard');
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            {/* Background Gradients - Removed for B&W */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl mix-blend-screen" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <div className="max-w-md w-full z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white mb-4 shadow-lg shadow-gray-500/20">
                        <span className="text-2xl font-bold text-black">R</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">ReachInbox</h2>
                    <p className="mt-2 text-sm text-gray-400">Scale your outreach with intelligent scheduling.</p>
                </div>

                {/* Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-6">
                        <Button
                            onClick={handleGoogleLogin}
                            className="w-full relative flex justify-center items-center gap-3 py-3.5 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-all"
                            size="lg"
                        >
                            <FaGoogle className="text-black text-lg" />
                            <span>Continue with Google</span>
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-800" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-gray-900 px-2 text-gray-500 uppercase tracking-wide text-xs">or continue with email</span>
                            </div>
                        </div>

                        <form className="space-y-4" onSubmit={handleAuth}>
                            <div className="space-y-4">
                                {!isLogin && (
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-gray-500" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-3 py-3 bg-black border border-gray-800 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent transition-all"
                                            type="text"
                                            placeholder="Full Name"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className="text-gray-500" />
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-3 py-3 bg-black border border-gray-800 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent transition-all"
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="text-gray-500" />
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-3 py-3 bg-black border border-gray-800 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white focus:border-transparent transition-all"
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-white hover:bg-gray-200 text-black font-bold rounded-lg transition-all"
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                            </Button>
                        </form>

                        <div className="text-center text-xs text-gray-500 mt-6">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-gray-300 hover:text-white hover:underline cursor-pointer"
                            >
                                {isLogin ? "Sign up for free" : "Sign in"}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-gray-600">
                    &copy; 2026 ReachInbox. All rights reserved.
                </p>
            </div>
        </div>
    );
}
