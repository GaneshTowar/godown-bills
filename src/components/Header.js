import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
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

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/bills-entry', label: 'Bills Entry' },
        { href: '/view-bills', label: 'View Bills' },
        { href: '/manage-parties', label: 'Manage Parties' },
    ];

    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold">Godown Bills</h1>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6">
                    <nav>
                        <ul className="flex items-center space-x-6">
                            {navLinks.map(link => (
                                <li key={link.href}>
                                    <a href={link.href} className="hover:text-blue-200 transition duration-300 text-sm font-medium">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
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
                                <span className="text-sm font-medium">{user.username}</span>
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

                {/* Mobile right: avatar + hamburger */}
                <div className="flex items-center gap-2 md:hidden">
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(prev => !prev)}
                                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 px-2.5 py-1.5 rounded-lg transition"
                            >
                                <div className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="p-2 rounded-lg hover:bg-blue-700 transition"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <nav className="md:hidden bg-blue-700 border-t border-blue-500">
                    <ul className="px-4 py-2">
                        {navLinks.map(link => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="block py-3 text-sm font-medium hover:text-blue-200 transition border-b border-blue-600 last:border-0"
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </header>
    );
};

export default Header;
