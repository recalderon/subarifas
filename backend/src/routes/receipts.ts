import { Elysia, t } from 'elysia';
import { Receipt } from '../db/models/Receipt';
import { Selection } from '../db/models/Selection';

export const receiptRoutes = new Elysia({ prefix: '/api/receipts' })
  // Get all receipts for a raffle
  .get('/:raffleId', async ({ params: { raffleId } }) => {
    const receipts = await Receipt.find({ raffleId })
      .populate('raffleId')
      .sort({ createdAt: -1 });

    return receipts;
  })

  // Get single receipt details
  .get('/detail/:receiptId', async ({ params: { receiptId }, set }) => {
    const receipt = await Receipt.findOne({ receiptId })
      .populate('raffleId');

    if (!receipt) {
      set.status = 404;
      return { error: 'Receipt not found' };
    }

    return receipt;
  })

  // Update receipt status (admin only)
  .patch('/:receiptId/status', async ({ params: { receiptId }, body, set }) => {
    const receipt = await Receipt.findOne({ receiptId });

    if (!receipt) {
      set.status = 404;
      return { error: 'Receipt not found' };
    }

    // Add to status history
    receipt.statusHistory.push({
      status: body.status,
      changedAt: new Date(),
      changedBy: body.changedBy,
      note: body.note,
    });

    // Update current status
    receipt.status = body.status;

    // If status is paid, set paidAt
    if (body.status === 'paid' && !receipt.paidAt) {
      receipt.paidAt = new Date();
    }

    // If status is expired, delete associated selections
    if (body.status === 'expired') {
      await Selection.deleteMany({ receiptId });
    }

    await receipt.save();

    return receipt;
  }, {
    body: t.Object({
      status: t.Union([
        t.Literal('created'),
        t.Literal('waiting_payment'),
        t.Literal('expired'),
        t.Literal('paid'),
      ]),
      changedBy: t.Optional(t.String()),
      note: t.Optional(t.String()),
    }),
  });
