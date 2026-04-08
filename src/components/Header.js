import React from 'react';

const Header = () => {
    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
                <h1 className="text-2xl font-bold text-center mb-4">Godown Bills</h1>
                <nav>
                    <ul className="flex justify-center space-x-6">
                        <li><a href="/" className="hover:text-blue-200 transition duration-300">Home</a></li>
                        <li><a href="/bills-entry" className="hover:text-blue-200 transition duration-300">Bills Entry</a></li>
                        <li><a href="/view-bills" className="hover:text-blue-200 transition duration-300">View Bills</a></li>
                        <li><a href="/search-bills" className="hover:text-blue-200 transition duration-300">Search by Name</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;