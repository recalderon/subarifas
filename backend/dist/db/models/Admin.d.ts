import mongoose, { Document } from 'mongoose';
export interface IAdmin extends Document {
    username: string;
    passwordHash: string;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const Admin: mongoose.Model<IAdmin, {}, {}, {}, mongoose.Document<unknown, {}, IAdmin, {}, {}> & IAdmin & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Admin.d.ts.map