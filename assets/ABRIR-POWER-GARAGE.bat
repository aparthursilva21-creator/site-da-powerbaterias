@echo off
cd /d "%~dp0"
where node >nul 2>&1
if %errorlevel% neq 0 (
 echo [ERRO] Node.js nao encontrado.
 echo Instale o Node.js LTS em https://nodejs.org/
 pause
 exit /b 1
)
start "" "http://127.0.0.1:8787/power-garage.html"
node servidor.mjs
pause
