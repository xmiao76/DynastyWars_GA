$env:PW_TEST_HTML_REPORT_OPEN = 'never'

# 1. Look specs (backdrop + prior-kit regression)
node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list e2e/backdrop-look.spec.ts e2e/hud-look.spec.ts e2e/introcard.spec.ts *> artifacts/e2e-ui19-look.log
$L = $LASTEXITCODE
"LOOK=$L"

# 2. Objective pixel reviews (backdrop + HUD regression)
node artifacts/ui19-review.mjs *> artifacts/ui19-review-gate.log
$R1 = $LASTEXITCODE
node artifacts/ui4-review.mjs *> artifacts/ui19-hudreg.log
$R2 = $LASTEXITCODE
"REVIEW=$R1/$R2"

# 3. Unit suite
node node_modules/vitest/vitest.mjs run *> artifacts/unit-ui19.log
$U = $LASTEXITCODE
"UNIT=$U"

# 4. Full chromium project
if ($L -eq 0 -and $U -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/e2e-ui19-full.log
  $E = $LASTEXITCODE
} else { $E = 99 }
"E2E=$E"

# 5. Vision
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/vision-ui19.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 6. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/selfplay-ui19.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 7. Build + prodbuild
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/build-ui19.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/prodbuild-ui19.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

""
"--- look ---"
Select-String -Path artifacts/e2e-ui19-look.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- reviews ---"
Get-Content artifacts/ui19-review-gate.log -Tail 1
Get-Content artifacts/ui19-hudreg.log -Tail 1
"--- unit ---"
Select-String -Path artifacts/unit-ui19.log -Pattern 'Tests ' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- e2e ---"
Select-String -Path artifacts/e2e-ui19-full.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- vision ---"
Select-String -Path artifacts/vision-ui19.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- selfplay ---"
Select-String -Path artifacts/selfplay-ui19.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- build ---"
Select-String -Path artifacts/build-ui19.log -Pattern 'built in|error' | Select-Object -Last 1 | ForEach-Object { $_.Line }
"--- prodbuild ---"
Select-String -Path artifacts/prodbuild-ui19.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line }
