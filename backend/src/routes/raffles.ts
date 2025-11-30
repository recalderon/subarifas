import { Elysia, t } from 'elysia';
import { Raffle } from '../db/models/Raffle';
import { Selection } from '../db/models/Selection';
import { authMiddleware } from '../middleware/auth';
import { hasRaffleEnded } from '../utils/datetime';

export const raffleRoutes = new Elysia({ prefix: '/api/raffles' })
  // Public routes
  .get('/', async () => {
    const raffles = await Raffle.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'selections',
          let: { raffleId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$raffleId', '$$raffleId'] } } },
            { $count: 'count' }
          ],
          as: 'selectionStats'
        }
      },
      {
        $addFields: {
          takenCount: { $ifNull: [{ $arrayElemAt: ['$selectionStats.count', 0] }, 0] }
        }
      },
      {
        $project: {
          selectionStats: 0
        }
      }
    ]);
    
    return raffles.map(r => {
      const totalNumbers = r.pages * 100;
      // Ensure _id is transformed to string if needed, or keep as is depending on frontend expectation.
      // Mongoose documents usually have .id getter, but aggregation returns plain objects.
      // We might need to cast _id to string if the frontend expects it, but usually standard JSON serialization handles it.
      
      return {
        ...r,
        stats: {
          total: totalNumbers,
          available: totalNumbers - r.takenCount,
          taken: r.takenCount
        }
      };
    });
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
      
      .post('/', async ({ body, set, request }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }
          // Coerce numeric fields coming as strings
          if (body.pages && typeof body.pages === 'string') {
            body.pages = Number(body.pages);
          }
          if (body.pages && (!Number.isInteger(body.pages) || body.pages < 1)) {
            set.status = 400;
            return { error: 'pages must be an integer >= 1' };
          }
          if (body.price && typeof body.price === 'string') {
            body.price = Number(body.price);
          }
          if (body.expirationHours && typeof body.expirationHours === 'string') {
            body.expirationHours = Number(body.expirationHours);
          }
          if (body.expirationHours && (!Number.isInteger(body.expirationHours) || body.expirationHours < 1)) {
            set.status = 400;
            return { error: 'expirationHours must be an integer >= 1' };
          }

          const raffle = new Raffle(body);
          await raffle.save();
          set.status = 201;
          return raffle;
        } catch (error: any) {
          console.error('Error creating raffle', {
            request: request?.url,
            body,
            error: error?.message || error,
          });
          set.status = 400;
          return { error: error.message };
        }
      }, {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          endDate: t.String(),
          pages: t.Number(),
          price: t.Number(),
          expirationHours: t.Optional(t.Number()),
        }),
      })

      .put('/:id', async ({ params: { id }, body, set, request }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }
          // Coerce numeric fields coming as strings
          if (body.pages && typeof body.pages === 'string') {
            body.pages = Number(body.pages);
          }
          if (body.pages && (!Number.isInteger(body.pages) || body.pages < 1)) {
            set.status = 400;
            return { error: 'pages must be an integer >= 1' };
          }
          if (body.price && typeof body.price === 'string') {
            body.price = Number(body.price);
          }
          if (body.expirationHours && typeof body.expirationHours === 'string') {
            body.expirationHours = Number(body.expirationHours);
          }
          if (body.expirationHours && (!Number.isInteger(body.expirationHours) || body.expirationHours < 1)) {
            set.status = 400;
            return { error: 'expirationHours must be an integer >= 1' };
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
          console.error('Error updating raffle', {
            request: request?.url,
            params: { id },
            body,
            error: error?.message || error,
          });
          set.status = 400;
          return { error: error.message };
        }
      }, {
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          pages: t.Optional(t.Number()),
          price: t.Optional(t.Number()),
          expirationHours: t.Optional(t.Number()),
          winnerNumber: t.Optional(t.Number()),
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
          status: t.Union([t.Literal('open'), t.Literal('waiting'), t.Literal('closed')]),
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
