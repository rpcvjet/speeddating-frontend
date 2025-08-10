// pages/admin/account-settings.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Save } from 'lucide-react';

const AccountSettings = () => {
    const { user } = useAuth();

    // Password change form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    // API Configuration
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-gateway-url.amazonaws.com';

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
    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);

        if (password) {
            setValidationErrors(validatePassword(password));
        } else {
            setValidationErrors({});
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        const passwordErrors = validatePassword(newPassword);
        if (Object.keys(passwordErrors).length > 0) {
            setValidationErrors(passwordErrors);
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess('Password changed successfully!');
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setValidationErrors({});
            } else {
                setError(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    const passwordsMatch = newPassword === confirmPassword;
    const canSubmit = currentPassword && newPassword && confirmPassword && !hasValidationErrors && passwordsMatch;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                            <p className="mt-2 text-gray-600">
                                Manage your account preferences and security settings
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                                        <p className="text-sm text-gray-500">{user?.email}</p>
                                        <p className="text-sm text-gray-500">{user?.organization_name}</p>
                                    </div>
                                </div>

                                <nav className="space-y-2">
                                    <button className="w-full text-left px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
                                        Security
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50" disabled>
                                        Profile (Coming Soon)
                                    </button>
                                    <button className="w-full text-left px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50" disabled>
                                        Notifications (Coming Soon)
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                        <Lock className="w-5 h-5 mr-2" />
                                        Change Password
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Update your password to keep your account secure
                                    </p>
                                </div>

                                <div className="p-6">
                                    {success && (
                                        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                                            <div className="flex">
                                                <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                                                <p className="text-sm text-green-600">{success}</p>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                                            <div className="flex">
                                                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                                                <p className="text-sm text-red-600">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        {/* Current Password */}
                                        <div>
                                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                                Current Password
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="currentPassword"
                                                    name="currentPassword"
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    autoComplete="current-password"
                                                    required
                                                    className="appearance-none block w-full pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Enter your current password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    disabled={loading}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                                New Password
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    required
                                                    className="appearance-none block w-full pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Enter your new password"
                                                    value={newPassword}
                                                    onChange={handleNewPasswordChange}
                                                    disabled={loading}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Password Validation Messages */}
                                            {newPassword && (
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

                                        {/* Confirm New Password */}
                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                                Confirm New Password
                                            </label>
                                            <div className="mt-1 relative">
                                                <input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    autoComplete="new-password"
                                                    required
                                                    className="appearance-none block w-full pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={!canSubmit || loading}
                                                className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Changing Password...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Change Password
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Security Tips Section */}
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                            <h4 className="text-sm font-medium text-blue-900 mb-2">Password Security Tips</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• Use a unique password for each account</li>
                                                <li>• Include numbers, letters, and special characters</li>
                                                <li>• Avoid common words and personal information</li>
                                                <li>• Consider using a password manager</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AccountSettings;