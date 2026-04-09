import { connectDB } from '../../../utils/db';
import UserModel from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '../../../utils/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await connectDB();

    // Optional first-run seed — only happens when env credentials are provided
    // and no admin user exists yet. No hardcoded secrets in source.
    const seedUsername = process.env.ADMIN_USERNAME;
    const seedPassword = process.env.ADMIN_PASSWORD;
    if (seedUsername && seedPassword) {
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
            const hashed = await bcrypt.hash(seedPassword, 10);
            await UserModel.create({ username: seedUsername, password: hashed });
        }
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const user = await UserModel.findOne({ username });
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const token = signAdminToken({ userId: user._id.toString(), username: user.username });

    const cookie = `auth_token=${token}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);

    res.status(200).json({ success: true, username: user.username });
}
