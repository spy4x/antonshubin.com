FROM denoland/deno:2.9.0

WORKDIR /app

# Copy package files first
COPY deno.json deno.lock ./

# Cache dependencies
RUN deno install

# Build id: the deploy commit hash, passed by compose.yml from
# scripts/deploy.ts. Fresh versions assets with one id in the server HTML
# (?__frsh_c=) and another baked into the client bundle; with no git and no id
# in the env it picks a random one for each, and every hydrated image then
# downloads twice (#593). DENO_DEPLOYMENT_ID gives both the same id. Declared
# after the install so the dependency layer stays cached; the build layer
# below is invalidated by `COPY . .` on every commit anyway.
ARG BUILD_ID=dev

# Copy application code
COPY . .

# Build for production with Vite
RUN DENO_DEPLOYMENT_ID=${BUILD_ID} deno task build

# routes/sw.js.ts prints the id at request time, for the deploy to read.
ENV BUILD_ID=${BUILD_ID}

# Expose port
EXPOSE 8000

# Run the production server
CMD ["task", "start"]
