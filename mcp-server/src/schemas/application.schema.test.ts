import assert from 'node:assert/strict'
import test from 'node:test'

import { ApplicationFormSchema } from './application.schema.js'

const cuid = 'clxxxxxxxxxxxxxxxxxxxxxxxx'

test('accepts backend-compatible WFH form with employee shift', () => {
  const result = ApplicationFormSchema.safeParse({
    type: 'work_from_home',
    startDate: '2026-08-03',
    detail: { employeeShiftId: cuid, location: 'Home' },
  })
  assert.equal(result.success, true)
})

test('requires a timestamp for forgot-card form', () => {
  const result = ApplicationFormSchema.safeParse({
    type: 'forgot_card',
    startDate: '2026-08-03',
    detail: { employeeShiftId: cuid },
  })
  assert.equal(result.success, false)
})

test('accepts recruitment form and rejects invalid quantity', () => {
  const valid = ApplicationFormSchema.safeParse({
    type: 'recruitment',
    startDate: '2026-08-03',
    detail: { positionName: 'Backend Engineer', quantity: 2 },
  })
  const invalid = ApplicationFormSchema.safeParse({
    type: 'recruitment',
    startDate: '2026-08-03',
    detail: { positionName: 'Backend Engineer', quantity: 0 },
  })
  assert.equal(valid.success, true)
  assert.equal(invalid.success, false)
})
