FROM node:24.1.0-alpine
WORKDIR /app
COPY apps/rider-api/dist/package*.json ./

# Install production dependencies
RUN npm i --legacy-peer-deps && \
    npm i mysql core-js @swc/helpers@0.5.17 --legacy-peer-deps

# Copy built application
COPY apps/rider-api/dist/main.js ./

EXPOSE 3000
CMD ["node", "main.js"]