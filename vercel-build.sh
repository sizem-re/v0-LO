#!/bin/bash

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Make sure TypeScript and React types are installed
npm install --save-dev typescript@5.8.3 @types/react@19.1.4 @types/node@22.15.17 @types/react-dom@19.1.5

# Run the build with TypeScript checks disabled
NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS='--max-old-space-size=4096' npx next build --no-lint 