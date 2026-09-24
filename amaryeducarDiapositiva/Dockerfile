# --- Etapa 1: build (Vite + pnpm) ---
FROM node:22-alpine AS build
RUN npm install -g pnpm@11
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# --- Etapa 2: servir estáticos con nginx ---
FROM nginx:alpine
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
