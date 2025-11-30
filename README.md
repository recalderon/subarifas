# 🌸 Subaruffles

A cute, summer-themed raffle system with separated frontend and backend.

## Project Structure

- **Backend**: Elysia.js + MongoDB (Bun runtime)
- **Frontend**: Vite + React + TailwindCSS

## Prerequisites

- Node.js & npm
- Bun (for backend)
- MongoDB running locally (or connection string)

## Getting Started

### 1. Backend Setup

First, start MongoDB using Docker:
```bash
docker compose up -d
```

Then run the backend:
```bash
cd backend
cp .env.example .env
# The default .env already points to localhost:27017, so no changes needed
bun install
bun run dev
```

The backend will run on `http://localhost:3000`.

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend URL is different
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Deployment on Fly.io

### Backend

1. Create app: `fly launch` (select "No" to deploy now)
2. Set secrets:
   ```bash
   fly secrets set MONGODB_URI="your-mongodb-uri" JWT_SECRET="your-secret" ADMIN_PASSWORD="your-password"
   ```
3. Deploy: `fly deploy`

### Frontend

1. Create app: `fly launch` (select "No" to deploy now)
2. Update `.env` or build args with backend URL
3. Deploy: `fly deploy`

## Features

- 📚 **Book Metaphor**: Raffles are books, pages are groups of 100 numbers.
- 🎨 **Summer Vibes**: Cute pastel colors, glassmorphism, and animations.
- 📱 **Responsive**: Works great on mobile and desktop.
- 🔒 **Admin Panel**: Manage raffles, view selections, and control status.
- 🇧🇷 **Brazilian Localization**: Dates and times in pt-BR format.

## Logging & Debugging

- To help diagnose validation errors in production (e.g., 422 responses), enable detailed request shape logging by setting the environment variable `LOG_REQUEST_SHAPES=true` on the backend. The server will then log method/url/headers and the request body (truncated) on validation errors and other exceptions.
- Use this cautiously in production as it may log sensitive data; prefer turning it on temporarily while debugging.

## License

MIT
