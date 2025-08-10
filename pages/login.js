// pages/login.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Heart, Users } from 'lucide-react';
import Link from 'next/link';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/admin/events');
        }
    }, [isAuthenticated, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            router.push('/admin/events');
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }

        setIsLoading(false);
    };

    const fillDemoCredentials = (userType) => {
        if (userType === 'admin') {
            setEmail('admin@dcspeed.com');
            setPassword('password123');
        } else if (userType === 'organizer') {
            setEmail('mike@dcspeed.com');
            setPassword('password123');
        } else if (userType === 'nyc') {
            setEmail('admin@nycsingles.com');
            setPassword('password123');
        } else if (userType === 'miami') {
            setEmail('contact@miamilove.com');
            setPassword('password123');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <Heart className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Speed Dating Manager
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to manage your events
                    </p>
                </div>

                {/* Login Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="space-y-4">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center mt-4">
                                <div className="text-sm">
                                    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                        Forgot your password?
                                    </Link>
                                </div>

                            </div>
                        </div>
                    </div>
                </form>

                {/* Demo Credentials */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-600" />
                        Demo Accounts
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Try logging in as different companies - each is completely separate:
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => fillDemoCredentials('admin')}
                            className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="font-medium text-gray-900">DC Speed Dating</div>
                            <div className="text-sm text-gray-500">admin@dcspeed.com • Sarah Wilson</div>
                        </button>

                        <button
                            onClick={() => fillDemoCredentials('organizer')}
                            className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="font-medium text-gray-900">DC Speed Dating</div>
                            <div className="text-sm text-gray-500">mike@dcspeed.com • Mike Johnson</div>
                        </button>

                        <button
                            onClick={() => fillDemoCredentials('nyc')}
                            className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="font-medium text-gray-900">NYC Singles Events</div>
                            <div className="text-sm text-gray-500">admin@nycsingles.com • Emma Rodriguez</div>
                        </button>

                        <button
                            onClick={() => fillDemoCredentials('miami')}
                            className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="font-medium text-gray-900">Miami Love Connection</div>
                            <div className="text-sm text-gray-500">contact@miamilove.com • Maria Garcia</div>
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                            <strong>Password for all demo accounts:</strong> password123
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Each company only sees their own events and data.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        © 2025 Speed Dating Manager. Multi-tenant SaaS platform.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;