#!/usr/bin/env sh

# abort on errors
set -e

# navigate into the build output directory
cd data

git init
git add -A
git commit --author="GitHub Action <action@github.com'>" -m 'deploy'

cd -