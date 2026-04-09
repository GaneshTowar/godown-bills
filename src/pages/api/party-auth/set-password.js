import { connectDB } from '../../../utils/db';
import PartyUserModel from '../../../../models/PartyUser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'godown-bills-secret-key';

export default async function handler(req, res) {
    // Only admins can access this endpoint
    const token = req.cookies.auth_token;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Admin authentication required.' });
    }
    try {
        jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(401).json({ success: false, error: 'Admin session expired.' });
    }

    await connectDB();

    if (req.method === 'GET') {
        const users = await PartyUserModel.find({}).select('username');
        return res.status(200).json({ success: true, usernames: users.map(u => u.username) });
    }

    if (req.method === 'POST') {
        const { username, password } = req.body;
        if (!username || !password || password.length < 4) {
            return res.status(400).json({ success: false, error: 'Username and a password of at least 4 characters are required.' });
        }

        const hashed = await bcrypt.hash(password, 10);

        await PartyUserModel.findOneAndUpdate(
            { username: username.trim() },
            { username: username.trim(), password: hashed },
            { upsert: true, new: true }
        );

        return res.status(200).json({ success: true, message: `Password set for "${username}".` });
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
}
