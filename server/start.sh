#!/bin/bash

echo "🚀 Starting Hometown Delivery Backend..."
echo ""

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    cd server 2>/dev/null || {
        echo "❌ Error: Cannot find server directory"
        echo "Please run this script from the project root or server directory"
        exit 1
    }
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit server/.env and add your MongoDB Atlas URI and Stripe keys!"
    echo ""
    read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Ask if user wants to seed database
echo "Do you want to seed the database with initial data?"
echo "This will create:"
echo "  - Default users (admin, manager, driver)"
echo "  - 40 products"
echo "  - 4 sample drivers"
read -p "Seed database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run seed
    echo ""
fi

echo "✅ Starting development server..."
echo ""
echo "📝 Default Login Credentials:"
echo "   Admin:   admin / hometown123"
echo "   Manager: manager / manager456"
echo "   Driver:  driver / driver789"
echo ""
echo "🌐 Server will start at: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
