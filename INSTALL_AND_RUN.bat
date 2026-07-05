@echo off
REM ==============================================
REM My Music App - Automated Installer
REM ==============================================
echo.
echo ======================================
echo   MY MUSIC APP - INSTALLER
echo ======================================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org
    echo.
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

REM Check if npm is installed
echo Checking for npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: npm is not found!
    echo.
    pause
    exit /b 1
)

echo ✓ npm found
echo.

REM Install dependencies
echo Installing required packages...
echo Please wait, this may take 1-2 minutes...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo ======================================
echo ✓ Installation Complete!
echo ======================================
echo.
echo Now starting the server...
echo.
echo Server will run on: http://localhost:5000
echo.
echo In your browser, go to: http://localhost:5000
echo.
echo To stop the server, press Ctrl+C
echo.
pause

REM Start the server
npm start
