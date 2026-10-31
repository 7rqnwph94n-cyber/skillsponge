import assert from 'node:assert/strict';
import test from 'node:test';
import { getReviewQueueLabel } from './review-queue-label';

test('1) queue label marks resubmission items clearly', () => {
  assert.equal(getReviewQueueLabel({ isResubmission: true }), 'Resubmission');
});

test('2) queue label defaults to first-time review when not resubmitted', () => {
  assert.equal(getReviewQueueLabel({ isResubmission: false }), 'First-time review');
  assert.equal(getReviewQueueLabel(undefined), 'First-time review');
});
