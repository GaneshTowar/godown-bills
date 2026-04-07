import mongoose from 'mongoose';

const billEntrySchema = new mongoose.Schema({
    billNumber: { type: String },
    billDate: { type: Date },
    partyName: { type: String, required: true },
    materialList: [
        {
            material: String,
            qty: Number,
            rate: Number,
            amount: Number,
        }
    ],
    personName: { type: String },
    totalAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.BillEntry || mongoose.model('BillEntry', billEntrySchema);
