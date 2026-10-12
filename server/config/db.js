const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
    // Check if a local MongoDB is actually reachable before trying
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB Connection Error: ${error.message}`);
    console.warn('MongoDB is unavailable. Admin login will be disabled.');
    console.warn('KCode and ECode login via Google Sheets are fully operational.');
    return null;
  }
};

module.exports = connectDB;

