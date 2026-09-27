$env:PW_TEST_HTML_REPORT_OPEN = 'never'

# 1. Look specs (intro card + HUD kit regression)
node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list e2e/introcard.spec.ts e2e/hud-look.spec.ts *> artifacts/e2e-ui5-look.log
$L = $LASTEXITCODE
"LOOK=$L"

# 2. Objective pixel review of the HUD captures (regression)
node artifacts/ui4-review.mjs *> artifacts/ui5-review.log
$R = $LASTEXITCODE
"REVIEW=$R"

# 3. Full chromium project
if ($L -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/e2e-ui5-full.log
  $E = $LASTEXITCODE
} else { $E = 99 }
"E2E=$E"

# 4. Vision
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/vision-ui5.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 5. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/selfplay-ui5.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 6. Production build + prodbuild
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/build-ui5.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/prodbuild-ui5.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

""
"--- look ---"
Select-String -Path artifacts/e2e-ui5-look.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- hud pixel review ---"
Get-Content artifacts/ui5-review.log -Tail 2
"--- e2e ---"
Select-String -Path artifacts/e2e-ui5-full.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- vision ---"
Select-String -Path artifacts/vision-ui5.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- selfplay ---"
Select-String -Path artifacts/selfplay-ui5.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- build ---"
Select-String -Path artifacts/build-ui5.log -Pattern 'built in|error' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- prodbuild ---"
Select-String -Path artifacts/prodbuild-ui5.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
