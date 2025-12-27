import { Elysia } from 'elysia';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/audit';

/**
 * Audit logging middleware
 * Logs all state-changing operations for security and compliance
 */
export const auditMiddleware = new Elysia()
  .onAfterHandle(async ({ request, set, store }: any) => {
    const method = request.method;
    const path = new URL(request.url).pathname;
    
    // Only audit state-changing operations and important reads
    const shouldAudit = 
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ||
      (method === 'GET' && (
        path.includes('/admin') ||
        path.includes('/receipts') ||
        path.includes('/winner')
      ));
    
    if (!shouldAudit) return;
    
    const headers: Record<string, string | undefined> = {};
    request.headers.forEach((value: string, key: string) => {
      headers[key] = value;
    });
    
    // Determine action and resource from path
    let action = method.toLowerCase();
    let resource = 'unknown';
    
    if (path.includes('/raffles')) {
      resource = 'raffle';
      if (path.includes('/status')) action = 'status_change';
      if (path.includes('/winner')) action = 'view_winner';
    } else if (path.includes('/receipts')) {
      resource = 'receipt';
      if (path.includes('/upload')) action = 'upload_receipt';
      if (path.includes('/status')) action = 'status_change';
    } else if (path.includes('/selections')) {
      resource = 'selection';
    } else if (path.includes('/admin')) {
      resource = 'admin';
      if (path.includes('/login')) action = 'login';
      if (path.includes('/init')) action = 'init_admin';
    }
    
    const user = (store as any)?.user;
    
    await createAuditLog({
      action,
      resource,
      resourceId: extractResourceId(path),
      userId: user?.id,
      username: user?.username,
      ipAddress: getIpAddress(headers),
      userAgent: getUserAgent(headers),
      method,
      path,
      statusCode: set.status as number,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  });

function extractResourceId(path: string): string | undefined {
  // Extract ID from path patterns like /api/raffles/:id or /api/receipts/:id/upload
  const matches = path.match(/\/([a-f0-9]{24}|[\w-]+)(?:\/|$)/gi);
  if (matches && matches.length > 0) {
    // Return the last matched ID segment
    const id = matches[matches.length - 1].replace(/\//g, '');
    if (id && id !== 'api' && id !== 'raffles' && id !== 'receipts' && id !== 'admin' && id !== 'selections') {
      return id;
    }
  }
  return undefined;
}
