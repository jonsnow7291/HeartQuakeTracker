FROM node:22-slim
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY seed ./seed
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# Migra al arrancar (main.ts) y sirve la API.
CMD ["npx", "tsx", "src/main.ts"]
