#!/usr/bin/env node
import { formatResult, runScheduler } from './loop-schedule/service.mjs'

try {
  const result = await runScheduler(process.argv.slice(2))
  console.log(formatResult(result))
} catch (error) {
  console.error(`Scheduler: ${error.message}`)
  process.exitCode = 1
}
