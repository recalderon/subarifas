import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subaruffles';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Connection pooling for Atlas free tier
      maxPoolSize: 10, // Max 10 connections (Atlas free tier friendly)
      minPoolSize: 2,  // Keep 2 connections alive
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      serverSelectionTimeoutMS: 10000, // Timeout after 10s trying to connect
      family: 4, // Use IPv4, skip trying IPv6
      // Compression to save bandwidth
      compressors: ['zlib'],
      zlibCompressionLevel: 6, // Medium compression (balance speed/size)
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Pool size: ${mongoose.connection.getClient().options.maxPoolSize}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});
