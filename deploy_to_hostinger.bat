@echo off
echo ========================================================
echo   StayFlow SaaS - Automated Hostinger Deploy Script
echo ========================================================
echo.

echo [1/3] Building latest React frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Aborting deploy.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Copying production build to backend/public...
powershell -Command "Remove-Item -Path 'backend\public\assets' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist\index.html' -Destination 'backend\public\index.html' -Force; Copy-Item -Path 'dist\assets' -Destination 'backend\public\assets' -Recurse -Force"
echo ✅ Sync complete.

echo.
echo [3/3] Connecting to Hostinger SSH & running git pull + artisan migrate...
echo.
ssh -i "C:\Users\Msi\.ssh\sinarerp_hostinger_codex_ed25519" -p 65002 u330327941@46.202.138.60 "cd public_html && git pull origin stay && php artisan migrate --force"

echo.
echo ========================================================
echo   Deployment Process Completed!
echo ========================================================
pause
