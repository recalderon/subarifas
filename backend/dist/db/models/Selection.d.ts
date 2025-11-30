import mongoose, { Document } from 'mongoose';
export interface ISelection extends Document {
    raffleId: mongoose.Types.ObjectId;
    receiptId: string;
    number: number;
    pageNumber: number;
    user: {
        xHandle: string;
        instagramHandle: string;
        whatsapp: string;
        preferredContact: 'x' | 'instagram' | 'whatsapp';
    };
    selectedAt: Date;
}
export declare const Selection: mongoose.Model<ISelection, {}, {}, {}, mongoose.Document<unknown, {}, ISelection, {}, {}> & ISelection & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Selection.d.ts.map