import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const PartyLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetch('/api/party-auth/me')
            .then(res => res.json())
            .then(data => { if (data.success) router.replace('/party-portal'); })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/party-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.success) {
                router.replace('/party-portal');
            } else {
                setError(data.error || 'Login failed.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-8 text-white text-center">
                    <h1 className="text-2xl font-bold">Party Portal</h1>
                    <p className="text-green-100 text-sm mt-1">Sign in to view your bills</p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Party Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Enter your party name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Enter password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 rounded-lg text-white font-semibold text-sm transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PartyLogin;
