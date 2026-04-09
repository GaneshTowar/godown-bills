import { connectDB } from '../../../utils/db';
import PartyModel from '../../../../models/Party';
import { requireAdmin } from '../../../utils/auth';

export default async function handler(req, res) {
    if (!requireAdmin(req, res)) return;

    await connectDB();

    if (req.method === 'DELETE') {
        try {
            const deleted = await PartyModel.findByIdAndDelete(req.query.id);
            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Party not found.' });
            }
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
