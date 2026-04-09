import { connectDB } from '../../../utils/db';
import PartyUserModel from '../../../../models/PartyUser';
import bcrypt from 'bcryptjs';
import { signPartyToken } from '../../../utils/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await connectDB();

    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const user = await PartyUserModel.findOne({ username: String(username).trim() });
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = signPartyToken({ partyUsername: user.username });

    const cookie = `party_token=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);

    res.status(200).json({ success: true, username: user.username });
}
