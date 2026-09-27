$env:PW_TEST_HTML_REPORT_OPEN = 'never'

# 1. Full chromium project (production behavior must be unchanged: empty
# body catalog, everything falls back to procedural)
node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/e2e-body2-full.log
$E = $LASTEXITCODE
"E2E=$E"

# 2. Vision (sprite gate must hold exactly: no art changed)
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/vision-body2.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 3. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/selfplay-body2.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 4. Build + prodbuild
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/build-body2.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/prodbuild-body2.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

""
"--- e2e ---"
Select-String -Path artifacts/e2e-body2-full.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- vision ---"
Select-String -Path artifacts/vision-body2.log -Pattern 'passed|failed|SPRITE GATE' | Select-Object -Last 2 | ForEach-Object { $_.Line }
"--- selfplay ---"
Select-String -Path artifacts/selfplay-body2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- build ---"
"B=$B"
"--- prodbuild ---"
Select-String -Path artifacts/prodbuild-body2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
