import mongoose from 'mongoose';

/**
 * Query performance monitoring utility
 * Logs slow queries to help identify optimization opportunities
 */

const SLOW_QUERY_THRESHOLD_MS = 100; // Queries taking longer than this are logged

export function setupQueryMonitoring() {
  // Enable mongoose debug mode in development
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any, options: any) => {
      const timestamp = new Date().toISOString();
      console.log(`[Mongoose Query] ${timestamp} ${collectionName}.${method}`, JSON.stringify(query));
    });
  }

  // Monitor slow queries in production
  mongoose.plugin((schema) => {
    schema.pre(/^find/, function (this: any) {
      this._startTime = Date.now();
    });

    schema.post(/^find/, function (this: any, result: any) {
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          console.warn(`⚠️  Slow query detected (${duration}ms):`, {
            collection: this.mongooseCollection?.name,
            operation: this.op,
            filter: this.getFilter(),
            duration: `${duration}ms`,
          });
        }
      }
    });
  });

  console.log('📊 Query performance monitoring enabled');
}

/**
 * Get current database statistics
 */
export async function getDatabaseStats() {
  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) {
      return { error: 'Database not connected' };
    }

    // Get server status
    const serverStatus = await admin.serverStatus();
    
    // Get collection stats
    const collections = await mongoose.connection.db?.collections();
    const collectionStats = [];

    if (collections) {
      for (const collection of collections) {
        const stats = await collection.stats();
        collectionStats.push({
          name: collection.collectionName,
          count: stats.count,
          size: formatBytes(stats.size),
          avgObjSize: formatBytes(stats.avgObjSize || 0),
          indexes: stats.nindexes,
          indexSize: formatBytes(stats.totalIndexSize || 0),
        });
      }
    }

    return {
      uptime: serverStatus.uptime,
      connections: {
        current: serverStatus.connections?.current,
        available: serverStatus.connections?.available,
      },
      memory: {
        resident: formatBytes(serverStatus.mem?.resident * 1024 * 1024 || 0),
        virtual: formatBytes(serverStatus.mem?.virtual * 1024 * 1024 || 0),
      },
      collections: collectionStats,
    };
  } catch (error: any) {
    console.error('Error getting database stats:', error);
    return { error: error.message };
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check index usage for optimization
 */
export async function analyzeIndexUsage() {
  try {
    const collections = ['raffles', 'receipts', 'selections', 'auditlogs'];
    const analysis: any = {};

    for (const collName of collections) {
      const collection = mongoose.connection.db?.collection(collName);
      if (!collection) continue;

      // Get index stats
      const indexStats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();

      analysis[collName] = indexStats.map((stat: any) => ({
        name: stat.name,
        usageCount: stat.accesses?.ops || 0,
        since: stat.accesses?.since || null,
      }));
    }

    return analysis;
  } catch (error: any) {
    console.error('Error analyzing index usage:', error);
    return { error: error.message };
  }
}
