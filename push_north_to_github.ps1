# ============================================================
#  push_north_to_github.ps1
#  Run this in PowerShell from inside the north/ folder
# ============================================================
#
#  BEFORE RUNNING:
#  1. Install Git from https://git-scm.com/download/win
#  2. Create an EMPTY repo called "north" at:
#     https://github.com/thelifenavigator  (click New repository)
#  3. Open PowerShell, navigate here, then run this script:
#     .\push_north_to_github.ps1
# ============================================================

# Step 0 — confirm we're in the right folder
Write-Host "`n[1/6] Checking folder..." -ForegroundColor Cyan
if (-not (Test-Path "index.html")) {
    Write-Host "ERROR: index.html not found. Please cd into the north/ folder first." -ForegroundColor Red
    exit 1
}
Write-Host "OK - found index.html" -ForegroundColor Green

# Step 1 — init git
Write-Host "`n[2/6] Initialising git..." -ForegroundColor Cyan
git init
git checkout -b main 2>$null   # rename default branch to main

# Step 2 — stage all files
Write-Host "`n[3/6] Staging all files..." -ForegroundColor Cyan
git add .
git status

# Step 3 — commit
Write-Host "`n[4/6] Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial NORTH commit — live classroom added"

# Step 4 — add remote
Write-Host "`n[5/6] Adding GitHub remote..." -ForegroundColor Cyan
git remote add origin https://github.com/thelifenavigator/north.git

# Step 5 — push
Write-Host "`n[6/6] Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " DONE! Your files are now on GitHub." -ForegroundColor Green
Write-Host " Next step: Enable GitHub Pages" -ForegroundColor Yellow
Write-Host " Go to: https://github.com/thelifenavigator/north/settings/pages" -ForegroundColor Yellow
Write-Host " Set source: Deploy from branch → main → / (root) → Save" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Green
