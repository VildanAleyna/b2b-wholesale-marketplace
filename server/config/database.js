const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connection successful.');
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    }
};

module.exports = { connectDB };
