FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/server.js"]
