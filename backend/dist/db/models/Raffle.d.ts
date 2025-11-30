import mongoose, { Document } from 'mongoose';
export interface IRaffle extends Document {
    title: string;
    description: string;
    status: 'active' | 'ended';
    endDate: Date;
    pages: number;
    price: number;
    winnerNumber?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Raffle: mongoose.Model<IRaffle, {}, {}, {}, mongoose.Document<unknown, {}, IRaffle, {}, {}> & IRaffle & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Raffle.d.ts.map