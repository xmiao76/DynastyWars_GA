#requires -Version 5.1
<#
.SYNOPSIS
  Session-bound loop runner: repeats single loop iterations on a fixed delay,
  but only while this DeepSeek Harness server process is alive.

.DESCRIPTION
  Each tick runs exactly one `node scripts/run-loop.mjs --iterations 1` (the
  same single-iteration contract the OS scheduler uses) and then sleeps. Before
  every tick the script verifies the Harness server process recorded at startup
  is still the same live process (PID plus start time, so PID reuse cannot fool
  it). If the server is gone, the loop exits without starting further work.

  Nothing is registered in the OS: no scheduled task, service, or reboot
  survival. Stopping this process (or quitting the Harness) ends future ticks;
  at most one already-running iteration finishes on its own bounded timeout.

  Exit policy per tick: 0 continues; 2 (runner paused: blocked/regression)
  stops cleanly for owner review; 3 (repository busy) skips to the next tick
  and stops after 3 consecutive busy ticks; anything else stops as an error.
#>
[CmdletBinding()]
param(
  [ValidateRange(1, 1000)][int]$Iterations = 24,
  [ValidateRange(60, 86400)][int]$IntervalSeconds = 3600,
  [ValidateRange(0, 86400)][int]$DelaySeconds = 3600,
  [ValidateRange(0, 2147483647)][int]$ServerPid = 0,
  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $repoRoot 'scripts\run-loop.mjs'
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "Loop runner not found: $runner" }
$node = (Get-Command node.exe -ErrorAction Stop).Source

function Find-DshServer {
  $seen = @{}
  $id = $PID
  while ($id -gt 0 -and -not $seen.ContainsKey($id)) {
    $seen[$id] = $true
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$id"
    if ($null -eq $proc) { return $null }
    if (($proc.Name -eq 'node.exe' -and $proc.CommandLine -like '*dsh*') -or ($proc.Name -like 'dsh*')) { return $proc }
    $id = $proc.ParentProcessId
  }
  return $null
}

if ($ServerPid -gt 0) {
  $explicit = Get-Process -Id $ServerPid -ErrorAction Stop
  $script:serverPid = $explicit.Id
  $script:serverName = $explicit.ProcessName
  $script:serverStart = $explicit.StartTime
} else {
  $server = Find-DshServer
  if ($null -eq $server) { throw 'Refusing to start: no DeepSeek Harness server ancestor found, so loop lifetime cannot be bound to the session. Pass -ServerPid explicitly if the server runs outside this process tree.' }
  $script:serverPid = $server.ProcessId
  $script:serverName = $server.Name -replace '\.exe$', ''
  # Get-CimInstance already returns a datetime; convert only legacy DMTF strings.
  $created = $server.CreationDate
  if ($created -is [string]) { $created = [Management.ManagementDateTimeConverter]::ToDateTime($created) }
  $script:serverStart = $created
}

function Test-ServerAlive {
  try {
    $p = Get-Process -Id $script:serverPid -ErrorAction Stop
    if ($p.ProcessName -ne $script:serverName) { return $false }
    return [Math]::Abs(($p.StartTime - $script:serverStart).TotalSeconds) -lt 2
  } catch {
    return $false
  }
}

Write-Output "Session-bound loop watching PID $($script:serverPid) ($($script:serverName)) started $($script:serverStart.ToString('o'))."
Write-Output "Runner: $runner"
if ($ValidateOnly) { exit 0 }
if (-not (Test-ServerAlive)) { throw 'Session server is not alive at startup; refusing to run unguarded.' }

$busyStreak = 0
for ($i = 1; $i -le $Iterations; $i++) {
  $wait = if ($i -eq 1) { $DelaySeconds } else { $IntervalSeconds }
  if ($wait -gt 0) {
    Write-Output "Waiting $wait seconds before iteration $i/$Iterations (session-bound; quitting the Harness ends the loop)."
    Start-Sleep -Seconds $wait
  }
  if (-not (Test-ServerAlive)) { Write-Output 'Harness server process is gone; session loop ends with no further runs.'; exit 0 }
  Write-Output "Session iteration $i/$Iterations."
  & $node $runner --iterations 1
  $code = $LASTEXITCODE
  if ($code -eq 0) { $busyStreak = 0; continue }
  if ($code -eq 2) { Write-Output 'Runner paused (blocked/regression). Session loop stops for owner review.'; exit 0 }
  if ($code -eq 3) {
    $busyStreak++
    if ($busyStreak -ge 3) { Write-Error 'Repository lock busy for 3 ticks in a row. Stopping session loop.'; exit 1 }
    Write-Output 'Repository busy; skipping to the next tick.'
    continue
  }
  Write-Error "Runner failed with exit $code. Session loop stops."; exit 1
}
Write-Output 'Session loop completed all iterations.'
