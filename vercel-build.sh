#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Installing TypeScript and React types..."
npm install --save-dev typescript@5.8.3 @types/react@19.1.4 @types/node@22.15.17 @types/react-dom@19.1.5

# Verify TypeScript and React types were installed
if [ ! -d "node_modules/typescript" ] || [ ! -d "node_modules/@types/react" ]; then
  echo "Failed to install TypeScript or React types. Checking node_modules content:"
  ls -la node_modules/typescript node_modules/@types/react 2>/dev/null || echo "Packages not found"
  exit 1
fi

echo "Running Next.js build..."
NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS='--max-old-space-size=4096' npx next build --no-lint 