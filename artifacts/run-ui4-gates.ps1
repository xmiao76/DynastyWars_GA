$env:PW_TEST_HTML_REPORT_OPEN = 'never'
$cli = 'node node_modules/@playwright/test/cli.js'

# 1. Look spec (rewrites captures at correct sizes)
node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list e2e/hud-look.spec.ts *> artifacts/e2e-ui4-look2.log
$L = $LASTEXITCODE
"LOOK=$L"

# 2. Objective pixel review of the new captures
node artifacts/ui4-review.mjs *> artifacts/ui4-review2.log
$R = $LASTEXITCODE
"REVIEW=$R"

# 3. Full chromium project
if ($L -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/e2e-ui4-full2.log
  $E = $LASTEXITCODE
} else { $E = 99 }
"E2E=$E"

# 4. Vision
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/vision-ui4-2.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 5. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/selfplay-ui4-2.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 6. Production build + prodbuild
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/build-ui4-2.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/prodbuild-ui4-2.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

""
"--- look spec ---"
Select-String -Path artifacts/e2e-ui4-look2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- pixel review ---"
Get-Content artifacts/ui4-review2.log -Tail 3
"--- e2e ---"
Select-String -Path artifacts/e2e-ui4-full2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- vision ---"
Select-String -Path artifacts/vision-ui4-2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- selfplay ---"
Select-String -Path artifacts/selfplay-ui4-2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- build ---"
Select-String -Path artifacts/build-ui4-2.log -Pattern 'built in|error' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- prodbuild ---"
Select-String -Path artifacts/prodbuild-ui4-2.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
