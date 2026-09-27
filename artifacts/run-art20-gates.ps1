$env:PW_TEST_HTML_REPORT_OPEN = 'never'

# 1. Look specs (artfx + prior-kit regression)
node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list e2e/artfx.spec.ts e2e/hud-look.spec.ts e2e/introcard.spec.ts e2e/backdrop-look.spec.ts *> artifacts/e2e-art20-look.log
$L = $LASTEXITCODE
"LOOK=$L"

# 2. Full chromium project
if ($L -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/e2e-art20-full.log
  $E = $LASTEXITCODE
} else { $E = 99 }
"E2E=$E"

# 3. Vision (sprite gate 256/256 is the load-bearing check here)
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/vision-art20.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 4. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/selfplay-art20.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 5. Build + prodbuild
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/build-art20.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/prodbuild-art20.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

""
"--- look ---"
Select-String -Path artifacts/e2e-art20-look.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- e2e ---"
Select-String -Path artifacts/e2e-art20-full.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- vision ---"
Select-String -Path artifacts/vision-art20.log -Pattern 'passed|failed|SPRITE GATE' | Select-Object -Last 2 | ForEach-Object { $_.Line }
"--- selfplay ---"
Select-String -Path artifacts/selfplay-art20.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- build ---"
"B=$B"
"--- prodbuild ---"
Select-String -Path artifacts/prodbuild-art20.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
