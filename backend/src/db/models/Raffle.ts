import mongoose, { Schema, Document } from 'mongoose';

export interface IRaffle extends Document {
  title: string;
  description: string;
  status: 'open' | 'waiting' | 'closed';
  endDate: Date;
  totalNumbers: number;
  price: number;
  expirationMinutes: number;
  pixName: string;
  pixKey: string;
  pixQRCode?: string;
  winnerNumber?: number;
  winningReceiptId?: string;
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
    totalNumbers: {
      type: Number,
      required: true,
      min: 100,
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
    expirationMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
    winnerNumber: {
      type: Number,
      min: 1,
      max: 100,
    },
    winningReceiptId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Raffle = mongoose.model<IRaffle>('Raffle', RaffleSchema);
