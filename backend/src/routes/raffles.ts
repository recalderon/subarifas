import { Elysia, t } from 'elysia';
import { Raffle } from '../db/models/Raffle';
import { Selection } from '../db/models/Selection';
import { authMiddleware } from '../middleware/auth';
import { hasRaffleEnded } from '../utils/datetime';

export const raffleRoutes = new Elysia({ prefix: '/api/raffles' })
  // Public routes
  .get('/', async () => {
    const raffles = await Raffle.find().sort({ createdAt: -1 });
    return raffles.map(r => r.toJSON());
  })

  .get('/:id', async ({ params: { id }, set }) => {
    const raffle = await Raffle.findById(id);
    
    if (!raffle) {
      set.status = 404;
      return { error: 'Raffle not found' };
    }

    return raffle.toJSON();
  })

  .get('/:id/available', async ({ params: { id }, query, set }) => {
    const raffle = await Raffle.findById(id);
    
    if (!raffle) {
      set.status = 404;
      return { error: 'Raffle not found' };
    }

    const page = parseInt(query.page as string) || 1;
    
    if (page < 1 || page > raffle.pages) {
      set.status = 400;
      return { error: 'Invalid page number' };
    }

    // Get all selections for this raffle and page
    const selections = await Selection.find({ 
      raffleId: id,
      pageNumber: page 
    }).select('number');

    const takenNumbers = selections.map(s => s.number);
    const availableNumbers = Array.from({ length: 100 }, (_, i) => i + 1)
      .filter(num => !takenNumbers.includes(num));

    return {
      page,
      totalPages: raffle.pages,
      availableNumbers,
      takenNumbers,
    };
  })

  // Protected admin routes
  .group('', (app) =>
    app
      .use(authMiddleware)
      
      .post('/', async ({ body, set }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }

          const raffle = new Raffle(body);
          await raffle.save();
          set.status = 201;
          return raffle;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      }, {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          endDate: t.String(),
          pages: t.Number(),
        }),
      })

      .put('/:id', async ({ params: { id }, body, set }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }

          const raffle = await Raffle.findByIdAndUpdate(id, body, { 
            new: true,
            runValidators: true 
          });
          
          if (!raffle) {
            set.status = 404;
            return { error: 'Raffle not found' };
          }

          return raffle;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      }, {
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          pages: t.Optional(t.Number()),
        }),
      })

      .patch('/:id/status', async ({ params: { id }, body, set }) => {
        const raffle = await Raffle.findById(id);
        
        if (!raffle) {
          set.status = 404;
          return { error: 'Raffle not found' };
        }

        raffle.status = body.status;
        await raffle.save();

        return raffle;
      }, {
        body: t.Object({
          status: t.Union([t.Literal('active'), t.Literal('ended')]),
        }),
      })

      .delete('/:id', async ({ params: { id }, set }) => {
        const raffle = await Raffle.findByIdAndDelete(id);
        
        if (!raffle) {
          set.status = 404;
          return { error: 'Raffle not found' };
        }

        // Also delete all selections for this raffle
        await Selection.deleteMany({ raffleId: id });

        return { message: 'Raffle deleted successfully' };
      })
  );
