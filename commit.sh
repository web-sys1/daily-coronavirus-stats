#!/usr/bin/env sh

# abort on errors
set -e

# navigate into the build output directory
cd data


git init
git config user.email "github.action@example.com"
git config user.name "GitHub Action"
git add -A
git commit --author="GitHub Action <action@github.com'>" -m 'deploy'

cd -