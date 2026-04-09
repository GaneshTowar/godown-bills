import { connectDB } from '../../utils/db';
import BillEntryModel from '../../../models/BillEntry';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'godown-bills-secret-key';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const token = req.cookies.party_token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    let partyUsername;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        partyUsername = decoded.partyUsername;
    } catch {
        return res.status(401).json({ success: false, error: 'Session expired' });
    }

    await connectDB();

    const bills = await BillEntryModel.find({ partyName: partyUsername }).sort({ billNumber: -1 });
    res.status(200).json({ success: true, data: bills });
}
