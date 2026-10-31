import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCanApplyReviewDecision,
  canApplyReviewDecision,
  getTargetStatusForReviewDecision,
  requiresRationale
} from './review-decision-policy';

test('1) REVIEWER and ADMIN can apply review decisions on UNDER_REVIEW records', () => {
  assert.equal(canApplyReviewDecision('REVIEWER', 'UNDER_REVIEW'), true);
  assert.equal(canApplyReviewDecision('ADMIN', 'UNDER_REVIEW'), true);
  assert.doesNotThrow(() => assertCanApplyReviewDecision('REVIEWER', 'UNDER_REVIEW', 'APPROVE'));
  assert.doesNotThrow(() => assertCanApplyReviewDecision('ADMIN', 'UNDER_REVIEW', 'REQUEST_CHANGES'));
});

test('2) Non-reviewer roles cannot apply review decisions', () => {
  assert.equal(canApplyReviewDecision('SUPERVISOR', 'UNDER_REVIEW'), false);
  assert.equal(canApplyReviewDecision('TECHNICIAN', 'UNDER_REVIEW'), false);
  assert.throws(() => assertCanApplyReviewDecision('SUPERVISOR', 'UNDER_REVIEW', 'APPROVE'));
});

test('3) Decisions only apply to UNDER_REVIEW records', () => {
  assert.equal(canApplyReviewDecision('REVIEWER', 'DRAFT'), false);
  assert.equal(canApplyReviewDecision('REVIEWER', 'APPROVED'), false);
  assert.throws(() => assertCanApplyReviewDecision('REVIEWER', 'DRAFT', 'REQUEST_CHANGES'));
});

test('4) Target statuses and rationale policy are consistent', () => {
  assert.equal(getTargetStatusForReviewDecision('APPROVE'), 'APPROVED');
  assert.equal(getTargetStatusForReviewDecision('REQUEST_CHANGES'), 'DRAFT');
  assert.equal(requiresRationale('APPROVE'), false);
  assert.equal(requiresRationale('REQUEST_CHANGES'), true);
});
