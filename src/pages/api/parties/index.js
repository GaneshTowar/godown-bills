import { connectDB } from '../../../utils/db';
import PartyModel from '../../../../models/Party';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'GET') {
        try {
            const parties = await PartyModel.find({}).sort({ name: 1 });
            res.status(200).json({ success: true, data: parties });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }

    } else if (req.method === 'POST') {
        try {
            const { name } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, error: 'Party name is required.' });
            }
            const party = await PartyModel.create({ name: name.trim() });
            res.status(201).json({ success: true, data: party });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ success: false, error: 'This party already exists.' });
            }
            res.status(400).json({ success: false, error: error.message });
        }

    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
