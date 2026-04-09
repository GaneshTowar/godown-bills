import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'godown-bills-secret-key';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.status(200).json({ success: true, username: decoded.username });
    } catch {
        res.status(401).json({ success: false, error: 'Session expired' });
    }
}
