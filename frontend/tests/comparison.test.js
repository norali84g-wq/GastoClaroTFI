import assert from 'node:assert/strict';
import { test } from 'vitest';
import { effectSegments, relativeChange } from '../src/domain/comparison.js';

test('the signed bar uses the same scale on both sides of zero', () => {
  assert.deepEqual(effectSegments(['-30.00', '20.00', '-10.00']), [
    { start: 12.5, width: 37.5 },
    { start: 50, width: 25 },
    { start: 0, width: 12.5 },
  ]);
  assert.deepEqual(
    effectSegments(['0.00', '0.00', '0.00']),
    Array(3).fill({ start: 50, width: 0 }),
  );
  const [oneCent, twoCents] = effectSegments(['0.01', '0.02']);
  assert.ok(Math.abs(twoCents.width - 2 * oneCent.width) < 1e-9);
  assert.ok(Math.abs(twoCents.start + twoCents.width - 100) < 1e-9);
});

test('relative price changes distinguish missing prices from a real zero price', () => {
  assert.equal(relativeChange('100.00', '76.50'), -0.235);
  assert.equal(relativeChange('100.00', '0.00'), -1);
  assert.equal(relativeChange('0.00', '50.00'), null);
  assert.equal(relativeChange('50.00', null), null);
});
