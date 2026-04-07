const express = require('express');
const mongoose = require('mongoose');
const billEntryRoutes = require('./routes/billEntryRoutes');
// ...existing code...

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/yourDatabaseName', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/bill-entry', billEntryRoutes);

// ...existing code...
app.listen(3000, () => console.log('Server running on port 3000'));
