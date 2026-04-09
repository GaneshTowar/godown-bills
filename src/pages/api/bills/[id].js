import { connectDB } from '../../../utils/db';
import BillEntryModel from '../../../../models/BillEntry';
import { sendTelegramNotification } from '../../../utils/telegram';
import { requireAdmin } from '../../../utils/auth';

export default async function handler(req, res) {
    if (!requireAdmin(req, res)) return;

    await connectDB();

    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const { billNumber, billDate, partyName, materialList, personName, TakerEmployee, status, paidAmount, notify } = req.body;

            const totalAmount = materialList.reduce((sum, item) => sum + (item.amount || 0), 0);

            const normalizedMaterialList = materialList.map(item => ({
                ...item,
                returnDate: item.returnDate || null,
                amount: Number(item.amount) || 0,
                status: item.status || 'not returned',
            }));

            // Derive bill status from material states to keep the two in sync.
            // 'Cancelled' is the only state that can be set manually regardless of items.
            const allReturned = normalizedMaterialList.every(i => i.status === 'returned');
            let finalStatus;
            if (status === 'Cancelled') {
                finalStatus = 'Cancelled';
            } else if (allReturned) {
                finalStatus = 'Completed';
            } else {
                finalStatus = 'Pending';
            }

            // Fetch prior state so we can detect completion transitions for Telegram.
            const prior = await BillEntryModel.findById(id).select('status');
            if (!prior) {
                return res.status(404).json({ success: false, error: 'Bill not found.' });
            }

            const updated = await BillEntryModel.findByIdAndUpdate(
                id,
                {
                    billNumber,
                    billDate,
                    partyName,
                    materialList: normalizedMaterialList,
                    personName,
                    TakerEmployee,
                    status: finalStatus,
                    totalAmount,
                    paidAmount: paidAmount || 0,
                },
                { new: true }
            );

            // Notify only on completion transitions or when the client explicitly opts in
            // (e.g. the full edit modal). Inline updates (paid amount, per-item status)
            // no longer spam the channel unless they complete the bill.
            const becameCompleted = finalStatus === 'Completed' && prior.status !== 'Completed';
            if (becameCompleted || notify === true) {
                const pending = totalAmount - (paidAmount || 0);
                const emoji = finalStatus === 'Completed' ? '✅' : finalStatus === 'Cancelled' ? '❌' : '✏️';
                const label = finalStatus === 'Completed' ? 'Bill Completed' : finalStatus === 'Cancelled' ? 'Bill Cancelled' : 'Bill Updated';

                await sendTelegramNotification(
                    `${emoji} <b>${label}</b>\n\n` +
                    `Bill No: <b>#${billNumber}</b>\n` +
                    `Party: <b>${partyName}</b>\n` +
                    `Status: <b>${finalStatus}</b>\n` +
                    (becameCompleted ? `Materials: All Returned ✔\n` : '') +
                    `\n💰 Total: ₹${totalAmount}\n` +
                    `Paid: ₹${paidAmount || 0} | Pending: ₹${pending > 0 ? pending : 0}`
                );
            }

            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('PUT /api/bills/[id] error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
