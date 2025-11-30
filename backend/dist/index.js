import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
// import { websocket } from '@elysiajs/websocket';
import { connectDB } from './db/connection';
import { raffleRoutes } from './routes/raffles';
import { selectionRoutes } from './routes/selections';
import { receiptRoutes } from './routes/receipts';
import { adminRoutes } from './routes/admin';
import { eventBus } from './utils/events';
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3000;
// Remove trailing slash if present to match browser Origin header
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
// Connect to MongoDB
await connectDB();
const app = new Elysia()
    // .use(websocket())
    .use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}))
    /*
    .ws('/ws', {
      open(ws) {
        console.log('WS Connected');
      },
      message(ws, message: any) {
        if (message.type === 'join' && message.raffleId) {
          ws.subscribe(`raffle:${message.raffleId}`);
          console.log(`Client subscribed to raffle:${message.raffleId}`);
        }
      },
    })
    */
    .get('/', () => ({
    message: '🌸 Subaruffles API',
    version: '1.0.0',
    status: 'running',
}))
    .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
}))
    .use(raffleRoutes)
    .use(selectionRoutes)
    .use(receiptRoutes)
    .use(adminRoutes)
    .onError(({ code, error, set }) => {
    console.error('Error:', error);
    if (code === 'NOT_FOUND') {
        set.status = 404;
        return { error: 'Route not found' };
    }
    if (code === 'VALIDATION') {
        set.status = 400;
        return { error: 'Validation error', details: error.message };
    }
    set.status = 500;
    return { error: 'Internal server error' };
})
    .listen(PORT);
// Listen for events and broadcast
eventBus.on('selection:created', (data) => {
    /*
    if (app.server) {
      const channel = `raffle:${data.raffleId}`;
      const message = JSON.stringify({
        type: 'number-taken',
        number: data.number,
        pageNumber: data.pageNumber,
        raffleId: data.raffleId
      });
      app.server.publish(channel, message);
      console.log(`Broadcasted to ${channel}:`, message);
    }
    */
});
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`
🚀 Subaruffles Backend is running!
📍 URL: http://localhost:${PORT}
🌸 Summer calm vibes enabled
`);
//# sourceMappingURL=index.js.map