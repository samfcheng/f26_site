/**
 * Lets a badge image sway a little when the page is scrolled or it is tapped:
 * a damped spring around a resting angle, settling to rest. The loop only
 * runs while it is moving; reduced motion holds it at rest.
 *
 * `rest` is the resting angle in degrees, or a function of scroll position.
 * `stiffness` sets the swing period: a long lanyard swings slower than a
 * badge pinned at its top hole.
 *
 * @param {HTMLElement} node
 * @param {{ rest?: number | (() => number), stiffness?: number, scroll?: number, tap?: number }} options
 */
export function sway(node, { rest = 0, stiffness = 90, scroll: scrollForce = .35, tap: tapForce = 28 } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const resting = typeof rest === 'function' ? rest : () => rest;
  let angle = 0, velocity = 0, lastY = scrollY, lastTime = 0, frame;
  const draw = () => { node.style.transform = `rotate(${(resting() + (reduced.matches ? 0 : angle)).toFixed(3)}deg)`; };
  const tick = time => {
    const dt = Math.min((time - (lastTime || time)) / 1000, .032);
    lastTime = time;
    velocity += (-stiffness * angle - 5 * velocity) * dt;
    angle += velocity * dt;
    draw();
    if (Math.abs(angle) < .01 && Math.abs(velocity) < .01) { angle = velocity = 0; frame = undefined; lastTime = 0; draw(); return; }
    frame = requestAnimationFrame(tick);
  };
  const kick = impulse => {
    if (reduced.matches) return;
    velocity = Math.max(-40, Math.min(40, velocity + impulse));
    frame ??= requestAnimationFrame(tick);
  };
  const scroll = () => {
    const delta = scrollY - lastY;
    lastY = scrollY;
    if (scrollY < innerHeight) kick(-delta * scrollForce);
    else if (frame === undefined) draw();
  };
  const tap = () => kick(tapForce);
  node.addEventListener('pointerdown', tap);
  window.addEventListener('scroll', scroll, { passive: true });
  reduced.addEventListener('change', draw);
  draw();
  return {
    destroy() {
      node.removeEventListener('pointerdown', tap);
      window.removeEventListener('scroll', scroll);
      reduced.removeEventListener('change', draw);
      if (frame !== undefined) cancelAnimationFrame(frame);
    }
  };
}
