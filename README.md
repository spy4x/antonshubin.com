# antonshubin.com

Personal portfolio website for Anton Shubin - Full-stack web developer and
entrepreneur.

## Tech Stack

- **Framework**: [Fresh 2.0](https://fresh.deno.dev/) with
  [Deno](https://deno.com/) runtime
- **Build Tool**: [Vite](https://vite.dev/) for bundling and development
- **UI Library**: [Preact](https://preactjs.com/) with JSX/TSX components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Deployment**: Docker-based containerized deployment

## Development

### Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) (latest
  version)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/spy4x/antonshubin.com.git
cd antonshubin.com

# Start development server
deno task dev
```

The development server will start at `http://localhost:5173` with hot module
replacement.

### Available Commands

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `deno task dev`    | Start development server with HMR        |
| `deno task build`  | Build for production                     |
| `deno task start`  | Start production server                  |
| `deno task check`  | Run formatting, linting, and type checks |
| `deno task update` | Update Fresh framework                   |

## Production

### Build

```bash
deno task build
```

### Docker Deployment

**Note**: For production, this uses Traefik reverse proxy. For local testing
without Traefik, you'll need to add a port mapping to `compose.yml`.

```bash
# Build and run with Traefik (production setup)
docker compose up -d

# For local testing without Traefik, temporarily add port mapping:
# ports:
#   - "8000:8000"
# Then: docker compose up -d
```

## Project Structure

```
.
├── assets/           # Global CSS styles
├── components/       # Reusable Preact components
├── content/          # Blog posts (Markdown)
├── islands/          # Interactive client-side components
├── lib/              # Data and utilities
├── routes/           # Page routes (file-based routing)
├── static/           # Static assets (images, icons)
├── deno.json         # Deno configuration
├── Dockerfile        # Docker build configuration
└── compose.yml       # Docker Compose configuration
```

## Features

- Responsive design optimized for mobile and desktop
- Blog with Markdown support and image enhancements
- Project portfolio with categorization (Personal, Archived, Client)
- Project detail pages with technologies and external links
- Optimized images with WebP format and mobile variants
- SEO-friendly with meta tags and Open Graph support
- Fast loading with Vite bundling and lazy loading
- Modern containerized deployment with Traefik integration

## Recent Updates

### v2.0 Rewrite (2025-01-18)

- Complete rewrite using Fresh 2.0, Vite, Preact, and Tailwind CSS v4
- Added new projects: Homelab, Financy, Air Quality Sensor
- Archived legacy projects: The Seed, Toread.Today
- Modernized layout with consistent `max-w-4xl` containers
- Optimized images (hero: 58% size reduction, added mobile variant)
- Improved mobile responsiveness (social buttons, text wrapping)
- Separated active and archived projects in portfolio

## Author

**Anton Shubin**

- Website: [antonshubin.com](https://antonshubin.com)
- LinkedIn:
  [linkedin.com/in/anton-shubin](https://www.linkedin.com/in/anton-shubin)
- GitHub: [github.com/spy4x](https://github.com/spy4x)
- YouTube: [youtube.com/@anton-shubin](https://www.youtube.com/@anton-shubin)

## License

This project is for personal use. All rights reserved.
