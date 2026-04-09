import { connectDB } from '../../../utils/db';
import UserModel from '../../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'godown-bills-secret-key';
const DEFAULT_USERNAME = 'dattmandap';
const DEFAULT_PASSWORD = 'dattmandap@123qwe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await connectDB();

    // Seed default user on first run
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
        const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        await UserModel.create({ username: DEFAULT_USERNAME, password: hashed });
    }

    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: '30d' }
    );

    const cookie = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);

    res.status(200).json({ success: true, username: user.username });
}
