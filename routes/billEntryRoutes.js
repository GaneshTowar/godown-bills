const express = require('express');
const router = express.Router();
const BillEntry = require('../models/BillEntry');

router.post('/submit-bill', async (req, res) => {
    try {
        const { customerName, billAmount, billDate, description } = req.body;

        const newBill = new BillEntry({
            customerName,
            billAmount,
            billDate,
            description
        });

        await newBill.save();
        res.status(201).json({ message: 'Bill entry saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save bill entry.' });
    }
});

module.exports = router;
