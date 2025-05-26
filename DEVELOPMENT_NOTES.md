# Development Notes

## Package Management
- **DO NOT USE NPM** - This project uses **pnpm**
- Always use `pnpm install` instead of `npm install`
- Lock file: pnpm-lock.yaml

## Project Setup
- Farcaster Frame authentication implementation
- Uses Neynar SDK for Farcaster API interactions
- Supabase for database operations
- Next.js app with TypeScript

## Authentication Flow
- Frame metadata in layout.tsx for Farcaster discovery
- Miniapp authentication using @farcaster/frame-sdk
- JWT token verification for secure authentication
- Database integration with existing user schema

## Key Issues Resolved
- Frame metadata conflicts (JSON vs meta tags)
- Neynar SDK v2 compatibility
- JWT token verification requirements
- Miniapp context detection and authentication

## Current Issue - RESOLVED
- ~~Need to install @farcaster/quick-auth for proper JWT verification~~ ✅ DONE
- ~~Currently using manual JWT decoding which may not work correctly~~ ✅ FIXED
- ~~"Demo user" appearing instead of real user data~~ ✅ SHOULD BE FIXED

## Recent Changes
- Installed @farcaster/quick-auth package using pnpm
- Replaced manual JWT decoding with official Farcaster Quick Auth client
- Fixed domain verification to use llllllo.com for production
- Added proper error handling for JWT verification
- Fixed FID type conversion for Neynar API calls

## Testing Status
- Development server started with updated authentication
- Need to test miniapp authentication flow to verify real user data is now working 