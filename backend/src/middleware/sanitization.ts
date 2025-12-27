import { Elysia } from 'elysia';
import mongoSanitize from 'express-mongo-sanitize';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Sanitization middleware for all requests
 * - Sanitizes request body to prevent XSS
 * - Removes MongoDB operators from queries to prevent NoSQL injection
 */
export const sanitizationMiddleware = new Elysia()
  .onBeforeHandle(({ body, query, set }) => {
    try {
      // Sanitize body if present
      if (body && typeof body === 'object') {
        // Remove MongoDB operators ($gt, $gte, $in, etc.)
        const sanitizedBody = mongoSanitize.sanitize(body, {
          replaceWith: '_',
        });
        
        // Sanitize string values to prevent XSS
        Object.assign(body, sanitizeObject(sanitizedBody));
      }

      // Sanitize query parameters
      if (query && typeof query === 'object') {
        const sanitizedQuery = mongoSanitize.sanitize(query, {
          replaceWith: '_',
        });
        
        Object.assign(query, sanitizeObject(sanitizedQuery));
      }
    } catch (error) {
      console.error('Sanitization error:', error);
      set.status = 400;
      return { error: 'Invalid request data' };
    }
  });
