import React, { useState, useEffect } from 'react';

const today = new Date().toISOString().split('T')[0];

const BillsEntry = () => {
    const [partyNames, setPartyNames] = useState([]);
    const [formData, setFormData] = useState({
        billNumber: '',
        billDate: today,
        partyName: '',
        materialList: [{ material: '', qty: '', rate: '', amount: 0, returnDate: '', remark: '', status: 'not returned' }],
        personName: '',
        grandTotal: 0,
        TakerEmployee: '',
        status: 'Pending',
        paidAmount: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/parties')
            .then(res => res.json())
            .then(data => setPartyNames((data.data || []).map(p => p.name)))
            .catch(() => {});

        fetch('/api/bills?latest=true')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFormData(prev => ({ ...prev, billNumber: String(data.nextBillNumber) }));
                }
            })
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleMaterialChange = (index, e) => {
        const { name, value } = e.target;
        const updatedMaterials = [...formData.materialList];
        updatedMaterials[index][name] = value;

        if (name === 'qty' || name === 'rate') {
            const q = updatedMaterials[index].qty || 0;
            const r = updatedMaterials[index].rate || 0;
            updatedMaterials[index].amount = q * r;
        }
        setFormData({ ...formData, materialList: updatedMaterials });
    };

    const addMaterial = () => {
        setFormData({
            ...formData,
            materialList: [...formData.materialList, { material: '', qty: '', rate: '', amount: 0, returnDate: '', remark: '', status: 'not returned' }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Validation
        if (!formData.billNumber.trim()) {
            setMessage('❌ Bill Number is required.');
            return;
        }
        if (!formData.partyName.trim()) {
            setMessage('❌ Party Name is required.');
            return;
        }
        const validItems = formData.materialList.filter(item => item.material.trim() && item.qty !== '' && item.qty > 0);
        if (validItems.length === 0) {
            setMessage('❌ At least one item with a name and quantity is required.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                const grandTotal = formData.materialList.reduce((sum, item) => sum + item.amount, 0);
                setMessage(`✅ Bill Saved Successfully! Total: ₹${grandTotal}`);
                // Fetch next bill number for the reset form
                const nextRes = await fetch('/api/bills?latest=true').then(r => r.json()).catch(() => ({}));
                setFormData({
                    billNumber: nextRes.success ? String(nextRes.nextBillNumber) : '',
                    billDate: today,
                    partyName: '',
                    materialList: [{ material: '', qty: '', rate: '', amount: 0, returnDate: '', remark: '', status: 'not returned' }],
                    personName: '',
                    TakerEmployee: '',
                    status: 'Pending',
                    paidAmount: '',
                });
                setTimeout(() => setMessage(''), 3000);
            } else if (response.status === 409) {
                // Duplicate bill number — likely another user created one concurrently.
                // Refresh the next available number so the user can retry immediately.
                const nextRes = await fetch('/api/bills?latest=true').then(r => r.json()).catch(() => ({}));
                if (nextRes.success) {
                    setFormData(prev => ({ ...prev, billNumber: String(nextRes.nextBillNumber) }));
                    setMessage(`❌ ${result.error} Bill number updated to ${nextRes.nextBillNumber} — please click Save again.`);
                } else {
                    setMessage(`❌ Error: ${result.error}`);
                }
            } else {
                setMessage(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <h2 className="text-3xl font-bold">Event Rental Bill</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Number <span className="text-red-500">*</span></label>
                            <input type="number" name="billNumber" min="1" value={formData.billNumber} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onChange={handleChange} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Date</label>
                            <input type="date" name="billDate" value={formData.billDate} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Party Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="partyName"
                            value={formData.partyName}
                            list="party-suggestions"
                            autoComplete="off"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                            onChange={handleChange}
                        />
                        <datalist id="party-suggestions">
                            {partyNames.map(name => <option key={name} value={name} />)}
                        </datalist>
                    </div>

                    <div className="mb-6">
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <div>
                                <label className="text-base sm:text-lg font-semibold text-gray-700">Items List</label>
                                <span className="block text-xs text-red-500 mt-0.5">At least 1 item with qty required</span>
                            </div>
                            <button type="button" onClick={addMaterial} className="bg-green-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-green-600 transition duration-300 font-medium">+ Add Item</button>
                        </div>

                        {formData.materialList.map((material, index) => (
                            <div key={index} className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs text-gray-500 mb-1">Item</label>
                                        <input type="text" name="material" placeholder="Item name" value={material.material} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" onChange={(e) => handleMaterialChange(index, e)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                                        <input type="number" name="qty" placeholder="0" value={material.qty} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" onChange={(e) => handleMaterialChange(index, e)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Rate (₹)</label>
                                        <input type="number" name="rate" placeholder="0" value={material.rate} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" onChange={(e) => handleMaterialChange(index, e)} />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                        <div className="px-3 py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-md border border-green-200">₹{material.amount}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Material Giver</label>
                        <input type="text" name="personName" value={formData.personName} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                    </div>

                    {(() => {
                        const total = formData.materialList.reduce((sum, item) => sum + item.amount, 0);
                        const pending = total - (formData.paidAmount || 0);
                        return (
                            <div className="bg-blue-50 p-4 rounded-lg mb-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-700">Total Amount</span>
                                    <span className="text-2xl font-bold text-blue-600">₹{total}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-600">Paid Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="paidAmount"
                                        value={formData.paidAmount}
                                        onChange={handleChange}
                                        className="w-36 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                                {pending < 0 ? (
                                    <div className="flex justify-between items-center bg-purple-100 border border-purple-300 px-3 py-2 rounded-lg">
                                        <span className="text-sm font-semibold text-purple-700">Overpaid</span>
                                        <span className="text-sm font-bold text-purple-700">₹{Math.abs(pending)} extra</span>
                                    </div>
                                ) : pending === 0 ? (
                                    <div className="flex justify-between items-center bg-green-100 border border-green-300 px-3 py-2 rounded-lg">
                                        <span className="text-sm font-semibold text-green-700">Fully Paid</span>
                                        <span className="text-sm font-bold text-green-700">₹0 pending</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-yellow-100 border border-yellow-300 px-3 py-2 rounded-lg">
                                        <span className="text-sm font-semibold text-yellow-800">Pending Amount</span>
                                        <span className="text-sm font-bold text-yellow-800">₹{pending}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 text-center font-semibold ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className={`w-full ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 px-6 rounded-lg transition duration-300 font-semibold text-lg shadow-md`}>
                        {loading ? 'Saving...' : 'Save to Database'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BillsEntry;