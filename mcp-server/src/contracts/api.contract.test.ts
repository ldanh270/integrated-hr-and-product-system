import assert from 'node:assert/strict'
import test from 'node:test'

import { errorResponse, normalizeApiError, successResponse } from './api.contract.js'

test('creates the stable success envelope', () => {
  assert.deepEqual(successResponse({ id: 'emp-1' }, { page: 1 }), {
    data: { id: 'emp-1' },
    error: null,
    meta: { page: 1 },
  })
})

test('normalizes backend nested errors without losing details', () => {
  assert.deepEqual(normalizeApiError({ error: { code: 'VALIDATION_ERROR', message: 'Invalid date', details: { field: 'startDate' } } }, 'fallback', 'HTTP_400'), {
    code: 'VALIDATION_ERROR',
    message: 'Invalid date',
    details: { field: 'startDate' },
  })
})

test('creates an error envelope with null data', () => {
  assert.deepEqual(errorResponse({ code: 'NOT_FOUND', message: 'Employee not found' }), {
    data: null,
    error: { code: 'NOT_FOUND', message: 'Employee not found' },
    meta: null,
  })
})
