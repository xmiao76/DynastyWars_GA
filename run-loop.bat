@echo off
setlocal EnableExtensions
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the project-supported Node version first.
  exit /b 1
)
node "%~dp0scripts\run-loop.mjs" %*
exit /b %ERRORLEVEL%
