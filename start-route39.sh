#!/bin/bash
echo "🚀 Starting Route39 Platform..."

# 1. Start Docker (MySQL & Redis)
echo "📦 Starting databases..."
docker-compose up -d

# 2. Start APIs in the background
echo "🔌 Starting backend APIs..."
npx nx serve admin-api &
npx nx serve rider-api &
npx nx serve driver-api &

# 3. Start Web Admin Panels in the background
echo "🌐 Starting web admin panels..."
npx nx serve admin-panel &
npx nx serve admin-frontend-next &

echo ""
echo "✅ Backend and Web Panels are starting in the background!"
echo "Access Admin Panel at: http://localhost:4202"
echo ""
echo "📱 To run the Mobile Apps, please open a new terminal tab and run:"
echo "Driver App: cd apps/driver-frontend && flutter run -d chrome --web-port 5001"
echo "Rider App:  cd apps/rider-frontend && flutter run -d chrome --web-port 5002"
