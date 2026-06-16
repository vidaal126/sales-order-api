#!/bin/sh
set -e
echo "Installing/updating dependencies..."
yarn install
echo "Generating Prisma client..."
npx prisma generate
echo "Running migrations..."
npx prisma migrate deploy
echo "Starting development server..."
exec yarn start:dev
