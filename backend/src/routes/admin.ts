import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { Admin } from '../db/models/Admin';
import { Selection } from '../db/models/Selection';
import { AuditLog } from '../db/models/AuditLog';
import { authMiddleware } from '../middleware/auth';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/audit';
import bcrypt from 'bcrypt';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      exp: '24h', // Token expires in 24 hours
    })
  )

  // Login route
  .post('/login', async (context) => {
    const { body, jwt, set } = context as any;
    try {
      const admin = await Admin.findOne({ username: body.username });

      if (!admin) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      const isValid = await admin.comparePassword(body.password);

      if (!isValid) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      const token = await jwt.sign({
        id: admin._id,
        username: admin.username,
      });

      // Log successful login
      const headers: Record<string, string | undefined> = {};
      (context as any).request.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });
      
      await createAuditLog({
        action: 'login',
        resource: 'admin',
        userId: admin._id.toString(),
        username: admin.username,
        ipAddress: getIpAddress(headers),
        userAgent: getUserAgent(headers),
        method: 'POST',
        path: '/api/admin/login',
        statusCode: 200,
        metadata: {
          success: true,
        },
      });

      return {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
        },
      };
    } catch (error: any) {
      set.status = 500;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })

  // Initialize admin (only if no admin exists)
  .post('/init', async ({ body, set }) => {
    try {
      const existingAdmin = await Admin.findOne();

      if (existingAdmin) {
        set.status = 400;
        return { error: 'Admin already exists' };
      }

      const passwordHash = await bcrypt.hash(body.password, 10);
      const admin = new Admin({
        username: body.username,
        passwordHash,
      });

      await admin.save();
      set.status = 201;

      return { message: 'Admin created successfully' };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })

  // Protected routes
  .group('', (app) =>
    app
      .use(authMiddleware)

      .get('/selections/:raffleId', async ({ params: { raffleId } }) => {
        const selections = await Selection.find({ raffleId })
          .sort({ pageNumber: 1, number: 1 });

        // Calculate min and max numbers
        const numbers = selections.map(s => s.number);
        const min = numbers.length > 0 ? Math.min(...numbers) : null;
        const max = numbers.length > 0 ? Math.max(...numbers) : null;

        return {
          selections,
          stats: {
            total: selections.length,
            min,
            max,
          },
        };
      })

      .get('/selection/:raffleId/:pageNumber/:number', async ({ 
        params: { raffleId, pageNumber, number }, 
        set 
      }) => {
        const selection = await Selection.findOne({
          raffleId,
          pageNumber: parseInt(pageNumber),
          number: parseInt(number),
        });

        if (!selection) {
          set.status = 404;
          return { error: 'Selection not found' };
        }

        return selection;
      })

      // Get audit logs (admin only)
      .get('/audit-logs', async ({ query }) => {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const filter: any = {};
        
        if (query.resource) {
          filter.resource = query.resource;
        }
        if (query.action) {
          filter.action = query.action;
        }
        if (query.userId) {
          filter.userId = query.userId;
        }

        const [logs, total] = await Promise.all([
          AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .lean(),
          AuditLog.countDocuments(filter),
        ]);

        return {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      })
  );
