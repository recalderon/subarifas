import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    })
  )
  .derive(async (context) => {
    const { jwt, headers, set } = context as any;
    const auth = headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('Unauthorized: No token provided');
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      throw new Error('Unauthorized: Invalid token');
    }

    return {
      user: payload,
    };
  });
