import cron from 'node-cron';
import { Receipt } from '../db/models/Receipt';
import { Selection } from '../db/models/Selection';

/**
 * Background job to automatically expire receipts
 * Runs every 5 minutes to check for expired receipts
 */
export const startExpirationJob = () => {
  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Expiration Job] Checking for expired receipts...');

      const now = new Date();

      // Find all receipts that are expired but not marked as such
      const expiredReceipts = await Receipt.find({
        status: { $in: ['created', 'waiting_payment'] },
        expiresAt: { $lte: now },
      });

      if (expiredReceipts.length === 0) {
        console.log('[Expiration Job] No expired receipts found.');
        return;
      }

      console.log(`[Expiration Job] Found ${expiredReceipts.length} expired receipt(s). Processing...`);

      // Process each expired receipt
      for (const receipt of expiredReceipts) {
        try {
          // Update receipt status to expired
          receipt.status = 'expired';
          receipt.statusHistory.push({
            status: 'expired',
            changedAt: new Date(),
            changedBy: 'System (Auto-Expiration)',
            note: 'Automatically expired due to timeout',
          });

          await receipt.save();

          // Delete associated selections to free up numbers
          const deletedCount = await Selection.deleteMany({
            receiptId: receipt.receiptId,
          });

          console.log(
            `[Expiration Job] Expired receipt ${receipt.receiptId} and freed ${deletedCount.deletedCount} number(s)`
          );
        } catch (err) {
          console.error(`[Expiration Job] Error processing receipt ${receipt.receiptId}:`, err);
        }
      }

      console.log('[Expiration Job] Expiration check completed.');
    } catch (err) {
      console.error('[Expiration Job] Error during expiration check:', err);
    }
  });

  console.log('[Expiration Job] Started. Running every 5 minutes.');
};
