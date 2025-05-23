# LO Development Setup Guide

## Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Neynar (Farcaster) API access
- Google Cloud Platform account (for Places API)

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Neynar (Farcaster) Configuration  
NEYNAR_API_KEY=your_neynar_api_key
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_neynar_client_id

# Google Places API (for geocoding and place search)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# NextJS Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LO
```

## Database Setup

### 1. Supabase Project Setup

1. Create a new Supabase project
2. Navigate to Settings > API to get your project URL and keys
3. Run the database migrations (see Database Schema section)

### 2. Database Schema

The application requires the following tables. Execute these SQL commands in your Supabase SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farcaster_id TEXT UNIQUE NOT NULL,
    fid INTEGER,
    farcaster_username TEXT,
    farcaster_display_name TEXT,
    farcaster_pfp_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'community', 'private')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places table
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    coordinates GEOGRAPHY(POINT, 4326),
    description TEXT,
    website TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for lists and places
CREATE TABLE list_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, place_id)
);

-- Indexes for performance
CREATE INDEX idx_users_farcaster_id ON users(farcaster_id);
CREATE INDEX idx_users_fid ON users(fid);
CREATE INDEX idx_lists_owner_id ON lists(owner_id);
CREATE INDEX idx_lists_visibility ON lists(visibility);
CREATE INDEX idx_places_coordinates ON places USING GIST(coordinates);
CREATE INDEX idx_list_places_list_id ON list_places(list_id);
CREATE INDEX idx_list_places_place_id ON list_places(place_id);
CREATE INDEX idx_list_places_creator_id ON list_places(creator_id);
```

### 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_places ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (farcaster_id = current_setting('app.current_user_fid', true));

-- Lists policies
CREATE POLICY "Anyone can view public and community lists" ON lists FOR SELECT TO authenticated USING (visibility IN ('public', 'community'));
CREATE POLICY "Users can view their own lists" ON lists FOR SELECT TO authenticated USING (owner_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "Users can create lists" ON lists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own lists" ON lists FOR UPDATE TO authenticated USING (owner_id::text = current_setting('app.current_user_id', true));
CREATE POLICY "Users can delete their own lists" ON lists FOR DELETE TO authenticated USING (owner_id::text = current_setting('app.current_user_id', true));

-- Places policies
CREATE POLICY "Anyone can view places" ON places FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create places" ON places FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Places can be updated by anyone" ON places FOR UPDATE TO authenticated USING (true);

-- List places policies
CREATE POLICY "Anyone can view list places" ON list_places FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add places to lists they own" ON list_places FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM lists WHERE id = list_id AND owner_id::text = current_setting('app.current_user_id', true))
);
CREATE POLICY "Users can remove places from lists they own" ON list_places FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM lists WHERE id = list_id AND owner_id::text = current_setting('app.current_user_id', true))
);
```

## API Keys Setup

### 1. Neynar (Farcaster) API

1. Visit [Neynar Developer Portal](https://dev.neynar.com/)
2. Create an account and new application
3. Get your API key and Client ID
4. Add them to your `.env.local` file

### 2. Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Places API (New)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add to your `.env.local` file

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### Environment Variables for Production

Make sure to set all the production URLs and keys:

- Change `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Supabase project
- Restrict API keys to production domains

## Testing the Setup

1. Start the development server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. Try to authenticate with Farcaster
4. Create a test list
5. Add a test place to the list
6. Verify the place appears on the map

## Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify your Supabase URL and keys
   - Check if your IP is allowed in Supabase settings

2. **Farcaster Authentication Issues**
   - Ensure Neynar API key is valid
   - Check that the client ID matches your Neynar app

3. **Map Not Loading**
   - Verify your internet connection
   - Check browser console for errors
   - Ensure OpenStreetMap tiles are accessible

4. **Database Errors**
   - Check that all tables and RLS policies are created
   - Verify foreign key relationships
   - Check Supabase logs for detailed error messages

## Development Tips

1. **Use Supabase Local Development**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local instance
   supabase start
   ```

2. **Database Migrations**
   - Use Supabase CLI for schema migrations
   - Keep track of schema changes in version control

3. **Component Development**
   - Use Storybook for component development (to be added)
   - Test components in isolation

4. **Debugging**
   - Use React Developer Tools
   - Check Network tab for API calls
   - Use Supabase dashboard for database queries
``` 