import { connectDB } from '../../utils/db';
import BillEntryModel from '../../../models/BillEntry';

const parties = [
    'Sharma Events', 'Patel Decorators', 'Singh Tent House', 'Mehta Caterers',
    'Gupta Sound Systems', 'Kumar Lighting', 'Joshi Wedding Planners', 'Rao Rentals',
    'Verma Celebrations', 'Chopra Events',
];

const employees = ['Ravi Kumar', 'Suresh Patel', 'Amit Singh', 'Vijay Sharma', 'Deepak Gupta'];

const receivers = ['Anita Sharma', 'Priya Patel', 'Sunita Singh', 'Kavita Mehta', 'Pooja Gupta'];

const materials = [
    { material: 'Plastic Chairs', rate: 15 },
    { material: 'Folding Tables', rate: 80 },
    { material: 'Shamiana', rate: 500 },
    { material: 'Generator (5KVA)', rate: 1200 },
    { material: 'Sound System', rate: 2500 },
    { material: 'LED Lights String', rate: 120 },
    { material: 'Stage Setup', rate: 5000 },
    { material: 'Cotton Durrie', rate: 40 },
    { material: 'Steel Utensils Set', rate: 200 },
    { material: 'Cooler', rate: 350 },
    { material: 'Tent (20x30)', rate: 1800 },
    { material: 'Projector', rate: 1500 },
];

const materialStatuses = ['not returned', 'partial return', 'returned'];
const billStatuses = ['Pending', 'Completed', 'Cancelled'];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack) {
    const d = new Date();
    d.setDate(d.getDate() - randomInt(0, daysBack));
    return d;
}

function generateMaterialList() {
    const count = randomInt(2, 5);
    const picked = [...materials].sort(() => 0.5 - Math.random()).slice(0, count);
    return picked.map(m => {
        const qty = randomInt(5, 100);
        const amount = qty * m.rate;
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + randomInt(1, 10));
        return {
            material: m.material,
            qty,
            rate: m.rate,
            amount,
            returnDate,
            remark: Math.random() > 0.5 ? 'Good condition' : '',
            status: randomFrom(materialStatuses),
        };
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    await connectDB();

    // Clean up previous seed data — match both number and string stored values
    const seedRange = Array.from({ length: 99 }, (_, i) => 1001 + i);
    await BillEntryModel.deleteMany({
        $or: [
            { billNumber: { $gte: 1001, $lte: 1099 } },
            { billNumber: { $in: seedRange.map(String) } },
        ],
    });

    // Now rebuild the unique index cleanly
    await BillEntryModel.collection.dropIndexes().catch(() => {});
    await BillEntryModel.collection.createIndex({ billNumber: 1 }, { unique: true, sparse: true });

    const startFrom = 1001;

    // Generate 20 fake bills with serial 4-digit bill numbers
    const fakeBills = Array.from({ length: 20 }, (_, i) => {
        const billNumber = startFrom + i;
        const materialList = generateMaterialList();
        const totalAmount = materialList.reduce((sum, item) => sum + item.amount, 0);
        const paidAmount = randomInt(0, totalAmount);
        const billDate = randomDate(90);

        return {
            billNumber,
            billDate,
            partyName: randomFrom(parties),
            materialList,
            personName: randomFrom(receivers),
            TakerEmployee: randomFrom(employees),
            status: randomFrom(billStatuses),
            totalAmount,
            paidAmount,
            createdAt: billDate,
        };
    });

    await BillEntryModel.insertMany(fakeBills);

    // --- Duplicate check test ---
    // Try inserting a bill with the same number as the first one we just inserted
    let duplicateTest = { attempted: fakeBills[0].billNumber, result: null };
    try {
        await BillEntryModel.create({
            billNumber: fakeBills[0].billNumber,
            billDate: new Date(),
            partyName: 'Duplicate Test Party',
            materialList: [{ material: 'Test Item', qty: 1, rate: 100, amount: 100, status: 'not returned' }],
            totalAmount: 100,
            paidAmount: 0,
            status: 'Pending',
        });
        duplicateTest.result = '❌ FAILED — duplicate was accepted (index may be missing)';
    } catch (err) {
        if (err.code === 11000) {
            duplicateTest.result = '✅ PASSED — duplicate bill number was correctly rejected';
        } else {
            duplicateTest.result = `⚠️ Unexpected error: ${err.message}`;
        }
    }

    res.status(201).json({
        success: true,
        message: `20 bills inserted: #${startFrom} to #${startFrom + 19}`,
        duplicateTest,
    });
}
