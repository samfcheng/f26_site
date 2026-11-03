import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { categories, explorations } from '../src/lib/explorations/explorations.js';

// Missing media would pass a JS build but break the published board/lightbox.
test('every finalized exploration has media and no unused exploration assets ship', () => {
  const referenced = new Set(categories.map(category => `pins/${category.pin}.webp`));
  const categoryIds = new Set(categories.map(category => category.id));
  const root = new URL('../static/explorations/', import.meta.url);
  for (const item of explorations) {
    assert.ok(categoryIds.has(item.category), item.title);
    assert.ok(item.width > 0 && item.height > 0, item.title);
    for (const field of ['src', 'full', 'poster']) {
      assert.ok(item[field]?.startsWith('/explorations/'), `${item.title}: ${field}`);
      const path = item[field].slice('/explorations/'.length);
      referenced.add(path);
      assert.ok(statSync(new URL(path, root)).size > 0, path);
    }
  }
  const actual = readdirSync(root, { recursive: true })
    .filter(path => statSync(new URL(path, root)).isFile() && !path.startsWith('.'));
  assert.deepEqual([...referenced].sort(), actual.sort());
});
