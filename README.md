# antonshubin.com

Personal portfolio website for Anton Shubin - Full-stack web developer and entrepreneur.

## Tech Stack

- **Framework**: [Fresh 2.0](https://fresh.deno.dev/) with [Deno](https://deno.com/) runtime
- **Build Tool**: [Vite](https://vite.dev/) for bundling and development
- **UI Library**: [Preact](https://preactjs.com/) with JSX/TSX components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Deployment**: Docker-based containerized deployment

## Development

### Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) (latest version)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/spy4x/antonshubin.com.git
cd antonshubin.com

# Start development server
deno task dev
```

The development server will start at `http://localhost:5173` with hot module replacement.

### Available Commands

| Command | Description |
|---------|-------------|
| `deno task dev` | Start development server with HMR |
| `deno task build` | Build for production |
| `deno task start` | Start production server |
| `deno task check` | Run formatting, linting, and type checks |
| `deno task update` | Update Fresh framework |

## Production

### Build

```bash
deno task build
```

### Docker Deployment

```bash
docker build -t antonshubin-com .
docker run -p 8000:8000 antonshubin-com
```

Or use Docker Compose:

```bash
docker compose up -d
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
- Blog with Markdown support
- Project portfolio with image galleries
- Optimized images with WebP format
- SEO-friendly with meta tags and Open Graph support
- Fast loading with Vite bundling

## Author

**Anton Shubin**
- Website: [antonshubin.com](https://antonshubin.com)
- LinkedIn: [linkedin.com/in/anton-shubin](https://www.linkedin.com/in/anton-shubin)
- GitHub: [github.com/spy4x](https://github.com/spy4x)
- YouTube: [youtube.com/@anton-shubin](https://www.youtube.com/@anton-shubin)

## License

This project is for personal use. All rights reserved.
