import React from 'react';

const IndexPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-gray-800 mb-4">Welcome to Godown Bills</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Manage your bills efficiently with our mobile-responsive system. Store data securely in MongoDB and access it anytime.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                        <h2 className="text-2xl font-bold text-blue-600 mb-4">Bills Entry</h2>
                        <p className="text-gray-700 mb-4">Easily enter new bills with material details, quantities, and rates.</p>
                        <a href="/bills-entry" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">Go to Bills Entry</a>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">View Bills</h2>
                        <p className="text-gray-700 mb-4">Browse and manage all your stored bills in one place.</p>
                        <a href="/view-bills" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300">View Bills</a>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
                        <h2 className="text-2xl font-bold text-orange-600 mb-4">Manage Parties</h2>
                        <p className="text-gray-700 mb-4">Add or remove party names from the master list for bill entry suggestions.</p>
                        <a href="/manage-parties" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition duration-300">Manage Parties</a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IndexPage;