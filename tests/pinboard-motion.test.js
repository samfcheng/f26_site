import test from 'node:test';
import assert from 'node:assert/strict';
import { freezeAnimations, captureCardState } from '../src/lib/explorations/pinboard-motion.js';

test('interrupted animations hold the displayed pose after cancellation and before the return flight', t => {
  const displayed = { transform: 'matrix(0.8, 0, 0, 0.8, 60, 20)', boxShadow: '0px 20px 40px black' };
  const baseline = { transform: 'none', boxShadow: 'none' };
  let running = true;
  const element = {
    style: {},
    getAnimations: () => [{ cancel() { running = false; } }]
  };
  // Model the live computed style: cancellation immediately exposes baseline.
  const original = globalThis.getComputedStyle;
  t.after(() => {
    if (original) globalThis.getComputedStyle = original;
    else delete globalThis.getComputedStyle;
  });
  globalThis.getComputedStyle = () => new Proxy({}, {
    get: (_, key) => element.style[key] ?? (running ? displayed[key] : baseline[key])
  });
  const from = freezeAnimations(element, ['transform', 'boxShadow']);
  assert.equal(running, false);
  assert.deepEqual(from, displayed);
  assert.deepEqual(element.style, displayed);
  assert.equal(getComputedStyle(element).transform, displayed.transform);
});

test('lightbox restoration saves intended dimming and pin state independently of displayed fade', () => {
  const body = {
    target: { x: -150, y: 90, angle: -5, scale: .7 },
    dimmed: true, keepUp: false
  };
  const saved = captureCardState(body);
  body.target.x = 400;
  body.dimmed = false;
  body.keepUp = true;
  assert.deepEqual(saved, {
    target: { x: -150, y: 90, angle: -5, scale: .7 },
    dimmed: true, keepUp: false
  });
});
