import { connectDB } from '../../utils/db';
import BillEntryModel from '../../../models/BillEntry';
import { requireParty } from '../../utils/auth';

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = requireParty(req, res);
    if (!decoded) return;

    await connectDB();

    // Case-insensitive exact match so bills created with different casing still surface
    const nameRegex = new RegExp(`^${escapeRegex(decoded.partyUsername.trim())}$`, 'i');
    const bills = await BillEntryModel.find({ partyName: nameRegex }).sort({ billNumber: -1 });
    res.status(200).json({ success: true, data: bills });
}
