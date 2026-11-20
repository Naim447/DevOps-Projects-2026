FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# wget is used by the Compose healthcheck (curl is not in alpine by default).
RUN apk add --no-cache wget

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src

USER node
EXPOSE 3000

CMD ["node", "src/server.js"]
