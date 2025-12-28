import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  method: string;
  path: string;
  statusCode?: number;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
      // e.g., 'create', 'update', 'delete', 'login', 'logout', 'status_change'
    },
    resource: {
      type: String,
      required: true,
      // index: true, // Removed - part of compound indexes below
      // e.g., 'raffle', 'receipt', 'admin', 'selection'
    },
    resourceId: {
      type: String,
      // index: true, // Removed - part of compound indexes below
    },
    userId: {
      type: String,
      // index: true, // Removed - part of compound indexes below
    },
    username: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    method: {
      type: String,
      required: true,
      // HTTP method: GET, POST, PUT, PATCH, DELETE
    },
    path: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // index: true, // Removed - defined explicitly below with TTL
    },
  },
  {
    timestamps: false,
  }
);

// Performance indexes
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 }); // Resource history
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // User activity
AuditLogSchema.index({ action: 1, timestamp: -1 }); // Action timeline
AuditLogSchema.index({ timestamp: -1 }); // Recent logs
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // TTL - delete after 90 days

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
