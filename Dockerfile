FROM node:20-slim
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
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx next start -p 3000"]
