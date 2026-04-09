import mongoose from 'mongoose';

const billEntrySchema = new mongoose.Schema({
    billNumber: { type: Number, unique: true, sparse: true },
    billDate: { type: Date },
    partyName: { type: String, required: true },
    materialList: [
        {
            material: String,
            qty: Number,
            rate: Number,
            amount: Number,
            returnDate: Date,
            remark: String,
            status: { type: String, default: 'not returned', enum: ['not returned', 'partial return', 'returned'] },
        }
    ],
    personName: { type: String },
    TakerEmployee: { type: String },
    status: { type: String, default: 'Pending' },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.BillEntry || mongoose.model('BillEntry', billEntrySchema);
