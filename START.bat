@echo off
echo.
echo ======================================
echo My Music App - Startup Script
echo ======================================
echo.
echo Step 1: Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo Dependencies installed successfully!
echo.
echo Step 2: Starting the server...
echo.
echo Server will run on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
call npm start
pause
