# LO - Project Reference Document

## Project Overview

**LO** (http://llllllo.com) is a place-based list-making application that allows users to collect and appreciate locations around them. The core concept enables people to see and explore the world through others' perspectives by creating and sharing location-based lists, focusing on authentic, personal place discovery.

## Current Technical Stack

### Frontend
- **Framework**: Next.js 15.2.4 with TypeScript and React 19
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI components with custom styling
- **Maps**: OpenStreetMap with react-leaflet
- **State Management**: React Context + hooks

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Farcaster-only via Neynar SDK (@neynar/react, @neynar/nodejs-sdk)
- **Deployment**: Vercel
- **Geocoding**: Google Places (New) API (planned/in progress)

### Current Architecture Strengths
1. **Modern Stack**: Uses latest Next.js with proper TypeScript setup
2. **Component-Based**: Well-structured component architecture
3. **Mobile-Ready**: Responsive design with Farcaster miniapp support
4. **Real-time Ready**: Supabase provides real-time capabilities out of the box

## Database Schema (Current Implementation)

### Core Tables

#### `users`
```sql
- id (uuid, primary key)
- farcaster_id (text, unique) -- For backward compatibility
- fid (integer) -- Farcaster user ID as integer
- farcaster_username (text)
- farcaster_display_name (text) 
- farcaster_pfp_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `lists`
```sql
- id (uuid, primary key)
- title (text, required)
- description (text)
- visibility (enum: 'public', 'community', 'private')
- owner_id (uuid, foreign key to users.id)
- cover_image_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `places`
```sql
- id (uuid, primary key)
- name (text, required)
- address (text)
- coordinates (geography/point)
- description (text)
- website (text)
- image_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `list_places` (Junction Table)
```sql
- id (uuid, primary key)
- list_id (uuid, foreign key to lists.id)
- place_id (uuid, foreign key to places.id)
- creator_id (uuid, foreign key to users.id) -- Who added this place to this list
- notes (text) -- List-specific notes about the place
- created_at (timestamp)
```

### Relationships
- Users → Lists (one-to-many)
- Lists ↔ Places (many-to-many via list_places)
- Users → list_places (one-to-many, tracks who added what)

## Current Feature Status

### ✅ Implemented & Working
- Farcaster authentication via Neynar
- User registration/profile management
- List CRUD operations
- Basic place management
- Map integration with markers
- Responsive layout for desktop/mobile
- User profiles with lists
- Basic place search functionality
- Farcaster miniapp support

### 🔄 In Progress  
- Place editing and removal from lists
- List sharing functionality
- User experience improvements for map interface
- Place creator attribution
- Search and geocoding integration

### ❌ Not Started
- Photo uploads for places
- Advanced search filters
- Social features (following lists, sharing on Farcaster)
- Notifications system
- Onboarding experience

## Technical Recommendations

### Immediate Improvements

1. **Environment Configuration**
   - Create `.env.example` file with required environment variables
   - Add proper environment validation
   - Document setup process

2. **Database Schema Enhancements**
   - Add proper indexes for performance (farcaster_id, coordinates, list_id + place_id)
   - Add database migrations/schema versioning
   - Implement soft deletes for places (don't delete if used in multiple lists)

3. **Type Safety Improvements**
   - Create comprehensive TypeScript interfaces for all database entities
   - Add proper API response types
   - Implement runtime validation with Zod schemas

4. **Error Handling & Logging**
   - Implement consistent error handling patterns
   - Add proper logging (consider using a service like LogSnag or Axiom)
   - Add user-friendly error messages

### Performance Optimizations

1. **Map Performance**
   - Implement marker clustering for high-density areas
   - Add virtualization for large datasets
   - Consider using react-map-gl for better performance if needed

2. **Database Performance**
   - Implement pagination for lists and places
   - Add database indexes on frequently queried fields
   - Consider implementing database connection pooling

3. **Caching Strategy**
   - Implement SWR for API calls (already in dependencies)
   - Add Redis caching for frequently accessed data
   - Cache geocoding results

### User Experience Enhancements

1. **Search & Discovery**
   - Implement fuzzy search for places and lists
   - Add location-based discovery ("places near me")
   - Create category/tag system for lists

2. **Mobile Experience**
   - Improve touch interactions on map
   - Add gesture controls
   - Optimize for one-handed usage

3. **Onboarding**
   - Create welcome flow for new users
   - Add interactive tutorial for creating first list
   - Provide sample lists to explore

## Security Considerations

### Current Security Model
- Row Level Security (RLS) policies in Supabase
- Farcaster-only authentication reduces attack surface
- Admin operations use service role key

### Recommendations
1. **API Security**
   - Implement rate limiting on API endpoints
   - Add request validation middleware
   - Consider implementing API key system for mobile app

2. **Data Protection**
   - Implement proper input sanitization
   - Add CSRF protection
   - Validate all user inputs server-side

## Development Priorities

### Phase 1: Core Stability (Immediate)
1. Fix place editing/removal bugs
2. Improve error handling
3. Add comprehensive testing
4. Complete documentation

### Phase 2: Feature Completion (Short-term)
1. Photo upload functionality
2. Enhanced search capabilities
3. List sharing and social features
4. Mobile UX improvements

### Phase 3: Growth Features (Medium-term)
1. Notification system
2. Advanced discovery features
3. Performance optimizations
4. Analytics and insights

### Phase 4: Expansion (Long-term)
1. Additional authentication methods
2. API for third-party integrations
3. Advanced social features
4. Monetization features

## Architectural Decisions

### Why Farcaster-Only Auth?
- **Pros**: Simplified user model, built-in social graph, reduced spam
- **Cons**: Limited user base, dependency on Farcaster ecosystem
- **Recommendation**: Keep for MVP, plan for expansion later

### Why Supabase?
- **Pros**: Real-time capabilities, built-in auth, PostGIS for geo data
- **Cons**: Vendor lock-in, pricing at scale
- **Recommendation**: Good choice for MVP, monitor usage for scaling decisions

### Why OpenStreetMap?
- **Pros**: No API costs, good community data, flexible styling
- **Cons**: Potentially less detailed than Google Maps in some regions
- **Recommendation**: Good for current needs, consider hybrid approach later

## Risk Assessment

### High Priority Risks
1. **Data Consistency**: Need robust handling of place deletion/editing
2. **Performance**: Map rendering with many markers needs optimization
3. **User Adoption**: Farcaster-only auth limits initial user base

### Medium Priority Risks
1. **Geocoding Costs**: Google Places API can become expensive
2. **Mobile Performance**: Heavy map usage on mobile devices
3. **Content Moderation**: Need systems for inappropriate content

### Low Priority Risks
1. **Vendor Dependencies**: Reliance on Supabase and Neynar
2. **Feature Scope Creep**: Many nice-to-have features identified
3. **Data Migration**: Future schema changes may be complex

## Next Steps for Cursor Development

1. **Immediate Tasks**
   - Set up proper development environment
   - Create missing environment variables documentation  
   - Fix critical bugs in place management
   - Add comprehensive error handling

2. **Development Process**
   - Implement proper testing strategy
   - Set up database migrations
   - Create component documentation
   - Establish code review process

This reference document should be updated as the project evolves and architectural decisions are made. 