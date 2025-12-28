import { Selection } from '../db/models/Selection';
import { Receipt } from '../db/models/Receipt';
import { AuditLog } from '../db/models/AuditLog';

/**
 * Cleanup expired selections and receipts
 * Runs periodically to free up database space
 */
export async function cleanupExpiredData() {
  try {
    console.log('🧹 Starting cleanup job...');

    const now = new Date();
    
    // 1. Find and delete expired unpaid receipts (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const expiredReceipts = await Receipt.find({
      status: 'expired',
      expiresAt: { $lt: sevenDaysAgo }
    }).select('receiptId raffleId').lean();

    if (expiredReceipts.length > 0) {
      const receiptIds = expiredReceipts.map(r => r.receiptId);
      
      // Delete associated selections first
      const deletedSelections = await Selection.deleteMany({
        receiptId: { $in: receiptIds }
      });
      
      // Then delete the receipts
      const deletedReceipts = await Receipt.deleteMany({
        receiptId: { $in: receiptIds }
      });

      console.log(`✅ Deleted ${deletedReceipts.deletedCount} expired receipts and ${deletedSelections.deletedCount} selections`);
    } else {
      console.log('ℹ️  No expired receipts to clean up');
    }

    // 2. Archive old audit logs (handled by TTL index, but we can add manual cleanup for older data)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const deletedLogs = await AuditLog.deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    if (deletedLogs.deletedCount > 0) {
      console.log(`✅ Deleted ${deletedLogs.deletedCount} old audit logs`);
    }

    // 3. Find orphaned selections (receipts that no longer exist)
    const allReceiptIds = await Receipt.distinct('receiptId');
    const orphanedSelections = await Selection.deleteMany({
      receiptId: { $nin: allReceiptIds }
    });

    if (orphanedSelections.deletedCount > 0) {
      console.log(`✅ Deleted ${orphanedSelections.deletedCount} orphaned selections`);
    }

    console.log('✅ Cleanup job completed successfully');
  } catch (error) {
    console.error('❌ Error in cleanup job:', error);
  }
}

/**
 * Start the cleanup job scheduler
 * Runs every hour
 */
export function startCleanupScheduler() {
  // Run immediately on startup
  cleanupExpiredData();

  // Then run every hour
  const HOUR_MS = 60 * 60 * 1000;
  setInterval(cleanupExpiredData, HOUR_MS);

  console.log('🕐 Cleanup scheduler started (runs every hour)');
}
