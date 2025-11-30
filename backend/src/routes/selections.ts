import { Elysia, t } from 'elysia';
import { Selection } from '../db/models/Selection';
import { Raffle } from '../db/models/Raffle';
import { hasRaffleEnded } from '../utils/datetime';
import { eventBus } from '../utils/events';

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
      if (!raffle) return { error: 'No open raffle found for test' };

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
    } catch (err: any) {
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
      console.log(`Creating selection for raffle ${raffleId}, receipt ${body.receiptId}, number ${body.number}`);
      const selection = new Selection({
        raffleId,
        receiptId: body.receiptId,
        number: body.number,
        pageNumber: body.pageNumber,
        user: body.user,
      });

      await selection.save();
      console.log(`Selection saved: ${selection._id}`);

      // Broadcast selection
      eventBus.emit('selection:created', {
        raffleId,
        number: body.number,
        pageNumber: body.pageNumber,
      });

      set.status = 201;

      return selection;
    } catch (error: any) {
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
