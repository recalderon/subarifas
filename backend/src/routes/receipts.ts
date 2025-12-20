import { Elysia, t } from 'elysia';
import { Receipt } from '../db/models/Receipt';
import { Selection } from '../db/models/Selection';
import { sendReceiptToTelegram } from '../services/telegram';

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

    return receipt.toObject();
  })

  // Upload receipt
  .post('/:receiptId/upload', async ({ params: { receiptId }, body: { file }, set }) => {
    const receipt = await Receipt.findOne({ receiptId }).populate('raffleId');

    if (!receipt) {
      set.status = 404;
      return { error: 'Receipt not found' };
    }

    // @ts-ignore
    const raffleTitle = receipt.raffleId?.title || 'Unknown Raffle';
    // @ts-ignore
    const rafflePrice = receipt.raffleId?.price || 0;

    // Check if expired
    const isExpired = receipt.status === 'expired' || new Date() > new Date(receipt.expiresAt);

    if (receipt.status !== 'waiting_payment' && !isExpired) {
      set.status = 400;
      return { error: 'Receipt already uploaded or processed' };
    }

    const lastHistory = receipt.statusHistory[receipt.statusHistory.length - 1];
    const lastUpdate = lastHistory ? new Date(lastHistory.changedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A';

    let userDetails = '';
    if (receipt.user.xHandle) userDetails += `X: ${receipt.user.xHandle}\n`;
    if (receipt.user.instagramHandle) userDetails += `Instagram: ${receipt.user.instagramHandle}\n`;
    if (receipt.user.whatsapp) userDetails += `WhatsApp: ${receipt.user.whatsapp}\n`;

    let caption = `
Comprovante de Pagamento
Rifa: ${raffleTitle}
Valor: R$ ${receipt.totalAmount.toFixed(2)}

${userDetails.trim()}
Contato Preferido: ${receipt.user.preferredContact}
ID do Recibo: ${receiptId}
Última Atualização: ${lastUpdate}
    `.trim();

    if (isExpired) {
      caption = `EXPIRADO - REEMBOLSO NECESSÁRIO\n\n${caption}`;
    }

    const sent = await sendReceiptToTelegram(file, caption, file.name);

    if (!sent) {
       set.status = 500;
       return { error: 'Failed to send receipt to Telegram' };
    }

    // Update status to receipt_uploaded
    if (receipt.status === 'waiting_payment' || isExpired) {
        receipt.status = 'receipt_uploaded';
        receipt.statusHistory.push({
            status: 'receipt_uploaded',
            changedAt: new Date(),
            changedBy: 'system',
            note: isExpired ? 'Receipt uploaded after expiration' : 'Receipt uploaded by user'
        });
        await receipt.save();
    }

    return { success: true };
  }, {
    body: t.Object({
      file: t.File()
    })
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
    console.info('Updated receipt status', { receiptId, status: body.status, changedBy: body.changedBy });

    return receipt;
  }, {
    body: t.Object({
      status: t.Union([
        t.Literal('waiting_payment'),
        t.Literal('receipt_uploaded'),
        t.Literal('expired'),
        t.Literal('paid'),
      ]),
      changedBy: t.Optional(t.String()),
      note: t.Optional(t.String()),
    }),
  });
