FROM denoland/deno:2.9.0

WORKDIR /app

# Build id for the service worker's cache name (see routes/sw.js.ts).
# Passed by compose.yml, set by scripts/deploy.ts to the deploy commit hash.
ARG BUILD_ID=dev
ENV BUILD_ID=${BUILD_ID}

# Copy package files first
COPY deno.json deno.lock ./

# Cache dependencies
RUN deno install

# Copy application code
COPY . .

# Build for production with Vite
RUN deno task build

# Expose port
EXPOSE 8000

# Run the production server
CMD ["task", "start"]
