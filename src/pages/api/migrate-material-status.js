import { connectDB } from '../../utils/db';
import BillEntryModel from '../../../models/BillEntry';
import { requireAdmin } from '../../utils/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    if (!requireAdmin(req, res)) return;

    await connectDB();

    try {
        // Step 1: Undo — remove status from bill-level if it was incorrectly set to 'not returned'
        const undoResult = await BillEntryModel.collection.updateMany(
            { status: 'not returned' },
            { $set: { status: 'Pending' } }
        );

        // Step 2: Add status to materialList items that are missing it (without touching anything else)
        const migrateResult = await BillEntryModel.collection.updateMany(
            { 'materialList.status': { $exists: false } },
            { $set: { 'materialList.$[elem].status': 'not returned' } },
            { arrayFilters: [{ 'elem.status': { $exists: false } }] }
        );

        res.status(200).json({
            success: true,
            billsFixed: undoResult.modifiedCount,
            materialsUpdated: migrateResult.modifiedCount,
            message: `Undid ${undoResult.modifiedCount} incorrect bill status(es). Added material status to ${migrateResult.modifiedCount} bill(s).`,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
