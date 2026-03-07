@echo off
setlocal
set "NODEJS=C:\Program Files\nodejs"
if exist "%NODEJS%\node.exe" set "PATH=%NODEJS%;%PATH%"

where node >nul 2>nul || (
  echo Node.js not found. Please install Node.js LTS.
  exit /b 1
)

where npm >nul 2>nul || (
  echo npm not found. Please install Node.js LTS.
  exit /b 1
)

echo [1/4] Installing dependencies...
call npm install || exit /b 1

echo [2/4] Running tests...
call npm test -- --run || exit /b 1

echo [3/4] Building web app...
call npm run build || exit /b 1

echo [4/4] Building desktop portable exe...
call npm run desktop:build || exit /b 1

echo.
echo Done. Open:
echo release\Chem Reaction Visualizer 0.1.0.exe
endlocal
