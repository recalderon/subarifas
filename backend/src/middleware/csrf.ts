import { Elysia } from 'elysia';
import crypto from 'crypto';

// Simple CSRF token store (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 3600000);

export const csrfProtection = new Elysia()
  // Generate CSRF token endpoint
  .get('/api/csrf-token', ({ headers }) => {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = headers['x-session-id'] || crypto.randomUUID();
    
    // Token valid for 1 hour
    csrfTokens.set(sessionId, {
      token,
      expires: Date.now() + 3600000,
    });

    return {
      csrfToken: token,
      sessionId,
    };
  })
  // Verify CSRF token for state-changing operations
  .derive(({ request, headers, set }) => {
    const method = request.method;
    
    // Only check CSRF for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      // Skip CSRF for public endpoints (selections, receipts upload)
      const path = new URL(request.url).pathname;
      if (
        path.startsWith('/api/selections') ||
        path.startsWith('/api/receipts') ||
        path === '/api/admin/login' ||
        path === '/api/admin/init'
      ) {
        return {};
      }

      const csrfToken = headers['x-csrf-token'];
      const sessionId = headers['x-session-id'];

      if (!csrfToken || !sessionId) {
        set.status = 403;
        throw new Error('CSRF token required');
      }

      const stored = csrfTokens.get(sessionId);
      
      if (!stored || stored.token !== csrfToken) {
        set.status = 403;
        throw new Error('Invalid CSRF token');
      }

      if (stored.expires < Date.now()) {
        csrfTokens.delete(sessionId);
        set.status = 403;
        throw new Error('CSRF token expired');
      }
    }

    return {};
  });
