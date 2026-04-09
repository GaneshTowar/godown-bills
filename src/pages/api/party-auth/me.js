import { verifyParty } from '../../../utils/auth';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = verifyParty(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    res.status(200).json({ success: true, username: decoded.partyUsername });
}
