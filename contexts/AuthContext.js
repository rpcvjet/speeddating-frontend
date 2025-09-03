import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check for existing session on app load
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('🚀 Calling AWS API:', process.env.NEXT_PUBLIC_API_URL);

            // Real API call to AWS Lambda
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('✅ AWS API Response:', data);

            // Check if response is successful (200-299 status codes)
            if (response.ok && data.success) {
                // Save user data with token from AWS
                const userData = {
                    ...data.user,
                    token: data.token
                };

                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);

                // DON'T redirect here - let the login component handle it
                return { success: true };
            } else {
                // Handle both API errors and response errors
                const errorMessage = data.message || data.error || 'Invalid email or password';
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('❌ Login API error:', error);

            // Provide more specific error messages
            if (error.message.includes('Failed to fetch')) {
                return { success: false, error: 'Unable to connect to server. Please check your internet connection.' };
            } else if (error.message.includes('NetworkError')) {
                return { success: false, error: 'Network error. Please try again.' };
            } else {
                return { success: false, error: 'Something went wrong. Please try again.' };
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    const checkTokenValidity = (error) => {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            console.log('🔒 Token invalid, clearing auth state');
            localStorage.removeItem('user');
            setUser(null);
            return true;
        }
        return false;
    };

    // Helper function to check if user is authenticated
    const isAuthenticated = !!user;

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated,
        checkTokenValidity
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};