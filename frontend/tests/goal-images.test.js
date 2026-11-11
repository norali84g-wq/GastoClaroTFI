import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createClient } from '../src/api/client.js';
import {
  goalBody,
  goalImageUrl,
  monthlyGoalAmount,
  shrinkGoalImage,
} from '../src/domain/goal-images.js';

test('goal photos resolve at the API origin and reject foreign URLs', () => {
  assert.equal(
    goalImageUrl('/files/meta.webp', 'https://example.test/api/v1'),
    'https://example.test/files/meta.webp',
  );
  assert.equal(goalImageUrl('//outside.test/meta.webp', 'https://example.test/api/v1'), null);
  assert.equal(goalImageUrl(null, 'https://example.test/api/v1'), null);
});

test('monthly contribution rounds up in cents and never divides by zero', () => {
  const goal = {
    deadline: '2027-01-09',
    target_amount: '100.01',
    saved_amount: '0.00',
    progress_percentage: 0,
  };
  assert.equal(monthlyGoalAmount(goal, '2026-11-09'), 50.01);
  assert.equal(monthlyGoalAmount(goal, '2027-01-10'), 100.01);
  assert.equal(monthlyGoalAmount({ ...goal, deadline: null }, '2026-11-09'), null);
  assert.equal(monthlyGoalAmount({ ...goal, progress_percentage: 100 }, '2026-11-09'), null);
});

test('image upload and removal use multipart and preserve JSON for ordinary goal saves', async () => {
  const values = { name: 'Viaje', target_amount: 500, saved_amount: 25, deadline: null };
  const image = new File(['test'], 'meta.webp', { type: 'image/webp' });
  assert.equal(goalBody(values, null, false), values);
  const upload = goalBody(values, image, false);
  assert.equal(upload.get('image').name, 'meta.webp');
  assert.equal(upload.get('target_amount'), '500');
  assert.equal(upload.get('deadline'), '');
  assert.equal(goalBody(values, null, true).get('remove_image'), 'true');
  const request = createClient({
    baseUrl: 'https://example.test/api/v1',
    getToken: () => 'token',
    fetcher: async (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer token');
      assert.equal(options.headers['Content-Type'], undefined);
      assert.equal(options.body, upload);
      return Response.json({ image_url: '/files/meta.webp' });
    },
  });
  await request('/savings_goals', { method: 'POST', body: upload });
});

test('upload validation rejects non-images and originals over 2 MB before decoding', async () => {
  await assert.rejects(
    shrinkGoalImage(new File(['text'], 'notes.txt', { type: 'text/plain' })),
    /JPG, PNG o WebP/,
  );
  await assert.rejects(
    shrinkGoalImage(
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }),
    ),
    /hasta 2 MB/,
  );
});
