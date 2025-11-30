import mongoose, { Schema, Document } from 'mongoose';

export interface IRaffle extends Document {
  title: string;
  description: string;
  status: 'open' | 'waiting' | 'closed';
  endDate: Date;
  pages: number;
  price: number;
  winnerNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const RaffleSchema = new Schema<IRaffle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'waiting', 'closed'],
      default: 'open',
    },
    winnerNumber: {
      type: Number,
      min: 1,
      max: 100,
    },
    endDate: {
      type: Date,
      required: true,
    },
    pages: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Raffle = mongoose.model<IRaffle>('Raffle', RaffleSchema);
