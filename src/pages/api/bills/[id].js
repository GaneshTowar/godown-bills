import { connectDB } from '../../../utils/db';
import BillEntryModel from '../../../../models/BillEntry';
import { sendTelegramNotification } from '../../../utils/telegram';

export default async function handler(req, res) {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const { billNumber, billDate, partyName, materialList, personName, TakerEmployee, status, paidAmount } = req.body;

            const totalAmount = materialList.reduce((sum, item) => sum + (item.amount || 0), 0);

            const normalizedMaterialList = materialList.map(item => ({
                ...item,
                returnDate: item.returnDate || null,
                amount: Number(item.amount) || 0,
            }));

            const updated = await BillEntryModel.findByIdAndUpdate(
                id,
                { billNumber, billDate, partyName, materialList: normalizedMaterialList, personName, TakerEmployee, status, totalAmount, paidAmount: paidAmount || 0 },
                { new: true }
            );

            if (!updated) {
                return res.status(404).json({ success: false, error: 'Bill not found.' });
            }

            const pending = totalAmount - (paidAmount || 0);
            const allReturned = materialList.every(i => (i.status || 'not returned') === 'returned');
            const emoji = status === 'Completed' ? '✅' : '✏️';
            const label = status === 'Completed' ? 'Bill Completed' : 'Bill Updated';

            await sendTelegramNotification(
                `${emoji} <b>${label}</b>\n\n` +
                `Bill No: <b>#${billNumber}</b>\n` +
                `Party: <b>${partyName}</b>\n` +
                `Status: <b>${status}</b>\n` +
                (allReturned ? `Materials: All Returned ✔\n` : '') +
                `\n💰 Total: ₹${totalAmount}\n` +
                `Paid: ₹${paidAmount || 0} | Pending: ₹${pending > 0 ? pending : 0}`
            );

            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('PUT /api/bills/[id] error:', error);
            res.status(400).json({ success: false, error: error.message, stack: error.stack });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
