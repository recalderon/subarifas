import mongoose, { Schema } from 'mongoose';
const StatusChangeSchema = new Schema({
    status: {
        type: String,
        enum: ['waiting_payment', 'receipt_uploaded', 'paid', 'expired'],
        required: true,
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: String,
    },
    note: {
        type: String,
    },
}, { _id: false });
const ReceiptSchema = new Schema({
    receiptId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    raffleId: {
        type: Schema.Types.ObjectId,
        ref: 'Raffle',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['waiting_payment', 'receipt_uploaded', 'paid', 'expired'],
        default: 'waiting_payment',
        index: true,
    },
    numbers: [{
            number: {
                type: Number,
                required: true,
                min: 1,
                max: 100,
            },
            pageNumber: {
                type: Number,
                required: true,
                min: 1,
            },
        }],
    user: {
        xHandle: {
            type: String,
            required: true,
            trim: true,
        },
        instagramHandle: {
            type: String,
            required: true,
            trim: true,
        },
        whatsapp: {
            type: String,
            required: true,
            trim: true,
        },
        preferredContact: {
            type: String,
            required: true,
            enum: ['x', 'instagram', 'whatsapp'],
        },
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    paidAt: {
        type: Date,
    },
    statusHistory: [StatusChangeSchema],
}, {
    timestamps: false,
});
// Index for finding expired receipts
ReceiptSchema.index({ status: 1, expiresAt: 1 });
export const Receipt = mongoose.model('Receipt', ReceiptSchema);
//# sourceMappingURL=Receipt.js.map