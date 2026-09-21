# Compatibility entry only. Requires Node.js, not PowerShell 7.
# Use the Node runner's --kebab-case arguments; old -Mode/-Profile flags are gone.
$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'run-loop.mjs') @args
exit $LASTEXITCODE
