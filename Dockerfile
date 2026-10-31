FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN node scripts/build.js --site-only
ENV PORT=7000
EXPOSE 7000
CMD ["node", "src/server/server.js"]
