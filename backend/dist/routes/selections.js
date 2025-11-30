import { Elysia, t } from 'elysia';
import { Selection } from '../db/models/Selection';
import { Raffle } from '../db/models/Raffle';
import { hasRaffleEnded } from '../utils/datetime';
import { eventBus } from '../utils/events';
export const selectionRoutes = new Elysia({ prefix: '/api/selections' })
    .get('/receipt/:receiptId', async ({ params: { receiptId }, set }) => {
    const selections = await Selection.find({ receiptId })
        .populate('raffleId', 'title description endDate')
        .sort({ number: 1 });
    if (!selections || selections.length === 0) {
        set.status = 404;
        return { error: 'Receipt not found' };
    }
    return selections;
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
        // Check if raffle is active
        if (raffle.status !== 'active') {
            set.status = 400;
            return { error: 'Raffle is not active' };
        }
        // Check if raffle has ended
        if (hasRaffleEnded(raffle.endDate)) {
            set.status = 400;
            return { error: 'Raffle has ended' };
        }
        // Validate page number
        if (body.pageNumber < 1 || body.pageNumber > raffle.pages) {
            set.status = 400;
            return { error: 'Invalid page number' };
        }
        // Check if number is already taken
        const existing = await Selection.findOne({
            raffleId,
            number: body.number,
            pageNumber: body.pageNumber,
        });
        if (existing) {
            set.status = 409;
            return { error: 'Number already selected' };
        }
        // Create selection
        const selection = new Selection({
            raffleId,
            receiptId: body.receiptId,
            number: body.number,
            pageNumber: body.pageNumber,
            user: body.user,
        });
        await selection.save();
        // Broadcast selection
        eventBus.emit('selection:created', {
            raffleId,
            number: body.number,
            pageNumber: body.pageNumber,
        });
        set.status = 201;
        return selection;
    }
    catch (error) {
        set.status = 400;
        return { error: error.message };
    }
}, {
    body: t.Object({
        receiptId: t.String(),
        number: t.Number({ minimum: 1, maximum: 100 }),
        pageNumber: t.Number({ minimum: 1 }),
        user: t.Object({
            xHandle: t.String(),
            instagramHandle: t.String(),
            whatsapp: t.String(),
            preferredContact: t.Union([
                t.Literal('x'),
                t.Literal('instagram'),
                t.Literal('whatsapp')
            ]),
        }),
    }),
});
//# sourceMappingURL=selections.js.map