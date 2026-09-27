$env:PW_TEST_HTML_REPORT_OPEN = 'never'
$ErrorActionPreference = 'Continue'

# BODY-7 serial sweep: every gate in one run, plus the byte/memory/boot
# probe against the same dev-server recipe as the BODY-1 baseline.

# 1. Lint
node node_modules/eslint/bin/eslint.js . *> artifacts/body7-lint.log
$L = $LASTEXITCODE
"LINT=$L"

# 2. Typecheck
if ($L -eq 0) {
  node node_modules/typescript/bin/tsc --noEmit *> artifacts/body7-tsc.log
  $T = $LASTEXITCODE
} else { $T = 99 }
"TSC=$T"

# 3. Unit
if ($T -eq 0) {
  node node_modules/vitest/vitest.mjs run *> artifacts/body7-unit.log
  $U = $LASTEXITCODE
} else { $U = 99 }
"UNIT=$U"

# 4. E2E (chromium project, full suite)
if ($U -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=chromium --reporter=list *> artifacts/body7-e2e.log
  $E = $LASTEXITCODE
} else { $E = 99 }
"E2E=$E"

# 5. Vision (sprite gate, Canvas + WebGL parity)
if ($E -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=vision --workers=1 --reporter=list *> artifacts/body7-vision.log
  $V = $LASTEXITCODE
} else { $V = 99 }
"VISION=$V"

# 6. Selfplay
if ($V -eq 0) {
  node node_modules/@playwright/test/cli.js test --project=selfplay --reporter=list *> artifacts/body7-selfplay.log
  $S = $LASTEXITCODE
} else { $S = 99 }
"SELFPLAY=$S"

# 7. Build
if ($S -eq 0) {
  node node_modules/vite/bin/vite.js build *> artifacts/body7-build.log
  $B = $LASTEXITCODE
} else { $B = 99 }
"BUILD=$B"

# 8. Prodbuild
if ($B -eq 0) {
  node node_modules/@playwright/test/cli.js test --config=playwright.prodbuild.config.ts --reporter=list *> artifacts/body7-prodbuild.log
  $P = $LASTEXITCODE
} else { $P = 99 }
"PRODBUILD=$P"

# 9. Byte + decode-memory + boot probe (same recipe as the BODY-1 baseline).
if ($P -eq 0) {
  $job = Start-Job -ScriptBlock { Set-Location C:\GitHub\DynastyWars_GA; npm run dev -- --port 5199 --strictPort *> $null }
  Start-Sleep 6
  node artifacts/body-baseline-mem.cjs *> artifacts/body7-mem.log
  $M = $LASTEXITCODE
  Stop-Job $job; Remove-Job $job -Force
} else { $M = 99 }
"MEM=$M"

""
"--- summaries ---"
"lint:    $(Select-String -Path artifacts/body7-lint.log -Pattern 'problem' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"unit:    $(Select-String -Path artifacts/body7-unit.log -Pattern 'Tests ' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"e2e:     $(Select-String -Path artifacts/body7-e2e.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"vision:  $(Select-String -Path artifacts/body7-vision.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"selfplay:$(Select-String -Path artifacts/body7-selfplay.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"prodbuild: $(Select-String -Path artifacts/body7-prodbuild.log -Pattern 'passed|failed' | Select-Object -Last 1 | ForEach-Object { $_.Line })"
"mem/boot:"
Get-Content artifacts/body7-mem.log -Tail 20
