# Stage 1: Build the Vite React app
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build the production bundle
COPY . .
RUN npm run build

# Stage 2: Serve static files with NGINX
FROM nginx:alpine

# Copy built assets from Stage 1 to NGINX HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose container port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]