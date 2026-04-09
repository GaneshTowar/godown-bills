import { connectDB } from '../../../utils/db';
import PartyUserModel from '../../../../models/PartyUser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'godown-bills-secret-key';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await connectDB();

    const { username, password } = req.body;

    const user = await PartyUserModel.findOne({ username: username.trim() });
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
        { partyUsername: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    const cookie = `party_token=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);

    res.status(200).json({ success: true, username: user.username });
}
