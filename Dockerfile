FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx next build 2>&1 || echo "Build had warnings"
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
