FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx next build
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
