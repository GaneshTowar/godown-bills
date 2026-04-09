import express from 'express';
import BillEntry from '../models/BillEntry.js';

const router = express.Router();

router.post('/submit-bill', async (req, res) => {
    try {
        const { billNumber, billDate, partyName, materialList, personName, TakerEmployee, status } = req.body;

        const totalAmount = materialList.reduce((sum, item) => sum + (item.amount || 0), 0);

        const newBill = new BillEntry({
            billNumber,
            billDate,
            partyName,
            materialList,
            personName,
            TakerEmployee,
            status,
            totalAmount,
        });

        await newBill.save();
        res.status(201).json({ message: 'Bill entry saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save bill entry.' });
    }
});

router.get('/all-bills', async (req, res) => {
    try {
        const bills = await BillEntry.find().sort({ billDate: -1 });
        res.status(200).json(bills);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve bills.' });
    }
});

export default router;
