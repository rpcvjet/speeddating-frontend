// pages/reset-password.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const router = useRouter();
    const { token } = router.query;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // API Configuration
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    // Redirect if no token
    useEffect(() => {
        if (router.isReady && !token) {
            router.push('/login');
        }
    }, [router, token]);

    // Real-time password validation
    const validatePassword = (pwd) => {
        const errors = {};

        if (pwd.length < 8) {
            errors.length = 'Password must be at least 8 characters long';
        }

        if (!/\d/.test(pwd)) {
            errors.number = 'Password must contain at least one number';
        }

        if (!/[a-zA-Z]/.test(pwd)) {
            errors.letter = 'Password must contain at least one letter';
        }

        return errors;
    };

    // Handle password change with validation
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        if (newPassword) {
            setValidationErrors(validatePassword(newPassword));
        } else {
            setValidationErrors({});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Final validation
        const passwordErrors = validatePassword(password);
        if (Object.keys(passwordErrors).length > 0) {
            setValidationErrors(passwordErrors);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: password
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Password Reset Successful!
                            </h2>

                            <p className="text-sm text-gray-600 mb-6">
                                Your password has been successfully reset. You can now log in with your new password.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    Redirecting to login page in 3 seconds...
                                </p>
                            </div>

                            <Link href="/login">
                                <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Continue to Login
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    const passwordsMatch = password === confirmPassword;
    const canSubmit = password && confirmPassword && !hasValidationErrors && passwordsMatch;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Set New Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Choose a strong password for your account
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Enter your new password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {/* Password Validation Messages */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    <div className={`flex items-center text-xs ${validationErrors.length ? 'text-red-600' : 'text-green-600'}`}>
                                        {validationErrors.length ? (
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        At least 8 characters
                                    </div>
                                    <div className={`flex items-center text-xs ${validationErrors.number ? 'text-red-600' : 'text-green-600'}`}>
                                        {validationErrors.number ? (
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        At least one number
                                    </div>
                                    <div className={`flex items-center text-xs ${validationErrors.letter ? 'text-red-600' : 'text-green-600'}`}>
                                        {validationErrors.letter ? (
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        At least one letter
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {/* Password Match Indicator */}
                            {confirmPassword && (
                                <div className={`mt-2 flex items-center text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                    {passwordsMatch ? (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Resetting Password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Having trouble?{' '}
                            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500">
                                Request a new reset link
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;