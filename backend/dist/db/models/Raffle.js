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
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
});
export const Raffle = mongoose.model('Raffle', RaffleSchema);
//# sourceMappingURL=Raffle.js.map