import mongoose from 'mongoose';
import { Selection } from '../db/models/Selection';
import { Raffle } from '../db/models/Raffle';
import { connectDB } from '../db/connection';

const testReceipt = async () => {
  await connectDB();

  try {
    // Create a dummy raffle
    const raffle = new Raffle({
      title: 'Test Raffle',
      description: 'Test Description',
      endDate: new Date(),
      pages: 1,
      status: 'active'
    });
    await raffle.save();
    console.log('Raffle created:', raffle._id);

    const receiptId = crypto.randomUUID();
    console.log('Testing with receiptId:', receiptId);

    // Create selection
    const selection = new Selection({
      raffleId: raffle._id,
      receiptId: receiptId,
      number: 1,
      pageNumber: 1,
      user: {
        xHandle: 'test',
        instagramHandle: 'test',
        whatsapp: '123',
        preferredContact: 'x'
      }
    });
    await selection.save();
    console.log('Selection saved');

    // Try to find it
    const found = await Selection.find({ receiptId });
    console.log('Found selections:', found.length);

    if (found.length > 0) {
      console.log('SUCCESS: Receipt found');
    } else {
      console.log('FAILURE: Receipt not found');
    }

    // Cleanup
    await Selection.deleteMany({ raffleId: raffle._id });
    await Raffle.findByIdAndDelete(raffle._id);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testReceipt();
