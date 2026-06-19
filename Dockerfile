FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY data ./data

ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "start"]
