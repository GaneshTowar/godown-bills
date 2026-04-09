import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';

const PAGE_SIZE = 10;

const statusStyles = {
    'not returned':  'bg-red-100 text-red-700',
    'partial return': 'bg-yellow-100 text-yellow-700',
    'returned':      'bg-green-100 text-green-700',
};

const PartyPortal = () => {
    const router = useRouter();
    const [partyName, setPartyName] = useState('');
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIncomplete, setFilterIncomplete] = useState(false);
    const [filterUnpaid, setFilterUnpaid] = useState(false);

    useEffect(() => {
        fetch('/api/party-auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    router.replace('/party-login');
                } else {
                    setPartyName(data.username);
                    return fetch('/api/party-bills').then(r => r.json());
                }
            })
            .then(data => {
                if (data) setAllBills(data.data || []);
            })
            .catch(() => router.replace('/party-login'))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/party-auth/logout', { method: 'POST' });
        router.replace('/party-login');
    };

    const filteredBills = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let filtered = !q ? allBills : allBills.filter(bill =>
            String(bill.billNumber || '').includes(q)
        );
        if (filterIncomplete) filtered = filtered.filter(bill => bill.status !== 'Completed');
        if (filterUnpaid) filtered = filtered.filter(bill => (bill.totalAmount || 0) - (bill.paidAmount || 0) > 0);
        return filtered;
    }, [allBills, searchQuery, filterIncomplete, filterUnpaid]);

    const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
    const bills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const goToPage = (p) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const PaginationBar = () => (
        <div className="flex flex-wrap justify-center items-center gap-2 py-4">
            <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                ← Previous
            </button>
            {getPageNumbers().map((p, i) =>
                p === '...' ? (
                    <span key={`e-${i}`} className="px-2 py-2 text-gray-400 text-sm">...</span>
                ) : (
                    <button key={p} onClick={() => goToPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${p === page ? 'bg-green-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                        {p}
                    </button>
                )
            )}
            <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                Next →
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Party Portal</h1>
                        <p className="text-green-100 text-sm">{partyName}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-white text-green-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-4">

                {/* Page title & count */}
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h2 className="text-xl font-bold text-gray-800">Your Bills</h2>
                    {!loading && filteredBills.length > 0 && (
                        <span className="text-sm text-gray-500">
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredBills.length)} of {filteredBills.length}
                            {searchQuery || filterIncomplete || filterUnpaid ? ` (filtered from ${allBills.length})` : ''} bills
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="mb-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="Search by bill number..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={filterIncomplete}
                            onChange={e => { setFilterIncomplete(e.target.checked); setPage(1); }}
                            className="w-4 h-4 accent-green-600" />
                        <span className="text-sm font-medium text-gray-700">Not Completed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={filterUnpaid}
                            onChange={e => { setFilterUnpaid(e.target.checked); setPage(1); }}
                            className="w-4 h-4 accent-green-600" />
                        <span className="text-sm font-medium text-gray-700">Has Pending Amount</span>
                    </label>
                </div>

                {bills.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">No bills found.</p>
                ) : (
                    <>
                        {totalPages > 1 && <PaginationBar />}
                        <div className="space-y-6">
                            {bills.map((bill) => (
                                <div key={bill._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                                    {/* Bill Header */}
                                    <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white flex justify-between items-center">
                                        <div>
                                            <h2 className="text-lg font-bold">{bill.partyName}</h2>
                                            {bill.billNumber && (
                                                <p className="text-sm text-green-100">Bill No: {bill.billNumber}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">₹{bill.totalAmount}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${bill.status === 'Pending' ? 'bg-yellow-400 text-yellow-900' : bill.status === 'Cancelled' ? 'bg-red-400 text-red-900' : 'bg-green-400 text-green-900'}`}>
                                                {bill.status || 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bill Meta */}
                                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500 block">Date</span>
                                            <span className="font-medium text-gray-800">
                                                {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        {bill.personName && (
                                            <div>
                                                <span className="text-gray-500 block">Material Giver</span>
                                                <span className="font-medium text-gray-800">{bill.personName}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500 block">Created</span>
                                            <span className="font-medium text-gray-800">
                                                {new Date(bill.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Material List */}
                                    {bill.materialList && bill.materialList.length > 0 && (
                                        <div className="px-6 py-4">
                                            <h3 className="text-sm font-semibold text-gray-600 mb-3">Items</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-gray-500 border-b border-gray-100">
                                                            <th className="pb-2 font-medium">Item</th>
                                                            <th className="pb-2 font-medium text-center">Qty</th>
                                                            <th className="pb-2 font-medium text-center">Rate</th>
                                                            <th className="pb-2 font-medium text-right">Amount</th>
                                                            <th className="pb-2 font-medium text-center">Return Date</th>
                                                            <th className="pb-2 font-medium text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bill.materialList.map((item, index) => (
                                                            <tr key={index} className="border-b border-gray-50 last:border-0">
                                                                <td className="py-2 text-gray-900 font-medium">{item.material || '—'}</td>
                                                                <td className="py-2 text-center text-gray-700">{item.qty ?? '—'}</td>
                                                                <td className="py-2 text-center text-gray-700">₹{item.rate ?? '—'}</td>
                                                                <td className="py-2 text-right text-green-600 font-semibold">₹{item.amount ?? 0}</td>
                                                                <td className="py-2 text-center text-gray-500">
                                                                    {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[item.status || 'not returned']}`}>
                                                                        {item.status || 'not returned'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Footer */}
                                    <div className="px-6 py-4 bg-green-50 flex flex-wrap justify-end items-center gap-3">
                                        <p className="text-base font-bold text-green-700">Grand Total: ₹{bill.totalAmount}</p>
                                        {(() => {
                                            const pending = (bill.totalAmount || 0) - (bill.paidAmount || 0);
                                            if (!bill.paidAmount) return (
                                                <div className="flex items-center gap-2 bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg">
                                                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Unpaid</span>
                                                    <span className="text-sm font-bold text-red-600">₹{bill.totalAmount}</span>
                                                </div>
                                            );
                                            if (pending < 0) return (
                                                <div className="flex items-center gap-2 bg-purple-100 border border-purple-300 px-3 py-1.5 rounded-lg">
                                                    <span className="text-xs font-semibold text-purple-600 uppercase">Overpaid</span>
                                                    <span className="text-sm font-bold text-purple-700">₹{Math.abs(pending)} extra</span>
                                                </div>
                                            );
                                            if (pending === 0) return (
                                                <div className="flex items-center gap-2 bg-green-100 border border-green-300 px-3 py-1.5 rounded-lg">
                                                    <span className="text-xs font-semibold text-green-600 uppercase">Fully Paid</span>
                                                    <span className="text-sm font-bold text-green-700">₹0 pending</span>
                                                </div>
                                            );
                                            return (
                                                <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 px-3 py-1.5 rounded-lg">
                                                    <span className="text-xs font-semibold text-yellow-700 uppercase">Pending</span>
                                                    <span className="text-sm font-bold text-yellow-800">₹{pending}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && <PaginationBar />}
                    </>
                )}
            </div>
        </div>
    );
};

export default PartyPortal;
