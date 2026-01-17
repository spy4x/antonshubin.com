FROM denoland/deno:2.3.1

WORKDIR /app

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
