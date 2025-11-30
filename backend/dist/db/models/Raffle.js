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
}, {
    timestamps: true,
});
export const Raffle = mongoose.model('Raffle', RaffleSchema);
//# sourceMappingURL=Raffle.js.map