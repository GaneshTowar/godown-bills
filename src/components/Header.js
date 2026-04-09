import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Godown Bills</h1>

                <div className="flex items-center gap-6">
                    <nav>
                        <ul className="flex items-center space-x-6">
                            <li><a href="/" className="hover:text-blue-200 transition duration-300">Home</a></li>
                            <li><a href="/bills-entry" className="hover:text-blue-200 transition duration-300">Bills Entry</a></li>
                            <li><a href="/view-bills" className="hover:text-blue-200 transition duration-300">View Bills</a></li>
                            <li><a href="/manage-parties" className="hover:text-blue-200 transition duration-300">Manage Parties</a></li>
                        </ul>
                    </nav>

                    {/* Profile dropdown */}
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(prev => !prev)}
                                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition"
                            >
                                <div className="w-7 h-7 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium hidden sm:block">{user.username}</span>
                                <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Signed in as</p>
                                        <p className="text-sm font-semibold text-gray-800 truncate">{user.username}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium transition"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
