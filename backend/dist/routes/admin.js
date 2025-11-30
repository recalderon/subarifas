import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { Admin } from '../db/models/Admin';
import { Selection } from '../db/models/Selection';
import { authMiddleware } from '../middleware/auth';
import bcrypt from 'bcrypt';
export const adminRoutes = new Elysia({ prefix: '/api/admin' })
    .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
}))
    // Login route
    .post('/login', async (context) => {
    const { body, jwt, set } = context;
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
        return {
            token,
            admin: {
                id: admin._id,
                username: admin.username,
            },
        };
    }
    catch (error) {
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
    }
    catch (error) {
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
    .group('', (app) => app
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
    .get('/selection/:raffleId/:pageNumber/:number', async ({ params: { raffleId, pageNumber, number }, set }) => {
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
}));
//# sourceMappingURL=admin.js.map