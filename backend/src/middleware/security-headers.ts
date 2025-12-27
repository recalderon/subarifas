import { Elysia } from 'elysia';

/**
 * Security headers middleware
 * Implements best practices for HTTP security headers
 */
export const securityHeaders = new Elysia()
  .onAfterHandle(({ set }) => {
    // Prevent clickjacking attacks
    set.headers['X-Frame-Options'] = 'DENY';
    
    // Prevent MIME type sniffing
    set.headers['X-Content-Type-Options'] = 'nosniff';
    
    // Enable XSS protection (for older browsers)
    set.headers['X-XSS-Protection'] = '1; mode=block';
    
    // Referrer policy - don't leak referrer info
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    
    // Content Security Policy
    set.headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    
    // Permissions Policy (formerly Feature Policy)
    set.headers['Permissions-Policy'] = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
    ].join(', ');
    
    // Strict Transport Security (HTTPS only) - only if in production
    if (process.env.NODE_ENV === 'production') {
      set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }
    
    // Remove powered-by header to avoid revealing technology stack
    delete set.headers['X-Powered-By'];
  });
