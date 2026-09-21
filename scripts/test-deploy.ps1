#requires -Version 5.1
# Compatibility entry point; the GA test suite uses Node, not PowerShell 7.
& node (Join-Path $PSScriptRoot 'test-deploy.mjs') @args
exit $LASTEXITCODE
