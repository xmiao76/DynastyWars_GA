// Offline: run only a COPY of deploy.bat with fake npm/npx; never call Cloudflare.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'deploy.bat')

test('deployment remains fixed to GA and separate from loop/build commands', () => {
  const script = readFileSync(source, 'utf8')
  assert.match(script, /set "PAGES_PROJECT=dynasty-wars-ga"/)
  assert.match(script, /set "PAGES_BRANCH=main"/)
  assert.match(script, /if \/I "%~1"=="--check" \(/)
  assert.doesNotMatch(script, /dynasty-wars-cx/)
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  for (const key of ['loop', 'build', 'test', 'signal', 'vision', 'prodbuild']) {
    assert.doesNotMatch(pkg.scripts[key], /deploy\.bat|wrangler/)
  }
})

test('Windows deployment script gates, arguments, and target (all commands stubbed)', {
  skip: process.platform !== 'win32' ? 'deploy.bat is Windows-only; static gate still tested' : false,
}, async t => {
  const parent = join(root, 'artifacts/deploy-tests')
  mkdirSync(parent, { recursive: true })
  const fixture = join(mkdtempSync(join(parent, 'ga-')), 'fixture with spaces')
  const bin = join(fixture, 'bin')
  mkdirSync(bin, { recursive: true })
  copyFileSync(source, join(fixture, 'deploy.bat'))
  const callsPath = join(fixture, 'calls.log')
  writeFileSync(join(bin, 'npm.cmd'), '@echo off\r\necho npm %*>> "%DW_DEPLOY_TEST_LOG%"\r\nif "%DW_DEPLOY_TEST_FAIL%"=="%*" exit /b 9\r\nexit /b 0\r\n')
  writeFileSync(join(bin, 'npx.cmd'), '@echo off\r\necho npx %*>> "%DW_DEPLOY_TEST_LOG%"\r\nexit /b 0\r\n')
  const cases = [
    ['check never deploys', '--check', '', 0, 5],
    ['fixed GA project and main branch', '', '', 0, 6],
    ['project override rejected', 'dynasty-wars-cx', '', 1, 0],
    ['extra argument rejected', '--check extra', '', 1, 0],
    ...['ci', 'run lint', 'run typecheck', 'run test', 'run prodbuild']
      .map((step, i) => [`failed ${step} prevents deployment`, '', step, 1, i + 1]),
  ]
  for (const [name, args, fail, status, count] of cases) {
    await t.test(name, () => {
      writeFileSync(callsPath, '')
      const log = join(fixture, 'console.log')
      const fd = openSync(log, 'w')
      let result
      try {
        // Fixed script/arguments only; user input is never interpolated into cmd.
        result = spawnSync(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe',
          ['/d', '/s', '/c', `call "${join(fixture, 'deploy.bat')}" ${args}`], {
            cwd: fixture,
            env: { ...process.env, PATH: `${bin};${process.env.PATH}`, DW_DEPLOY_TEST_LOG: callsPath, DW_DEPLOY_TEST_FAIL: fail },
            stdio: ['ignore', fd, fd], windowsVerbatimArguments: true, timeout: 30_000,
          })
      } finally { closeSync(fd) }
      if (result.error) throw result.error
      assert.equal(result.status, status, readFileSync(log, 'utf8'))
      const calls = readFileSync(callsPath, 'utf8').trim().split(/\r?\n/).filter(Boolean)
      assert.equal(calls.length, count, calls.join('\n'))
      if (args === '--check' || status !== 0) assert.ok(!calls.some(line => line.startsWith('npx ')))
      if (count === 6) assert.equal(calls.at(-1), 'npx wrangler@4 pages deploy dist --project-name=dynasty-wars-ga --branch=main')
    })
  }
})
