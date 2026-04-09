import { connectDB } from '../../../utils/db';
import BillEntryModel from '../../../../models/BillEntry';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        try {
            const { billNumber, billDate, partyName, materialList, personName, TakerEmployee, status, paidAmount } = req.body;

            const grandTotal = materialList.reduce((sum, item) => sum + (item.amount || 0), 0);

            const normalizedMaterialList = materialList.map(item => ({
                ...item,
                status: 'not returned',
            }));

            const billEntry = await BillEntryModel.create({
                billNumber,
                billDate,
                partyName,
                materialList: normalizedMaterialList,
                personName,
                TakerEmployee,
                status,
                totalAmount: grandTotal,
                paidAmount: paidAmount || 0,
                createdAt: new Date(),
            });

            res.status(201).json({ success: true, data: billEntry });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ success: false, error: `Bill number "${req.body.billNumber}" already exists. Please use a unique bill number.` });
            }
            res.status(400).json({ success: false, error: error.message });
        }
    } else if (req.method === 'GET') {
        try {
            if (req.query.all === 'true') {
                const bills = await BillEntryModel.find({}).sort({ createdAt: -1 });
                return res.status(200).json({ success: true, data: bills });
            }

            if (req.query.latest === 'true') {
                const latest = await BillEntryModel.findOne({}).sort({ billNumber: -1 }).select('billNumber');
                const nextNumber = latest ? Number(latest.billNumber) + 1 : 1;
                return res.status(200).json({ success: true, nextBillNumber: nextNumber });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const filter = {};
            if (req.query.search) {
                const regex = new RegExp(req.query.search, 'i');
                filter.$or = [{ partyName: regex }, { billNumber: regex }];
            }

            const [bills, total] = await Promise.all([
                BillEntryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                BillEntryModel.countDocuments(filter),
            ]);

            res.status(200).json({
                success: true,
                data: bills,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
