#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Current directory: $(pwd)"
echo "Listing package.json:"
cat package.json

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Explicitly installing TypeScript and React types..."
npm install --save-dev typescript@5.8.3 @types/react@19.1.4 @types/node@22.15.17 @types/react-dom@19.1.5

echo "Listing node_modules directory:"
ls -la node_modules | grep -E "typescript|@types"

# Check for TypeScript and React types with more detailed output
if [ ! -d "node_modules/typescript" ]; then
  echo "TypeScript not found in node_modules"
else
  echo "TypeScript found in node_modules"
fi

if [ ! -d "node_modules/@types/react" ]; then
  echo "@types/react not found in node_modules"
  echo "Checking @types directory:"
  ls -la node_modules/@types || echo "@types directory not found"
else
  echo "@types/react found in node_modules"
fi

# Try installing again with different approach if not found
if [ ! -d "node_modules/typescript" ] || [ ! -d "node_modules/@types/react" ]; then
  echo "Retrying installation with npm ci..."
  npm ci
  
  echo "Checking again for TypeScript and React types:"
  ls -la node_modules/typescript node_modules/@types/react 2>/dev/null || echo "Packages still not found"
  
  # Continue anyway to see if Next.js can build
  echo "Continuing with build despite missing packages..."
fi

echo "Running Next.js build..."
NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS='--max-old-space-size=4096' npx next build --no-lint 