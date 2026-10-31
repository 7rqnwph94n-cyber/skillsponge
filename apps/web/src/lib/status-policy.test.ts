import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCanApplyStatusChange, canApplyStatusChange } from './status-policy';

test('1) SUPERVISOR can move DRAFT -> UNDER_REVIEW', () => {
  assert.equal(canApplyStatusChange('SUPERVISOR', 'DRAFT', 'UNDER_REVIEW'), true);
  assert.doesNotThrow(() => assertCanApplyStatusChange('SUPERVISOR', 'DRAFT', 'UNDER_REVIEW'));
});

test('2) SUPERVISOR cannot APPROVE', () => {
  assert.equal(canApplyStatusChange('SUPERVISOR', 'UNDER_REVIEW', 'APPROVED'), false);
  assert.throws(() => assertCanApplyStatusChange('SUPERVISOR', 'UNDER_REVIEW', 'APPROVED'));
});

test('3) SUPERVISOR cannot ARCHIVE approved or under-review content', () => {
  assert.equal(canApplyStatusChange('SUPERVISOR', 'UNDER_REVIEW', 'ARCHIVED'), false);
  assert.equal(canApplyStatusChange('SUPERVISOR', 'APPROVED', 'ARCHIVED'), false);
  assert.throws(() => assertCanApplyStatusChange('SUPERVISOR', 'UNDER_REVIEW', 'ARCHIVED'));
  assert.throws(() => assertCanApplyStatusChange('SUPERVISOR', 'APPROVED', 'ARCHIVED'));
});

test('4) REVIEWER can APPROVE an UNDER_REVIEW record', () => {
  assert.equal(canApplyStatusChange('REVIEWER', 'UNDER_REVIEW', 'APPROVED'), true);
  assert.doesNotThrow(() => assertCanApplyStatusChange('REVIEWER', 'UNDER_REVIEW', 'APPROVED'));
});

test('5) ADMIN can ARCHIVE where policy allows', () => {
  assert.equal(canApplyStatusChange('ADMIN', 'UNDER_REVIEW', 'ARCHIVED'), true);
  assert.equal(canApplyStatusChange('ADMIN', 'APPROVED', 'ARCHIVED'), true);
  assert.doesNotThrow(() => assertCanApplyStatusChange('ADMIN', 'UNDER_REVIEW', 'ARCHIVED'));
  assert.doesNotThrow(() => assertCanApplyStatusChange('ADMIN', 'APPROVED', 'ARCHIVED'));
});

test('6) invalid status transitions fail even for authorized roles', () => {
  assert.equal(canApplyStatusChange('REVIEWER', 'DRAFT', 'APPROVED'), false);
  assert.throws(() => assertCanApplyStatusChange('REVIEWER', 'DRAFT', 'APPROVED'));
});

test('7) crafted/forged action inputs do not bypass role restrictions', () => {
  const forgedTarget: 'APPROVED' = 'APPROVED';
  assert.equal(canApplyStatusChange('SUPERVISOR', 'DRAFT', forgedTarget), false);
  assert.throws(() => assertCanApplyStatusChange('SUPERVISOR', 'DRAFT', forgedTarget));
});
