FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --production

# Copy source code
COPY . .

# Build the application (if needed, though bun runs ts directly)
# RUN bun build src/index.ts --outdir dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "src/index.ts"]
