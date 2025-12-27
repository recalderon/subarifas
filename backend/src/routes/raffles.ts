import { Elysia, t } from 'elysia';
import { Raffle } from '../db/models/Raffle';
import { Selection } from '../db/models/Selection';
import { Receipt } from '../db/models/Receipt';
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
      const totalNumbers = r.totalNumbers || 100;
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

  .get('/:id/winner', async ({ params: { id }, set }) => {
    const raffle = await Raffle.findById(id);
    
    if (!raffle) {
      set.status = 404;
      return { error: 'Raffle not found' };
    }

    if (!raffle.winningReceiptId) {
      set.status = 404;
      return { error: 'No winner selected for this raffle' };
    }

    // Get the winning receipt
    const receipt = await Receipt.findOne({ receiptId: raffle.winningReceiptId });
    
    if (!receipt) {
      set.status = 404;
      return { error: 'Winning receipt not found' };
    }

    // Extract numbers from receipt (already stored there)
    const numbers = receipt.numbers.map(n => n.number).sort((a, b) => a - b);

    // Return redacted winner info (hide sensitive data)
    return {
      receiptId: receipt.receiptId,
      numbers: numbers,
      // Don't expose full contact info to public
      user: {
        xHandle: receipt.user.xHandle ? '***' : undefined,
        instagramHandle: receipt.user.instagramHandle ? '***' : undefined,
        whatsapp: receipt.user.whatsapp ? '***' : undefined,
      },
      totalAmount: receipt.totalAmount,
      paidAt: receipt.paidAt,
    };
  })

  .get('/:id/available', async ({ params: { id }, query, set }) => {
    const raffle = await Raffle.findById(id);
    
    if (!raffle) {
      set.status = 404;
      return { error: 'Raffle not found' };
    }

    const page = parseInt(query.page as string) || 1;
    const totalPages = Math.ceil(raffle.totalNumbers / 100);
    
    if (page < 1 || page > totalPages) {
      set.status = 400;
      return { error: 'Invalid page number' };
    }

    // Get all selections for this raffle and page
    const selections = await Selection.find({ 
      raffleId: id,
      pageNumber: page 
    }).select('number');

    // Calculate the range of numbers for this page
    const startNumber = (page - 1) * 100 + 1;
    const endNumber = Math.min(page * 100, raffle.totalNumbers);
    const numbersInPage = endNumber - startNumber + 1;

    const takenNumbers = selections.map(s => s.number);
    const availableNumbers = Array.from({ length: numbersInPage }, (_, i) => startNumber + i)
      .filter(num => !takenNumbers.includes(num));

    return {
      page,
      totalPages,
      startNumber,
      endNumber,
      availableNumbers,
      takenNumbers,
    };
  })

  // CSV Export for Admin (protected logic but public endpoint with token query usually, but here keeping it public or under auth check?) 
  // Ideally this should be protected. Let's put it OUTSIDE the public block if we want auth, or INSIDE if we want to pass token.
  // The user asked for a button, so likely a protected call. I will put it inside the protected group but as a GET.
  // Actually, standard browser download is easier with GET and cookies/token. 
  // For simplicity with the current authMiddleware (which expects Bearer header), doing a direct browser navigation download is tricky 
  // unless we use a temporary token or just fetch blob in frontend.
  // I will implement it as a protected route and use frontend blob handling.

  // Protected admin routes
  .group('', (app) =>
    app
      .use(authMiddleware)

      .get('/:id/csv', async ({ params: { id }, set }) => {
        const raffle = await Raffle.findById(id);
        if (!raffle) {
          set.status = 404;
          return { error: 'Raffle not found' };
        }

        const selections = await Selection.find({ raffleId: id }).sort({ number: 1 });
        
        let csvContent = 'Numero,Recibo,X,Instagram,WhatsApp\n';
        
        selections.forEach(sel => {
          const x = sel.user.xHandle || '';
          const insta = sel.user.instagramHandle || '';
          const whats = sel.user.whatsapp || '';
          
          csvContent += `${sel.number},${sel.receiptId},${x},${insta},${whats}\n`;
        });

        set.headers['Content-Type'] = 'text/csv';
        set.headers['Content-Disposition'] = `attachment; filename="raffle-${id}-numbers.csv"`;
        
        return csvContent;
      })
      
      .post('/', async ({ body, set, request }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }
          // Coerce numeric fields coming as strings
          if (body.totalNumbers && typeof body.totalNumbers === 'string') {
            body.totalNumbers = Number(body.totalNumbers);
          }
          if (body.totalNumbers && (!Number.isInteger(body.totalNumbers) || body.totalNumbers < 100)) {
            set.status = 400;
            return { error: 'totalNumbers must be an integer >= 100' };
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
          totalNumbers: t.Number(),
          price: t.Number(),
          expirationHours: t.Optional(t.Number()),
          pixName: t.String(),
          pixKey: t.String(),
          pixQRCode: t.Optional(t.String()),
        }),
      })

      .put('/:id', async ({ params: { id }, body, set, request }) => {
        try {
          // Fix timezone: treat input as Brazil time (-03:00) if no timezone specified
          if (body.endDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(body.endDate)) {
            body.endDate = `${body.endDate}-03:00`;
          }
          // Coerce numeric fields coming as strings
          if (body.totalNumbers && typeof body.totalNumbers === 'string') {
            body.totalNumbers = Number(body.totalNumbers);
          }
          if (body.totalNumbers && (!Number.isInteger(body.totalNumbers) || body.totalNumbers < 100)) {
            set.status = 400;
            return { error: 'totalNumbers must be an integer >= 100' };
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
          totalNumbers: t.Optional(t.Number()),
          price: t.Optional(t.Number()),
          expirationHours: t.Optional(t.Number()),
          pixName: t.Optional(t.String()),
          pixKey: t.Optional(t.String()),
          pixQRCode: t.Optional(t.String()),
          winnerNumber: t.Optional(t.Number()),
        }),
      })

      .patch('/:id/status', async ({ params: { id }, body, set }) => {
        const raffle = await Raffle.findById(id);
        
        if (!raffle) {
          set.status = 404;
          return { error: 'Raffle not found' };
        }

        // When closing a raffle, require winningReceiptId
        if (body.status === 'closed' && !body.winningReceiptId) {
          set.status = 400;
          return { error: 'winningReceiptId is required when closing a raffle' };
        }

        raffle.status = body.status;
        if (body.winningReceiptId) {
          raffle.winningReceiptId = body.winningReceiptId;
        }
        await raffle.save();

        return raffle;
      }, {
        body: t.Object({
          status: t.Union([t.Literal('open'), t.Literal('waiting'), t.Literal('closed')]),
          winningReceiptId: t.Optional(t.String()),
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
