import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Party || mongoose.model('Party', partySchema);
