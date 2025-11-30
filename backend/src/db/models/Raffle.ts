import mongoose, { Schema, Document } from 'mongoose';

export interface IRaffle extends Document {
  title: string;
  description: string;
  status: 'open' | 'waiting' | 'closed';
  endDate: Date;
  pages: number;
  price: number;
  expirationHours: number;
  pixName: string;
  pixKey: string;
  pixQRCode?: string;
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
    pixName: {
      type: String,
      required: true,
      trim: true,
    },
    pixKey: {
      type: String,
      required: true,
      trim: true,
    },
    pixQRCode: {
      type: String,
      required: false,
      trim: true,
    },
    expirationHours: {
      type: Number,
      required: true,
      min: 1,
      default: 24,
    },
    winnerNumber: {
      type: Number,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export const Raffle = mongoose.model<IRaffle>('Raffle', RaffleSchema);
