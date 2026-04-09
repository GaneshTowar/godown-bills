import React, { useEffect, useState } from 'react';

const ManageParties = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [passwordSet, setPasswordSet] = useState(new Set());

    // Password modal state
    const [passwordModal, setPasswordModal] = useState(null); // { name }
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        fetchParties();
        fetchPasswordSet();
    }, []);

    const fetchParties = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/parties');
            const data = await res.json();
            setParties(data.data || []);
        } catch (error) {
            console.error('Error fetching parties:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPasswordSet = async () => {
        try {
            const res = await fetch('/api/party-auth/set-password');
            const data = await res.json();
            if (data.success) setPasswordSet(new Set(data.usernames));
        } catch {}
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setAdding(true);
        setMessage('');
        try {
            const res = await fetch('/api/parties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setParties(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
                setNewName('');
                setMessage('✅ Party added successfully.');
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setAdding(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setParties(prev => prev.filter(p => p._id !== id));
            }
        } catch (error) {
            console.error('Error deleting party:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const openPasswordModal = (name) => {
        setPasswordModal({ name });
        setNewPassword('');
        setPasswordMessage('');
    };

    const closePasswordModal = () => {
        setPasswordModal(null);
        setNewPassword('');
        setPasswordMessage('');
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword.trim() || newPassword.length < 4) {
            setPasswordMessage('❌ Password must be at least 4 characters.');
            return;
        }
        setSavingPassword(true);
        setPasswordMessage('');
        try {
            const res = await fetch('/api/party-auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: passwordModal.name, password: newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setPasswordMessage('✅ Password saved successfully.');
                setPasswordSet(prev => new Set([...prev, passwordModal.name]));
                setTimeout(() => closePasswordModal(), 1500);
            } else {
                setPasswordMessage(`❌ ${data.error}`);
            }
        } catch (err) {
            setPasswordMessage(`❌ ${err.message}`);
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-lg mx-auto">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl px-6 py-5 text-white mb-6 text-center">
                    <h1 className="text-2xl font-bold">Manage Parties</h1>
                    <p className="text-sm text-blue-100 mt-1">Add or remove party names from the master list</p>
                </div>

                {/* Add Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                    <form onSubmit={handleAdd} className="flex gap-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter party name..."
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={adding || !newName.trim()}
                            className={`px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition ${adding || !newName.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {adding ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                    {message && (
                        <p className={`mt-3 text-sm font-semibold ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Party List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Party List</span>
                        <span className="text-xs text-gray-400">{parties.length} parties</span>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-500 text-sm py-8">Loading...</p>
                    ) : parties.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">No parties yet. Add one above.</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {parties.map(party => (
                                <li key={party._id} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition">
                                    <span className="text-sm font-medium text-gray-800">{party.name}</span>
                                    <div className="flex items-center gap-3">
                                        {passwordSet.has(party.name) ? (
                                            <button
                                                onClick={() => openPasswordModal(party.name)}
                                                className="text-xs text-green-600 hover:text-green-800 font-semibold transition"
                                            >
                                                Reset Password
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openPasswordModal(party.name)}
                                                className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition"
                                            >
                                                Set Password
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(party._id)}
                                            disabled={deletingId === party._id}
                                            className="text-xs text-red-500 hover:text-red-700 font-semibold transition disabled:opacity-40"
                                        >
                                            {deletingId === party._id ? 'Removing...' : 'Remove'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <a href="/" className="text-sm text-blue-600 hover:underline">← Back to Home</a>
                </div>
            </div>

            {/* Set Password Modal */}
            {passwordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold">{passwordSet.has(passwordModal.name) ? 'Reset Portal Password' : 'Set Portal Password'}</h2>
                            <button onClick={closePasswordModal} className="text-white hover:text-blue-200 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSetPassword} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Setting password for: <span className="font-semibold text-gray-800">{passwordModal.name}</span>
                            </p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    autoFocus
                                    placeholder="Min. 4 characters"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            {passwordMessage && (
                                <p className={`text-sm font-semibold ${passwordMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                    {passwordMessage}
                                </p>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={closePasswordModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingPassword}
                                    className={`px-5 py-2 rounded-lg text-white font-semibold text-sm transition ${savingPassword ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {savingPassword ? 'Saving...' : 'Save Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageParties;
