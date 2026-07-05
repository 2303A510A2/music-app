# My Music App - PowerShell Startup Script
# For Windows PowerShell users

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "   MY MUSIC APP - STARTUP" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking for Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""
Write-Host "✓ Installation complete!" -ForegroundColor Green
Write-Host ""

# Start server
Write-Host "======================================" -ForegroundColor Green
Write-Host "   Starting Server..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
