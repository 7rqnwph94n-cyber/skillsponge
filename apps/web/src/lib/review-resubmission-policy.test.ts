import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCanResubmitForReview, canResubmitForReview } from './review-resubmission-policy';

test('1) editor roles can resubmit DRAFT records with open requested changes', () => {
  assert.equal(canResubmitForReview('SENIOR_TECHNICIAN', 'DRAFT', true), true);
  assert.equal(canResubmitForReview('SUPERVISOR', 'DRAFT', true), true);
  assert.equal(canResubmitForReview('REVIEWER', 'DRAFT', true), true);
  assert.equal(canResubmitForReview('ADMIN', 'DRAFT', true), true);
  assert.doesNotThrow(() => assertCanResubmitForReview('SUPERVISOR', 'DRAFT', true));
});

test('2) non-editor roles cannot resubmit', () => {
  assert.equal(canResubmitForReview('TECHNICIAN', 'DRAFT', true), false);
  assert.throws(() => assertCanResubmitForReview('TECHNICIAN', 'DRAFT', true));
});

test('3) resubmission requires DRAFT status and open requested changes', () => {
  assert.equal(canResubmitForReview('ADMIN', 'UNDER_REVIEW', true), false);
  assert.equal(canResubmitForReview('ADMIN', 'DRAFT', false), false);
  assert.throws(() => assertCanResubmitForReview('ADMIN', 'UNDER_REVIEW', true));
  assert.throws(() => assertCanResubmitForReview('ADMIN', 'DRAFT', false));
});
