import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCanAddReviewComment, canAddReviewComment } from './review-comment-policy';

test('1) REVIEWER and ADMIN can add section comments on UNDER_REVIEW records', () => {
  assert.equal(canAddReviewComment('REVIEWER', 'UNDER_REVIEW'), true);
  assert.equal(canAddReviewComment('ADMIN', 'UNDER_REVIEW'), true);
  assert.doesNotThrow(() => assertCanAddReviewComment('REVIEWER', 'UNDER_REVIEW'));
});

test('2) Non-review roles cannot add review comments', () => {
  assert.equal(canAddReviewComment('SUPERVISOR', 'UNDER_REVIEW'), false);
  assert.throws(() => assertCanAddReviewComment('SUPERVISOR', 'UNDER_REVIEW'));
});

test('3) Comments can only be added in UNDER_REVIEW', () => {
  assert.equal(canAddReviewComment('REVIEWER', 'DRAFT'), false);
  assert.throws(() => assertCanAddReviewComment('REVIEWER', 'DRAFT'));
});
