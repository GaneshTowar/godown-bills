import React, { useEffect, useState, useMemo } from 'react';

const PAGE_SIZE = 10;
const emptyMaterial = { material: '', qty: '', rate: '', amount: 0, returnDate: '', remark: '', status: 'not returned' };

const statusStyles = {
    'not returned':  'bg-red-100 text-red-700',
    'partial return': 'bg-yellow-100 text-yellow-700',
    'returned':      'bg-green-100 text-green-700',
};

const ViewBills = () => {
    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [editingBill, setEditingBill] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [markingBillId, setMarkingBillId] = useState(null);
    const [billStatusMsg, setBillStatusMsg] = useState({});
    const [savingPaidId, setSavingPaidId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIncomplete, setFilterIncomplete] = useState(false);
    const [filterUnpaid, setFilterUnpaid] = useState(false);

    useEffect(() => {
        fetchAllBills();
    }, []);

    const fetchAllBills = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bills?all=true');
            const data = await response.json();
            setAllBills(data.data || []);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBills = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let filtered = !q ? allBills : allBills.filter(bill =>
            (bill.partyName || '').toLowerCase().includes(q) ||
            String(bill.billNumber || '').toLowerCase().includes(q)
        );
        if (filterIncomplete) filtered = filtered.filter(bill => bill.status !== 'Completed');
        if (filterUnpaid) filtered = filtered.filter(bill => (bill.totalAmount || 0) - (bill.paidAmount || 0) > 0);
        return [...filtered].sort((a, b) => Number(b.billNumber) - Number(a.billNumber));
    }, [allBills, searchQuery, filterIncomplete, filterUnpaid]);

    const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
    const bills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const goToPage = (p) => {
        if (p < 1 || p > totalPages) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openEdit = (bill) => {
        setEditingBill({
            ...bill,
            billDate: bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : '',
            materialList: bill.materialList.map(item => ({
                ...item,
                returnDate: item.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : '',
            })),
        });
        setSaveMessage('');
    };

    const closeEdit = () => {
        setEditingBill(null);
        setSaveMessage('');
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setEditingBill(prev => ({ ...prev, [name]: value }));
    };

    const handleMaterialChange = (index, e) => {
        const { name, value } = e.target;
        const updated = [...editingBill.materialList];
        updated[index] = { ...updated[index], [name]: value };
        if (name === 'qty' || name === 'rate') {
            const qty = parseFloat(name === 'qty' ? value : updated[index].qty) || 0;
            const rate = parseFloat(name === 'rate' ? value : updated[index].rate) || 0;
            updated[index].amount = qty * rate;
        }
        setEditingBill(prev => ({ ...prev, materialList: updated }));
    };

    const addMaterialRow = () => {
        setEditingBill(prev => ({
            ...prev,
            materialList: [...prev.materialList, { ...emptyMaterial }],
        }));
    };

    const removeMaterialRow = (index) => {
        setEditingBill(prev => ({
            ...prev,
            materialList: prev.materialList.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');
        try {
            const billToSave = { ...editingBill, status: computeBillStatus(editingBill.materialList) };
            const response = await fetch(`/api/bills/${editingBill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(billToSave),
            });
            const result = await response.json();
            if (result.success) {
                setAllBills(prev => prev.map(b => b._id === editingBill._id ? result.data : b));
                setSaveMessage('✅ Bill updated successfully!');
                setTimeout(() => closeEdit(), 1200);
            } else {
                setSaveMessage(`❌ ${result.error}`);
            }
        } catch (error) {
            setSaveMessage(`❌ ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const computeBillStatus = (materialList) => {
        if (materialList.every(item => (item.status || 'not returned') === 'returned')) return 'Completed';
        return 'Pending';
    };

    const updateMaterialStatus = async (bill, index, newStatus) => {
        const updatedMaterialList = bill.materialList.map((item, i) =>
            i === index ? { ...item, status: newStatus } : item
        );
        const updatedBill = { ...bill, materialList: updatedMaterialList, status: computeBillStatus(updatedMaterialList) };
        try {
            const response = await fetch(`/api/bills/${bill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBill),
            });
            const result = await response.json();
            if (result.success) {
                setAllBills(prev => prev.map(b => b._id === bill._id ? result.data : b));
            }
        } catch (error) {
            console.error('Failed to update material status:', error);
        }
    };

    const markAllReturned = async (bill) => {
        setMarkingBillId(bill._id);
        setBillStatusMsg(prev => ({ ...prev, [bill._id]: '' }));
        try {
            const updatedMaterialList = bill.materialList.map(item => ({ ...item, status: 'returned' }));
            const updatedBill = { ...bill, materialList: updatedMaterialList, status: 'Completed' };
            const response = await fetch(`/api/bills/${bill._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBill),
            });
            const result = await response.json();
            if (result.success) {
                setAllBills(prev => prev.map(b => b._id === bill._id ? result.data : b));
                setBillStatusMsg(prev => ({ ...prev, [bill._id]: '✅ All materials marked as returned!' }));
                setTimeout(() => setBillStatusMsg(prev => ({ ...prev, [bill._id]: '' })), 3000);
            } else {
                setBillStatusMsg(prev => ({ ...prev, [bill._id]: `❌ ${result.error}` }));
            }
        } catch (err) {
            setBillStatusMsg(prev => ({ ...prev, [bill._id]: `❌ ${err.message}` }));
        } finally {
            setMarkingBillId(null);
        }
    };

    const grandTotal = editingBill
        ? editingBill.materialList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
        : 0;

    // Build page number list with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const PaginationBar = () => (
        <div className="flex flex-wrap justify-center items-center gap-2 py-4">
            <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
                ← Previous
            </button>

            {getPageNumbers().map((p, i) =>
                p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">...</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${p === page ? 'bg-blue-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
                Next →
            </button>

            <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-gray-500">Go to</span>
                <input
                    type="number"
                    min="1"
                    max={totalPages}
                    defaultValue={page}
                    key={page}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) goToPage(val);
                        }
                    }}
                    className="w-16 px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">of {totalPages}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">All Bill Records</h1>
                    {!loading && filteredBills.length > 0 && (
                        <span className="text-xs sm:text-sm text-gray-500 block mt-0.5">
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredBills.length)} of {filteredBills.length}{searchQuery ? ` (filtered from ${allBills.length})` : ''} bills
                        </span>
                    )}
                </div>

                {/* Search */}
                <div className="mb-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search by party name or bill number..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterIncomplete}
                            onChange={e => { setFilterIncomplete(e.target.checked); setPage(1); }}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Not Completed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterUnpaid}
                            onChange={e => { setFilterUnpaid(e.target.checked); setPage(1); }}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Has Pending Amount</span>
                    </label>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading your bills...</div>
                ) : bills.length === 0 ? (
                    <p className="text-center text-gray-500">No bills found.</p>
                ) : (
                    <>
                        {totalPages > 1 && <PaginationBar />}
                        <div className="space-y-6">
                            {bills.map((bill) => (
                                <div key={bill._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                                    {/* Bill Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 text-white">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h2 className="text-base sm:text-lg font-bold truncate">{bill.partyName}</h2>
                                                {bill.billNumber && (
                                                    <p className="text-xs sm:text-sm text-blue-100">Bill No: {bill.billNumber}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-lg sm:text-2xl font-bold">₹{bill.totalAmount}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${bill.status === 'Pending' ? 'bg-yellow-400 text-yellow-900' : bill.status === 'Cancelled' ? 'bg-red-400 text-red-900' : 'bg-green-400 text-green-900'}`}>
                                                        {bill.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => openEdit(bill)}
                                                    className="bg-white text-blue-700 font-semibold text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-50 transition duration-200 shadow"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bill Meta */}
                                    <div className="px-3 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                                        {bill.TakerEmployee && (
                                            <div>
                                                <span className="text-gray-500 block">Taker Employee</span>
                                                <span className="font-medium text-gray-800">{bill.TakerEmployee}</span>
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
                                        <div className="px-3 sm:px-6 py-4">
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
                                                            <th className="pb-2 font-medium">Remark</th>
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
                                                                <td className="py-2 text-gray-500 italic">{item.remark || '—'}</td>
                                                                <td className="py-2 text-center">
                                                                    <select
                                                                        value={item.status || 'not returned'}
                                                                        onChange={(e) => updateMaterialStatus(bill, index, e.target.value)}
                                                                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusStyles[item.status || 'not returned']}`}
                                                                    >
                                                                        <option value="not returned">not returned</option>
                                                                        <option value="partial return">partial return</option>
                                                                        <option value="returned">returned</option>
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Footer */}
                                    <div className="px-3 sm:px-6 py-4 bg-blue-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => markAllReturned(bill)}
                                                disabled={markingBillId === bill._id || bill.materialList.every(i => (i.status || 'not returned') === 'returned')}
                                                className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${markingBillId === bill._id ? 'bg-blue-400 text-white cursor-wait' : bill.materialList.every(i => (i.status || 'not returned') === 'returned') ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                            >
                                                {markingBillId === bill._id ? 'Updating...' : bill.materialList.every(i => (i.status || 'not returned') === 'returned') ? '✔ All Returned' : 'Mark All Returned'}
                                            </button>
                                            {billStatusMsg[bill._id] && (
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${billStatusMsg[bill._id].includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {billStatusMsg[bill._id]}
                                                </span>
                                            )}
                                        </div>

                                        {/* Payment Section */}
                                        <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                                            <p className="text-base font-bold text-blue-700">Grand Total: ₹{bill.totalAmount}</p>

                                            {/* Paid Amount Input */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm font-semibold text-gray-600">Paid (₹):</label>
                                                <input
                                                    type="number"
                                                    value={bill.paidAmount || ''}
                                                    onChange={(e) => {
                                                        const paid = parseFloat(e.target.value) || 0;
                                                        setAllBills(prev => prev.map(b => b._id === bill._id ? { ...b, paidAmount: paid } : b));
                                                    }}
                                                    className="w-28 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    disabled={savingPaidId === bill._id}
                                                    onClick={async () => {
                                                        setSavingPaidId(bill._id);
                                                        await fetch(`/api/bills/${bill._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ ...bill }),
                                                        });
                                                        setSavingPaidId(null);
                                                    }}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${savingPaidId === bill._id ? 'bg-gray-300 text-gray-500 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                >
                                                    {savingPaidId === bill._id ? 'Saving...' : 'Confirm'}
                                                </button>
                                            </div>

                                            {/* Pending Amount */}
                                            {(() => {
                                                const pending = (bill.totalAmount || 0) - (bill.paidAmount || 0);
                                                if (bill.paidAmount === 0 || bill.paidAmount === undefined || bill.paidAmount === null) {
                                                    return (
                                                        <div className="flex items-center gap-2 bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg">
                                                            <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Unpaid</span>
                                                            <span className="text-sm font-bold text-red-600">₹{bill.totalAmount}</span>
                                                        </div>
                                                    );
                                                } else if (pending < 0) {
                                                    return (
                                                        <div className="flex items-center gap-2 bg-purple-100 border border-purple-300 px-3 py-1.5 rounded-lg">
                                                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Overpaid</span>
                                                            <span className="text-sm font-bold text-purple-700">₹{Math.abs(pending)} extra</span>
                                                        </div>
                                                    );
                                                } else if (pending === 0) {
                                                    return (
                                                        <div className="flex items-center gap-2 bg-green-100 border border-green-300 px-3 py-1.5 rounded-lg">
                                                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Fully Paid</span>
                                                            <span className="text-sm font-bold text-green-700">₹0 pending</span>
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 px-3 py-1.5 rounded-lg">
                                                            <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pending</span>
                                                            <span className="text-sm font-bold text-yellow-800">₹{pending}</span>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && <PaginationBar />}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingBill && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white rounded-t-xl flex justify-between items-center">
                            <h2 className="text-xl font-bold">Edit Bill</h2>
                            <button onClick={closeEdit} className="text-white hover:text-blue-200 text-2xl font-bold leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* Top fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bill Number</label>
                                    <input type="number" name="billNumber" min="1" value={editingBill.billNumber || ''} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                    <input type="date" name="billDate" value={editingBill.billDate || ''} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Party Name</label>
                                    <input type="text" name="partyName" value={editingBill.partyName || ''} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Material Giver</label>
                                    <input type="text" name="personName" value={editingBill.personName || ''} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Taker Employee</label>
                                    <input type="text" name="TakerEmployee" value={editingBill.TakerEmployee || ''} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select name="status" value={editingBill.status || 'Pending'} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Paid Amount (₹)</label>
                                    <input type="number" name="paidAmount" value={editingBill.paidAmount ?? 0} onChange={handleFieldChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                </div>
                            </div>

                            {/* Material List */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Items</label>
                                    <button type="button" onClick={addMaterialRow}
                                        className="bg-green-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-green-600 transition">
                                        + Add Item
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {editingBill.materialList.map((item, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                                                <input type="text" name="material" placeholder="Item name" value={item.material || ''} onChange={(e) => handleMaterialChange(index, e)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <input type="number" name="qty" placeholder="Qty" value={item.qty || ''} onChange={(e) => handleMaterialChange(index, e)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <input type="number" name="rate" placeholder="Rate" value={item.rate || ''} onChange={(e) => handleMaterialChange(index, e)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <div className="flex items-center text-sm font-semibold text-green-600">
                                                    Amount: ₹{item.amount || 0}
                                                </div>
                                                <input type="date" name="returnDate" value={item.returnDate || ''} onChange={(e) => handleMaterialChange(index, e)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <input type="text" name="remark" placeholder="Remark" value={item.remark || ''} onChange={(e) => handleMaterialChange(index, e)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                                <select name="status" value={item.status || 'not returned'} onChange={(e) => handleMaterialChange(index, e)}
                                                    className={`px-3 py-2 border-0 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusStyles[item.status || 'not returned']}`}>
                                                    <option value="not returned">not returned</option>
                                                    <option value="partial return">partial return</option>
                                                    <option value="returned">returned</option>
                                                </select>
                                            </div>
                                            {editingBill.materialList.length > 1 && (
                                                <button type="button" onClick={() => removeMaterialRow(index)}
                                                    className="text-red-500 text-xs hover:text-red-700">
                                                    Remove item
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Grand Total & Payment Summary */}
                            <div className="bg-blue-50 px-4 py-3 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700">Grand Total</span>
                                    <span className="text-xl font-bold text-blue-600">₹{grandTotal}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-600">Paid Amount</span>
                                    <span className="text-sm font-bold text-green-600">₹{editingBill.paidAmount ?? 0}</span>
                                </div>
                                {(() => {
                                    const pending = grandTotal - (editingBill.paidAmount ?? 0);
                                    if (pending < 0) return (
                                        <div className="flex justify-between items-center bg-purple-100 px-3 py-1.5 rounded-lg">
                                            <span className="text-sm font-semibold text-purple-700">Overpaid</span>
                                            <span className="text-sm font-bold text-purple-700">₹{Math.abs(pending)} extra</span>
                                        </div>
                                    );
                                    if (pending === 0) return (
                                        <div className="flex justify-between items-center bg-green-100 px-3 py-1.5 rounded-lg">
                                            <span className="text-sm font-semibold text-green-700">Fully Paid</span>
                                            <span className="text-sm font-bold text-green-700">₹0 pending</span>
                                        </div>
                                    );
                                    return (
                                        <div className="flex justify-between items-center bg-yellow-100 px-3 py-1.5 rounded-lg">
                                            <span className="text-sm font-semibold text-yellow-800">Pending Amount</span>
                                            <span className="text-sm font-bold text-yellow-800">₹{pending}</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {saveMessage && (
                                <div className={`p-3 rounded-lg text-center text-sm font-semibold ${saveMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {saveMessage}
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <button onClick={closeEdit}
                                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className={`px-6 py-2 rounded-lg text-white font-semibold transition ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewBills;
