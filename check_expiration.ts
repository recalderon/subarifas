
import mongoose from 'mongoose';
import { Raffle } from './backend/src/db/models/Raffle';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subarifas');
    const raffles = await Raffle.find({});
    console.log('Raffles found:', raffles.length);
    raffles.forEach(r => {
      console.log(`Raffle: ${r.title}, Expiration: ${r.expirationHours} hours`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
