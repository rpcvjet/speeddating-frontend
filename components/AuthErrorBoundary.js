// components/AuthErrorBoundary.js
import React from 'react';
import { useRouter } from 'next/router';

class AuthErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            errorType: null,
            errorMessage: null
        };
    }

    static getDerivedStateFromError(error) {
        // Check if it's an auth-related error
        const isAuthError = error.message?.includes('401') ||
            error.message?.includes('Unauthorized') ||
            error.message?.includes('Invalid token') ||
            error.message?.includes('Token expired');

        return {
            hasError: true,
            errorType: isAuthError ? 'auth' : 'general',
            errorMessage: error.message
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Auth Error Boundary caught an error:', error, errorInfo);

        // If it's an auth error, trigger logout
        if (this.state.errorType === 'auth' && this.props.onAuthError) {
            this.props.onAuthError();
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, errorType: null, errorMessage: null });
    };

    handleLoginRedirect = () => {
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            if (this.state.errorType === 'auth') {
                // Auth-specific error UI
                return (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="max-w-md w-full space-y-8 p-8">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="mt-6 text-3xl font-bold text-gray-900">Session Expired</h2>
                                <p className="mt-2 text-gray-600">
                                    Your login session has expired for security reasons. Please log in again to continue.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={this.handleLoginRedirect}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Log In Again
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={this.handleRetry}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Try Again Without Logging In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            } else {
                // General error UI
                return (
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="max-w-md w-full space-y-8 p-8">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h2 className="mt-6 text-3xl font-bold text-gray-900">Something Went Wrong</h2>
                                <p className="mt-2 text-gray-600">
                                    We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                                </p>
                                {process.env.NODE_ENV === 'development' && this.state.errorMessage && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-left">
                                        <p className="text-sm text-red-700 font-mono">
                                            Error: {this.state.errorMessage}
                                        </p>
                                    </div>
                                )}
                                <div className="mt-6 space-y-3">
                                    <button
                                        onClick={this.handleRetry}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Refresh Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        return this.props.children;
    }
}

// Wrapper component that provides auth error handling
const AuthErrorBoundaryWrapper = ({ children }) => {
    const router = useRouter();

    const handleAuthError = () => {
        // Clear any stored auth data
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Small delay to ensure error boundary renders, then redirect
        setTimeout(() => {
            router.push('/login');
        }, 2000);
    };

    return (
        <AuthErrorBoundary onAuthError={handleAuthError}>
            {children}
        </AuthErrorBoundary>
    );
};

export default AuthErrorBoundaryWrapper;