import { Elysia, t } from 'elysia';
import { Selection } from '../db/models/Selection';
import crypto from 'crypto';
import { Raffle } from '../db/models/Raffle';
import { Receipt } from '../db/models/Receipt';
import { hasRaffleEnded } from '../utils/datetime';
import { eventBus } from '../utils/events';
import generateReceiptId from '../utils/generateReceiptId';
export const selectionRoutes = new Elysia({ prefix: '/api/selections' })
    .get('/receipt/:receiptId', async ({ params: { receiptId }, set }) => {
    console.log(`Fetching receipt: ${receiptId}`);
    const selections = await Selection.find({ receiptId })
        .populate('raffleId', 'title description endDate')
        .sort({ number: 1 });
    console.log(`Found ${selections?.length} selections for receipt ${receiptId}`);
    if (!selections || selections.length === 0) {
        console.log('Receipt not found');
        set.status = 404;
        return { error: 'Receipt not found' };
    }
    return selections;
})
    .get('/test-db', async ({ set }) => {
    try {
        const testId = 'test-' + Date.now();
        // Find any open raffle
        const raffle = await Raffle.findOne({ status: 'open' });
        if (!raffle)
            return { error: 'No open raffle found for test' };
        const selection = new Selection({
            raffleId: raffle._id,
            receiptId: testId,
            number: 1,
            pageNumber: 9999,
            user: { xHandle: 'test', instagramHandle: 'test', whatsapp: '000', preferredContact: 'x' }
        });
        await selection.save();
        console.log('Test selection saved');
        const found = await Selection.find({ receiptId: testId });
        console.log('Test selection found:', found.length);
        await Selection.deleteOne({ receiptId: testId });
        return {
            success: true,
            saved: true,
            found: found.length > 0,
            receiptId: testId
        };
    }
    catch (err) {
        return { error: err.message };
    }
})
    .get('/:raffleId', async ({ params: { raffleId }, set }) => {
    const selections = await Selection.find({ raffleId })
        .sort({ pageNumber: 1, number: 1 });
    return selections;
})
    .post('/:raffleId', async ({ params: { raffleId }, body, set }) => {
    try {
        // Check if raffle exists
        const raffle = await Raffle.findById(raffleId);
        if (!raffle) {
            set.status = 404;
            return { error: 'Raffle not found' };
        }
        // Check if raffle is open
        if (raffle.status !== 'open') {
            set.status = 400;
            return { error: 'Raffle is not open' };
        }
        // Check if raffle has ended
        if (hasRaffleEnded(raffle.endDate)) {
            set.status = 400;
            return { error: 'Raffle has ended' };
        }
        // Validate all numbers
        for (const item of body.numbers) {
            if (item.pageNumber < 1 || item.pageNumber > raffle.pages) {
                set.status = 400;
                return { error: `Invalid page number: ${item.pageNumber}` };
            }
            // Check if number is already taken
            const existing = await Selection.findOne({
                raffleId,
                number: item.number,
                pageNumber: item.pageNumber,
            });
            if (existing) {
                set.status = 409;
                return { error: `Number ${item.number} on page ${item.pageNumber} is already selected` };
            }
        }
        // Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + raffle.expirationHours);
        // Calculate total amount
        const totalAmount = body.numbers.length * raffle.price;
        // Create receipt
        // Ensure we have a secure generated ID if not provided
        let receiptId = body.receiptId;
        if (!receiptId) {
            let unique = false;
            // Try up to 3 times to avoid collisions (extremely unlikely)
            for (let i = 0; i < 3 && !unique; i++) {
                const candidate = generateReceiptId();
                const exists = await Receipt.findOne({ receiptId: candidate });
                if (!exists) {
                    receiptId = candidate;
                    unique = true;
                    break;
                }
            }
            // Fallback to uuid if randomness collides (very unlikely)
            if (!unique && !receiptId) {
                receiptId = crypto.randomUUID();
            }
        }
        const receipt = new Receipt({
            receiptId,
            raffleId,
            status: 'created',
            numbers: body.numbers,
            user: body.user,
            totalAmount,
            expiresAt,
            statusHistory: [{
                    status: 'created',
                    changedAt: new Date(),
                }],
        });
        await receipt.save();
        // Create selections
        const selections = body.numbers.map((item) => ({
            raffleId,
            receiptId,
            number: item.number,
            pageNumber: item.pageNumber,
            user: body.user,
        }));
        await Selection.insertMany(selections);
        // Broadcast selections
        for (const item of body.numbers) {
            eventBus.emit('selection:created', {
                raffleId,
                number: item.number,
                pageNumber: item.pageNumber,
            });
        }
        return { success: true, receiptId: body.receiptId };
        return { success: true, receiptId };
    }
    catch (err) {
        console.error('Error creating selections:', {
            raffleId,
            body,
            error: err?.message || err,
        });
        set.status = 500;
        return { error: err.message || 'Failed to create selections' };
    }
}, {
    body: t.Object({
        receiptId: t.Optional(t.String()),
        numbers: t.Array(t.Object({
            number: t.Number(),
            pageNumber: t.Number(),
        })),
        user: t.Object({
            xHandle: t.String(),
            instagramHandle: t.String(),
            whatsapp: t.String(),
            preferredContact: t.Union([
                t.Literal('x'),
                t.Literal('instagram'),
                t.Literal('whatsapp'),
            ]),
        }),
    }),
});
//# sourceMappingURL=selections.js.map