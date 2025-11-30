import mongoose, { Schema, Document } from 'mongoose';

export interface IRaffle extends Document {
  title: string;
  description: string;
  status: 'active' | 'ended';
  endDate: Date;
  pages: number;
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
      enum: ['active', 'ended'],
      default: 'active',
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
  },
  {
    timestamps: true,
  }
);

export const Raffle = mongoose.model<IRaffle>('Raffle', RaffleSchema);
