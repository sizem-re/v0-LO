#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Current directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

# Install TypeScript and types
echo "Installing TypeScript and React types..."
npm install --save-dev typescript@5.8.3 @types/react@19.1.4 @types/node@22.15.17 @types/react-dom@19.1.5

# Create a simple tsconfig.json that skips checking
echo "Creating minimal tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

# Run Next.js build with type checking disabled
echo "Running Next.js build with type checking disabled..."
NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS='--max-old-space-size=4096' npx next build --no-lint 