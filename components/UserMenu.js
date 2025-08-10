// components/UserMenu.js - Reusable User Menu Component
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Settings, LogOut, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = ({ currentPage = null }) => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuOpen && !event.target.closest('.user-menu-container')) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    const handleSignOut = () => {
        setUserMenuOpen(false);
        logout();
        router.push('/login');
    };

    return (
        <div className="relative user-menu-container">
            <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
            >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400">{user?.organization_name}</p>
                        </div>

                        {/* Menu Items */}
                        <Link href="/admin/account-settings">
                            <button
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${currentPage === 'account-settings'
                                        ? 'text-blue-700 bg-blue-50'
                                        : 'text-gray-700'
                                    }`}
                                onClick={() => setUserMenuOpen(false)}
                            >
                                <Settings className="w-4 h-4 mr-3" />
                                Account Settings
                                {currentPage === 'account-settings' && <span className="ml-auto text-xs">(Current)</span>}
                            </button>
                        </Link>

                        <Link href="/admin/events">
                            <button
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${currentPage === 'events'
                                        ? 'text-blue-700 bg-blue-50'
                                        : 'text-gray-700'
                                    }`}
                                onClick={() => setUserMenuOpen(false)}
                            >
                                <Calendar className="w-4 h-4 mr-3" />
                                All Events
                                {currentPage === 'events' && <span className="ml-auto text-xs">(Current)</span>}
                            </button>
                        </Link>

                        <div className="border-t border-gray-100">
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;