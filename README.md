# Retrace Frontend

Official website for Retrace - a local-first screen recording and search application for macOS.

## Overview

This is the marketing website and download portal for Retrace. Built with Next.js 16, TypeScript, and Tailwind CSS, featuring beautiful animated components inspired by Magic UI.

## Features

- **Landing Page**: Hero section, feature highlights, how it works, and CTA
- **Download Page**: Installation instructions, system requirements, and download tracking
- **Documentation**: Comprehensive user and developer guides
- **FAQ**: Common questions with accordion UI
- **Privacy Policy**: Transparent data handling policy
- **About Page**: Project mission and values
- **Roadmap**: Public development roadmap
- **Stats Dashboard**: Real-time download statistics
- **Dark Mode**: System-aware dark mode support
- **Download Tracking API**: Privacy-respecting anonymous download metrics

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The development server will start at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── download/          # Download page
│   ├── faq/               # FAQ page
│   ├── about/             # About page
│   ├── privacy/           # Privacy policy
│   ├── roadmap/           # Roadmap page
│   ├── docs/              # Documentation
│   ├── stats/             # Download stats
│   └── api/               # API routes
│       └── downloads/     # Download tracking API
├── components/
│   ├── ui/                # Reusable UI components
│   └── sections/          # Page sections (Hero, Footer, etc.)
└── lib/
    └── utils.ts           # Utility functions
```

## Pages

- `/` - Landing page with hero and features
- `/download` - Download page with installation instructions
- `/faq` - Frequently asked questions
- `/about` - About Retrace and the team
- `/privacy` - Privacy policy
- `/roadmap` - Development roadmap
- `/docs` - Documentation hub
- `/stats` - Public download statistics

## API Routes

### POST /api/downloads/track

Track download events (anonymous, privacy-respecting).

**Request Body:**
```json
{
  "version": "1.0.0",
  "platform": "macOS",
  "source": "website"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Download tracked successfully"
}
```

### GET /api/downloads/track

Get download statistics.

**Response:**
```json
{
  "totalDownloads": 1234,
  "stats": [
    {
      "version": "1.0.0",
      "platform": "macOS",
      "count": 1234
    }
  ]
}
```

## Environment Variables

Currently, no environment variables are required. The download tracking uses in-memory storage for demo purposes. In production, connect to a database:

```env
# Example for production
DATABASE_URL=postgresql://...
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Other Platforms

Build the production bundle and deploy to any Node.js hosting:

```bash
pnpm build
pnpm start
```

## Customization

### Colors & Theme

Edit [tailwind.config.ts](tailwind.config.ts) to customize colors, fonts, and design tokens.

### Content

- Hero text: [src/components/sections/hero.tsx](src/components/sections/hero.tsx)
- Features: [src/components/sections/features.tsx](src/components/sections/features.tsx)
- FAQ: [src/app/faq/page.tsx](src/app/faq/page.tsx)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under MIT - see [LICENSE](LICENSE) for details.

## Privacy

This website respects user privacy:
- No Google Analytics or tracking scripts
- Anonymous download counters only
- No cookies for tracking
- No personal data collection

## Support

- Email Support: [Report bugs](mailto:support@retrace.to)
- Featurebase: [Join the community](https://retrace.featurebase.app)

---

Built with ❤️ for privacy-first software
