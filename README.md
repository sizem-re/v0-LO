# LO - Place-Based List-Making Application

**LO** is a place-based list-making application that allows users to collect and appreciate locations around them. Create lists of favorite places like bridges, sandwich shops, skate spots, listening bars, and any meaningful locations. Explore the world through the perspective of others by browsing and sharing location-based lists.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sizem-res-projects/v0-lo)

## Features

- **Farcaster Authentication**: Secure login using your Farcaster identity
- **Interactive Maps**: Explore places on an interactive map powered by OpenStreetMap
- **Map Placeholders**: Places without photos automatically show a static map view with a 0.25 mile radius
- **List Management**: Create, edit, and share lists with different visibility settings
- **Place Discovery**: Search and add places using integrated geocoding
- **Mobile Ready**: Responsive design that works on desktop, mobile, and as a Farcaster miniapp
- **Real-time Updates**: Live updates powered by Supabase

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and React 19
- **Styling**: Tailwind CSS with Radix UI components
- **Maps**: OpenStreetMap with react-leaflet
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Farcaster via Neynar SDK
- **Deployment**: Vercel

## Environment Variables

The following environment variables are required and managed through Vercel deployment settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY        # Supabase service role key

# Neynar (Farcaster) Configuration  
NEYNAR_API_KEY                   # Your Neynar API key
NEXT_PUBLIC_NEYNAR_CLIENT_ID     # Your Neynar client ID

# Google Places API
GOOGLE_PLACES_API_KEY            # Google Places API key for geocoding

# NextJS Configuration
NEXTAUTH_SECRET                  # Random string for session encryption
NEXTAUTH_URL                     # Your app's URL (e.g., http://localhost:3000)

# App Configuration
NEXT_PUBLIC_APP_URL             # Your app's public URL
NEXT_PUBLIC_APP_NAME            # App name (LO)
```

For local development, you can create a `.env.local` file with these variables. For production, they are securely managed through Vercel's deployment settings.

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Neynar (Farcaster) API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/v0-LO.git
cd v0-LO
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp SETUP.md .env.local
# Edit .env.local with your actual API keys and configuration
```

4. Set up your database by following the instructions in [`SETUP.md`](./SETUP.md)

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

- **[Project Reference](./PROJECT_REFERENCE.md)** - Comprehensive project overview and technical details
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions for development
- **[Database Schema](./SETUP.md#database-schema)** - Complete database structure and relationships

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Project Status

This project transitioned from v0.dev development to full Cursor/IDE development. See [`PROJECT_REFERENCE.md`](./PROJECT_REFERENCE.md) for current feature status and development roadmap.

### Current Features Status
- ✅ Farcaster authentication and user management
- ✅ List CRUD operations with visibility controls
- ✅ Place management and map integration
- ✅ Mobile-responsive design
- 🔄 Place editing and advanced search (in progress)
- ❌ Photo uploads and social features (planned)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

The application is deployed on Vercel. For deployment instructions and environment variable setup, see the [Setup Guide](./SETUP.md#deployment).

**Live Application**: [https://v0-lo.vercel.app](https://v0-lo.vercel.app)

## Support

If you encounter any issues or have questions:

1. Check the [Setup Guide](./SETUP.md#troubleshooting) for common issues
2. Review the [Project Reference](./PROJECT_REFERENCE.md) for technical details
3. Open an issue on GitHub
