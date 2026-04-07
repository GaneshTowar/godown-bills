import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const createDocument = async (model, data) => {
    const document = new model(data);
    return await document.save();
};

const readDocuments = async (model, query = {}) => {
    return await model.find(query);
};

const updateDocument = async (model, id, data) => {
    return await model.findByIdAndUpdate(id, data, { new: true });
};

const deleteDocument = async (model, id) => {
    return await model.findByIdAndDelete(id);
};

export { connectDB, createDocument, readDocuments, updateDocument, deleteDocument };