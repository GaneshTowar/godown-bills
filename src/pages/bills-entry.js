import React, { useState } from 'react';

const BillsEntry = () => {
    const [formData, setFormData] = useState({
        billNumber: '',
        billDate: '',
        partyName: '',
        materialList: [{ material: '', qty: '', rate: '', amount: 0 , returnDate :'',remark:''  }],
        personName: '',
        grandTotal: 0,
        TakerEmployee: '',
        status: 'Pending',

    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

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
            materialList: [...formData.materialList, { material: '', qty: '', rate: '', amount: 0 }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

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
                // Reset form
                setFormData({
                    billNumber: '',
                    billDate: '',
                    partyName: '',
                    materialList: [{ material: '', qty: '', rate: '', amount: 0 }],
                    personName: ''
                });
                setTimeout(() => setMessage(''), 3000);
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

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Number</label>
                            <input type="text" name="billNumber" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <input type="date" name="billDate" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Party Name</label>
                        <input type="text" name="partyName" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-lg font-semibold text-gray-700">Items List</label>
                            <button type="button" onClick={addMaterial} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 font-medium">+ Add Item</button>
                        </div>

                        {formData.materialList.map((material, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                <input type="text" name="material" placeholder="Item" className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => handleMaterialChange(index, e)} />
                                <input type="number" name="qty" placeholder="Qty" className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => handleMaterialChange(index, e)} />
                                <input type="number" name="rate" placeholder="Rate" className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => handleMaterialChange(index, e)} />
                                <div className="flex items-center text-lg font-semibold text-green-600">₹{material.amount}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Receiver Name</label>
                        <input type="text" name="personName" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" onChange={handleChange} />
                    </div>

                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg mb-6">
                        <span className="text-xl font-bold text-gray-700">Total Amount</span>
                        <span className="text-2xl font-bold text-blue-600">₹{formData.materialList.reduce((sum, item) => sum + item.amount, 0)}</span>
                    </div>

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