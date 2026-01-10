#!/bin/bash

#MISARH API Installation and Setup Script

echo "===================================="
echo "MISARH API - Setup Script"
echo "===================================="
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 2: Build shared package
echo "[2/4] Building shared types package..."
npm run build --workspace=packages/shared
if [ $? -ne 0 ]; then
    echo "❌ Failed to build shared package"
    exit 1
fi

# Step 3: Test database connection
echo "[3/4] Testing database connection..."
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Database not available. Please start Docker services first:"
    echo "    npm run docker:up"
    exit 1
fi

# Step 4: Start API server
echo "[4/4] Starting API server..."
echo ""
npm run dev:api
