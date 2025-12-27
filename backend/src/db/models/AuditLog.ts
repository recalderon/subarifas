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
      index: true,
      // e.g., 'raffle', 'receipt', 'admin', 'selection'
    },
    resourceId: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
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
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Index for efficient querying
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
