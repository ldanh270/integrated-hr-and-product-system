import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BACKEND_MODULE_CONTRACTS,
  CURRENT_MCP_TOOL_COUNT,
  CURRENT_MCP_TOOL_COUNTS,
} from './backend-coverage.manifest.js'

test('covers every backend route module exactly once', () => {
  assert.equal(BACKEND_MODULE_CONTRACTS.length, 32)

  const routeFiles = BACKEND_MODULE_CONTRACTS.map((contract) => contract.routeFile)
  const mounts = BACKEND_MODULE_CONTRACTS.map((contract) => contract.mount)

  assert.equal(new Set(routeFiles).size, routeFiles.length)
  assert.equal(new Set(mounts).size, mounts.length)
  assert.equal(BACKEND_MODULE_CONTRACTS.filter(({ status }) => status === 'exclude').length, 1)
  assert.equal(BACKEND_MODULE_CONTRACTS.find(({ mcpGroup }) => mcpGroup === 'debug')?.wave, 'never')
})

test('baseline tool inventory is explicit and internally consistent', () => {
  assert.deepEqual(Object.keys(CURRENT_MCP_TOOL_COUNTS).sort(), [
    'application',
    'approval',
    'attendance',
    'auth',
    'employee',
    'employee-contract',
    'holiday',
    'part-time-availability',
    'payroll',
    'profile',
    'project',
    'regime-category',
    'schedule',
    'shift',
    'shift-change',
    'weekly-template',
  ])
  assert.equal(CURRENT_MCP_TOOL_COUNT, 116)
})

test('every baseline MCP group has a backend contract', () => {
  const backendGroups = new Set(BACKEND_MODULE_CONTRACTS.map(({ mcpGroup }) => mcpGroup))

  for (const group of Object.keys(CURRENT_MCP_TOOL_COUNTS) as Array<keyof typeof CURRENT_MCP_TOOL_COUNTS>) {
    assert.ok(backendGroups.has(group), `missing backend contract for MCP group: ${group}`)
  }
})
