

cd "$(dirname "$0")"

if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo "Building the application..."
npm run build

echo "Deploying to Vercel..."
vercel deploy --prod

echo "Deployment complete! Check the URL above for your live site."
