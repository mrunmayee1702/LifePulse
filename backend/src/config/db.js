const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifepulse';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log(`[LifePulse MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[LifePulse MongoDB Error]: Database connection failed (${error.message}).`);
    throw error;
  }
};

module.exports = connectDB;
