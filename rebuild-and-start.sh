#!/bin/bash

echo "🚀 Rebuilding and starting BCS Scheduler with initial scripts..."
echo ""

echo "📦 Building backend image..."
docker-compose build backend

echo ""
echo "🔄 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "📋 Checking backend logs for script import..."
docker-compose logs backend | grep -A 30 "Importing initial scripts" || echo "Import logs not found yet. Check logs with: docker-compose logs backend"

echo ""
echo "✅ Done! Services are starting..."
echo ""
echo "🌐 Open your browser:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:8001/docs"
echo ""
echo "📊 Check status: docker-compose ps"
echo "📜 View logs: docker-compose logs -f backend"
