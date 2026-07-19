FROM node:20-slim
# Prisma's query engine needs libssl/openssl at runtime; node:20-slim ships without
# it, so the client failed to load (silently, until db-push-on-boot made it fatal).
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npx next build
EXPOSE 3000
# Sync the runtime SQLite volume to the schema on every boot, then serve. Additive
# changes (new tables/nullable columns) apply cleanly; a destructive change fails
# loudly here rather than silently dropping data.
CMD ["sh", "-c", "mkdir -p /data && touch /data/mila.db && npx prisma db push --skip-generate && npx next start -p 3000"]
