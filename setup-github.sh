#!/bin/bash
# Run this from the coloc-game folder to initialize Git and create the first commit.
# Then create a new repo on https://github.com/new and push (see README "Publish to GitHub").

set -e
cd "$(dirname "$0")"

if [ -d .git ]; then
  echo "Git is already initialized in this folder."
else
  git init
  echo "Git repository initialized."
fi

git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit (no changes)."
else
  git commit -m "Initial commit: coLoc Game web app"
  echo "First commit created."
fi

echo ""
echo "Next steps:"
echo "1. Create a new repository at https://github.com/new (no README/.gitignore)."
echo "2. Run:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/coloc-game.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "   (Replace YOUR_USERNAME and repo name as needed.)"
