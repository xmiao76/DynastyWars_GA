@echo off
REM Dynasty Wars GA - owner-run Cloudflare Pages deployment.
REM Usage: deploy.bat [--check]
REM --check runs local verification only; it never invokes Wrangler.
setlocal EnableExtensions
cd /d "%~dp0"
title Dynasty Wars GA - Verify and Deploy
if not "%~2"=="" goto :usage
if not "%~1"=="" if /I not "%~1"=="--check" goto :usage

REM Fixed target: never inherit the original project's Wrangler cache or branch.
set "PAGES_PROJECT=dynasty-wars-ga"
set "PAGES_BRANCH=main"

echo [1/5] Checking dependencies...
REM Install the locked dependencies only when they are missing; an existing
REM node_modules is reused. Delete node_modules to force a clean npm ci.
if exist "node_modules" goto :deps_ready
echo node_modules not found - installing the locked dependencies...
call npm ci
if errorlevel 1 goto :fail
:deps_ready

echo [2/5] Linting...
call npm run lint
if errorlevel 1 goto :fail

echo [3/5] Type checking...
call npm run typecheck
if errorlevel 1 goto :fail

echo [4/5] Unit tests...
call npm run test
if errorlevel 1 goto :fail

echo [5/5] Building and checking the production bundle...
REM This command builds dist and runs the browser gate against that fresh build.
call npm run prodbuild
if errorlevel 1 goto :fail

if /I "%~1"=="--check" (
  echo Local checks passed. Nothing was deployed.
  exit /b 0
)

echo Deploying dist to %PAGES_PROJECT% on production branch %PAGES_BRANCH%...
REM If needed, authenticate manually with: npx wrangler@4 login
REM First deployment may prompt to create this project. Use production branch main.
call npx wrangler@4 pages deploy dist --project-name=%PAGES_PROJECT% --branch=%PAGES_BRANCH%
if errorlevel 1 goto :deployfail

echo Deployed. Intended URL: https://dynasty-wars-ga.pages.dev/
exit /b 0

:usage
echo Usage: deploy.bat [--check]
echo This script deploys only to dynasty-wars-ga. Project overrides are not accepted.
exit /b 1

:deployfail
echo Deployment failed. Review the Wrangler output before retrying.
echo If the project does not exist, create a Pages Direct Upload project named
echo dynasty-wars-ga with production branch main, then run deploy.bat again.
exit /b 1

:fail
echo A local verification step failed. Nothing was deployed.
echo For a missing browser, run: npx playwright install chromium
exit /b 1