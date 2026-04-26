# Stage 1: Build the React Application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass the API base URL at build time so the frontend knows where to reach the backend
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

# Stage 2: Serve the App using 'serve'
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build

EXPOSE 3000

# Serve static files, '-s' ensures client-side routing works by falling back to index.html
CMD ["serve", "-s", "build", "-p", "3000"]
