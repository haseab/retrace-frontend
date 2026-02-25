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

**Auth Header Required:**
```http
Authorization: Bearer <BEARER_TOKEN>
```

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

**Auth Header Required:**
```http
Authorization: Bearer <BEARER_TOKEN>
```

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

For the feedback dashboard and sync jobs, configure:

```env
# Existing feedback storage
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
ADMIN_PASSWORD_HASH=...

# Required bearer secret for feedback + analytics APIs
BEARER_TOKEN=...

# Optional GitHub config (defaults: haseab/retrace)
FEEDBACK_SYNC_GITHUB_OWNER=haseab
FEEDBACK_SYNC_GITHUB_REPO=retrace
GITHUB_TOKEN=...

# Optional Featurebase config
FEATUREBASE_API_KEY=...
FEATUREBASE_ORGANIZATION=retrace
```

## Feedback Sync

- Endpoint: `GET /api/feedback/sync` (also accepts `POST`)
- Auth: `Authorization: Bearer <BEARER_TOKEN>`
- Behavior:
  - Pulls open GitHub issues and outstanding Featurebase posts
  - Upserts them into `feedback` with source metadata
  - Marks previously synced items as `resolved` when no longer outstanding

Manual trigger example:

```bash
curl -H "Authorization: Bearer $BEARER_TOKEN" \
  https://your-domain.com/api/feedback/sync
```

## Client Local Storage API Config

Client pages that call feedback/analytics APIs read these localStorage keys:

- `API_BASE_URL` (optional): e.g. `https://your-domain.com`
- `BEARER_TOKEN` (required): must match server `BEARER_TOKEN`
- Internal dashboard behavior: if `BEARER_TOKEN` is missing/invalid, users are prompted to enter it before feedback/analytics loads.

Quick setup example in browser devtools:

```js
localStorage.setItem("API_BASE_URL", "https://your-domain.com");
localStorage.setItem("BEARER_TOKEN", "your-secret");
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
