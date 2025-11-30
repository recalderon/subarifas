import mongoose, { Document } from 'mongoose';
export interface IStatusChange {
    status: 'waiting_payment' | 'receipt_uploaded' | 'paid' | 'expired';
    changedAt: Date;
    changedBy?: string;
    note?: string;
}
export interface IReceipt extends Document {
    receiptId: string;
    raffleId: mongoose.Types.ObjectId;
    status: 'waiting_payment' | 'receipt_uploaded' | 'paid' | 'expired';
    numbers: Array<{
        number: number;
        pageNumber: number;
    }>;
    user: {
        xHandle: string;
        instagramHandle: string;
        whatsapp: string;
        preferredContact: 'x' | 'instagram' | 'whatsapp';
    };
    totalAmount: number;
    createdAt: Date;
    expiresAt: Date;
    paidAt?: Date;
    statusHistory: IStatusChange[];
}
export declare const Receipt: mongoose.Model<IReceipt, {}, {}, {}, mongoose.Document<unknown, {}, IReceipt, {}, {}> & IReceipt & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Receipt.d.ts.map