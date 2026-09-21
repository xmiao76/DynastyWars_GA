# Compatibility entry only. Offline Node tests; no PowerShell 7 requirement.
$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'test-loop.mjs') @args
exit $LASTEXITCODE
