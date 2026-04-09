import mongoose from 'mongoose';

const partyUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PartyUser || mongoose.model('PartyUser', partyUserSchema);
