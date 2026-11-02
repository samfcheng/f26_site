import test from 'node:test';
import assert from 'node:assert/strict';
import { boardSpots, edgeSides, samePose } from '../src/lib/explorations/pinboard-layout.js';

test('board grows beyond eleven cards and supports removing every card', () => {
  const items = Array.from({ length: 25 }, () => ({}));
  const spots = boardSpots(items);
  assert.equal(spots.length, 25);
  assert.ok(spots.every(spot => Object.values(spot).every(Number.isFinite)));
  assert.ok(spots[24].y > spots[10].y);
  assert.deepEqual(boardSpots([]), []);
  assert.deepEqual(boardSpots(items), spots);
  // Cards must occupy distinct, usable positions as the collection grows.
  assert.equal(new Set(spots.map(spot => `${spot.x},${spot.y}`)).size, items.length);
});

test('side allocation uses the full board and includes dragged home offsets', () => {
  const boxes = [0, 100, 200, 300].map(left => ({ left, width: 100 }));
  const homes = boxes.map(() => ({ x: 0 }));
  assert.deepEqual(edgeSides(boxes, homes), ['left', 'left', 'right', 'right']);
  homes[0].x = 500;
  assert.deepEqual(edgeSides(boxes, homes), ['right', 'left', 'left', 'right']);
});

test('unchanged targets can be skipped without swallowing scale or angle changes', () => {
  const pose = { x: 10, y: 20, angle: -4, scale: .7 };
  assert.ok(samePose(pose, { ...pose }));
  for (const key of Object.keys(pose)) assert.equal(samePose(pose, { ...pose, [key]: pose[key] + .1 }), false);
});
