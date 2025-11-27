FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy Prisma schema & config first
COPY prisma ./prisma
COPY prisma.config.ts ./

# Provide a TEMP DATABASE_URL so `npx prisma generate` doesn't fail at build time.
# This only needs to be a valid-looking URL; the DB doesn't have to be reachable for generate.
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/notifications?schema=public

# Generate Prisma client into node_modules/@prisma/client
RUN npx prisma generate

# Now copy the rest of the source
COPY src ./src

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
