import mongoose, { Schema } from 'mongoose';
const SelectionSchema = new Schema({
    raffleId: {
        type: Schema.Types.ObjectId,
        ref: 'Raffle',
        required: true,
    },
    receiptId: {
        type: String,
        required: true,
        index: true,
    },
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
    selectedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});
// Ensure unique number per raffle
SelectionSchema.index({ raffleId: 1, number: 1, pageNumber: 1 }, { unique: true });
// Optimize available numbers query
SelectionSchema.index({ raffleId: 1, pageNumber: 1 });
export const Selection = mongoose.model('Selection', SelectionSchema);
//# sourceMappingURL=Selection.js.map