import connectDB from '../../lib/mongodb';
import BillEntryModel from '../../../models/BillEntry';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        try {
            const { billNumber, billDate, partyName, materialList, personName } = req.body;

            const grandTotal = materialList.reduce((sum, item) => sum + (item.amount || 0), 0);

            const billEntry = await BillEntryModel.create({
                billNumber,
                billDate,
                partyName,
                materialList,
                personName,
                totalAmount: grandTotal,
                createdAt: new Date(),
            });

            res.status(201).json({ success: true, data: billEntry });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else if (req.method === 'GET') {
        try {
            const bills = await BillEntryModel.find({});
            res.status(200).json({ success: true, data: bills });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
