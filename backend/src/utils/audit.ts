import { AuditLog } from '../db/models/AuditLog';

interface AuditLogParams {
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
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      ...params,
      timestamp: new Date(),
    });
  } catch (error) {
    // Don't throw - audit logging should not break application flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(headers: Record<string, string | undefined>): string {
  return (
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['x-real-ip'] ||
    headers['cf-connecting-ip'] || // Cloudflare
    'unknown'
  );
}

/**
 * Get user agent from headers
 */
export function getUserAgent(headers: Record<string, string | undefined>): string {
  return headers['user-agent'] || 'unknown';
}

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeForAudit(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey'];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForAudit(sanitized[key]);
    }
  }
  
  return sanitized;
}
