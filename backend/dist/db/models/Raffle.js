import mongoose, { Schema } from 'mongoose';
const RaffleSchema = new Schema({
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
}, {
    timestamps: true,
});
export const Raffle = mongoose.model('Raffle', RaffleSchema);
//# sourceMappingURL=Raffle.js.map