#!/bin/bash
mkdir -p screenshots
cp "/Users/souvikkundu/.gemini/antigravity/brain/08dec005-783c-4b25-b903-37f5d4f3aa34/landing_page_unconnected_1776459544450.png" "./screenshots/landing_page.png"
cp "/Users/souvikkundu/.gemini/antigravity/brain/08dec005-783c-4b25-b903-37f5d4f3aa34/connected_dashboard_balance_1776459558962.png" "./screenshots/dashboard.png"
echo "Screenshots copied successfully!"
git add .
git commit -m "docs: add screenshots to folder"
git push
