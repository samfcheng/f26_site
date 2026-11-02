<script>
  import { flushSync } from 'svelte';
  import { freezeAnimations, captureCardState } from './pinboard-motion.js';
  import { boardSpots, cardSize, edgeSides, samePose } from './pinboard-layout.js';
  import { explorations, categories } from './explorations.js';

  // Pin spritesheets come from /prototypes/pin-render: 16 frames in a 4×4
  // grid, frame 0 pushed into the board and frame 15 pulled out. Each frame
  // is 120px around the hole the needle goes into.
  const FRAMES = 16, COLUMNS = 4, LIFTED = FRAMES - 1;
  const pinColor = Object.fromEntries(categories.map(category => [category.id, category.pin]));
  // Where the needle enters the card, from its top edge. Cards hang and
  // swing from this point; the stylesheet's transform-origin matches.
  const PIN_Y = 16;
  // A press that travels further than this is a drag, not a click.
  const DRAG_THRESHOLD = 4;
  // Same curve as --ease-in-out in the animate skill's table: on-screen
  // movement that has to read as being picked up and set down.
  const EASE_IN_OUT = 'cubic-bezier(.77,0,.175,1)';
  const easeInOut = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

  const spots = boardSpots(explorations);
  const boardHeight = Math.max(540, ...spots.map((spot, index) => spot.y + cardSize(explorations[index]).height + 24));

  let section, board, dialog, backdrop, closeButton;
  let viewer = $state(), still = $state(), full = $state();
  let cards = $state([]);
  // What each card is drawn at; the simulation writes these every frame.
  let poses = $state(spots.map(spot => ({ x: 0, y: 0, angle: spot.r, scale: 1 })));
  let frames = $state(explorations.map(() => 0));
  let pinClearance = $state(explorations.map(() => false));
  let aside = $state(explorations.map(() => false));
  let order = $state(explorations.map((_, index) => index));
  let active = $state(null);
  let locked = $state(null);
  let dragging = $state(null);
  let viewing = $state(null);
  let shown = $state(false);
  let fullReady = $state(false);

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => matchMedia('(max-width: 700px)').matches;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const raise = index => { order = [...order.filter(i => i !== index), index]; };

  // Deterministic scatter so layouts don't change between hovers.
  const jitter = (index, salt, range) => ((index * 73 + salt * 31) % 97) / 97 * range * 2 - range;

  // Pin frames tween in JS rather than CSS steps() so a lift can reverse
  // from wherever it is. Pulling out is a little slower than pushing in.
  const pinTimers = explorations.map(() => ({ to: 0 }));
  function setPin(index, to, delay = 0) {
    const timer = pinTimers[index];
    clearTimeout(timer.wait); cancelAnimationFrame(timer.frame);
    timer.to = to;
    if (reduced()) { timer.to = 0; frames[index] = 0; pinClearance[index] = false; return; }
    timer.wait = setTimeout(() => {
      const from = frames[index], start = performance.now();
      const duration = reduced() ? 0 : (to > from ? 240 : 170) * Math.abs(to - from) / LIFTED;
      const step = now => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1;
        frames[index] = Math.round(from + (to - from) * easeInOut(t));
        if (t < 1) timer.frame = requestAnimationFrame(step);
        else if (to === 0) pinClearance[index] = false;
      };
      timer.frame = requestAnimationFrame(step);
    }, delay);
  }

  // Every card is a spring toward a target pose, damped to just under
  // critical so it glides in without wobbling. A card off its pin hangs from
  // it like a pendulum, so sideways speed swings it a little: that is what
  // makes moves read as cards being carried rather than slid.
  const bodies = spots.map(spot => ({
    vx: 0, vy: 0, va: 0, vs: 0, swing: 0,
    target: { x: 0, y: 0, angle: spot.r, scale: 1 },
    home: { x: 0, y: 0, angle: spot.r },
    startAt: 0, carried: false, dimmed: false, keepUp: false, pinned: true
  }));
  let loop = null, last = 0;
  function tick(now) {
    const elapsed = Math.min(4, Math.max(.1, (now - last) / (1000 / 60)));
    const steps = Math.ceil(elapsed), dt = elapsed / steps;
    last = now;
    let moving = false;
    for (const index of explorations.keys()) {
      const body = bodies[index], pose = poses[index], target = body.target;
      // Freeze the source pose during its lightbox flight so the return
      // destination cannot drift underneath the viewer.
      if (!body.carried || (shown && viewing === index)) continue;
      const held = dragging === index, started = now >= body.startAt;
      if (held && reduced()) {
        body.swing = body.va = 0;
        pose.angle = body.home.angle;
        moving = true;
        continue;
      }
      if (started && !held) aside[index] = body.dimmed;
      for (let step = 0; step < steps; step++) {
        if (held) body.swing *= .9 ** dt;
        else if (started) {
          body.vx = (body.vx + (target.x - pose.x) * .03 * dt) * .72 ** dt;
          body.vy = (body.vy + (target.y - pose.y) * .03 * dt) * .72 ** dt;
          body.vs = (body.vs + (target.scale - pose.scale) * .05 * dt) * .7 ** dt;
          pose.x += body.vx * dt; pose.y += body.vy * dt; pose.scale += body.vs * dt;
          body.swing = Math.max(-14, Math.min(14, body.vx * 1.2));
        }
        // Held, a card hangs straight under the pin; carried, it eases to
        // its new tilt, plus whatever the motion swings in.
        const hang = (held ? 0 : started ? target.angle : pose.angle) + body.swing;
        body.va = (body.va + (hang - pose.angle) * .06 * dt) * .72 ** dt;
        pose.angle += body.va * dt;
      }
      // The pin goes in as the card arrives rather than once it has
      // completely stopped, which is a long, invisible tail of the spring.
      const arrived = !held && started && !body.pinned
        && Math.abs(target.x - pose.x) + Math.abs(target.y - pose.y) < 3
        && Math.abs(body.vx) + Math.abs(body.vy) < .3;
      if (arrived) {
        body.pinned = true;
        // Cards scattered out of the way stay unpinned until they come back.
        // While a card is open the rest wait too, and once it starts closing
        // they go back in ahead of it.
        const waiting = viewing !== null && (index === viewing || !closing);
        if (!body.keepUp && !waiting) setPin(index, 0);
      }
      const settled = !held && started
        && Math.abs(target.x - pose.x) + Math.abs(target.y - pose.y) < .4
        && Math.abs(body.vx) + Math.abs(body.vy) + Math.abs(body.va) < .04
        && Math.abs(target.angle - pose.angle) < .05 && Math.abs(target.scale - pose.scale) < .002;
      if (settled) {
        Object.assign(pose, { x: target.x, y: target.y, angle: target.angle, scale: target.scale });
        body.carried = false;
      } else moving = true;
    }
    loop = moving ? requestAnimationFrame(tick) : null;
  }
  function wake() { if (loop === null) { last = performance.now(); loop = requestAnimationFrame(tick); } }

  /** Pull the pin, then carry the card to `target` once it is out. */
  function carry(index, target, { delay = 0, dimmed = false, keepUp = false } = {}) {
    const body = bodies[index];
    // An unchanged destination must not restart a lift, delay, or washout.
    if (samePose(body.target, target) && body.dimmed === dimmed && body.keepUp === keepUp) return;
    const inFlight = body.carried;
    body.target = { ...target };
    body.dimmed = dimmed;
    body.keepUp = keepUp;
    body.pinned = false;
    if (reduced()) {
      Object.assign(poses[index], target);
      aside[index] = dimmed;
      Object.assign(body, { carried: false, pinned: true, vx: 0, vy: 0, va: 0, vs: 0, swing: 0 });
      setPin(index, 0);
      return;
    }
    if (!inFlight) {
      const alreadyUp = frames[index] === LIFTED;
      setPin(index, LIFTED, delay);
      body.startAt = performance.now() + delay + (alreadyUp ? 0 : 200);
    }
    else if (pinTimers[index].to !== LIFTED) {
      // Landing starts before the spring fully settles. If redirected during
      // reinsertion, reverse the pin without stopping the card's momentum.
      setPin(index, LIFTED);
    }
    // In flight, keep the spring velocity and the original lift schedule.
    // A category change only changes the destination.
    body.carried = true;
    wake();
  }

  // Cards drag from anywhere on them; a press that doesn't travel is a click
  // and opens the card instead.
  let press = null, pointer = null, dragged = false;
  function down(event, index) {
    // The click that follows a drag doesn't always reach the button (the
    // pointer was captured by the card), so the flag is cleared here too.
    dragged = false;
    if (event.button !== 0 || event.pointerType === 'touch' || active !== null || viewing !== null || mobile()) return;
    press = { index, x: event.clientX, y: event.clientY, id: event.pointerId };
  }
  function move(event, index) {
    if (press?.index === index && dragging === null && Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_THRESHOLD) {
      event.currentTarget.setPointerCapture(press.id);
      dragging = index;
      pointer = { x: press.x, y: press.y, time: event.timeStamp - 16 };
      raise(index);
      Object.assign(bodies[index], { swing: 0, carried: true, dimmed: false, pinned: false });
      setPin(index, LIFTED);
      wake();
    }
    if (dragging !== index) return;
    const dt = Math.max(1, event.timeStamp - pointer.time);
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    poses[index].x += dx; poses[index].y += dy;
    bodies[index].swing = Math.max(-24, Math.min(24, dx / dt * 12));
    pointer = { x: event.clientX, y: event.clientY, time: event.timeStamp };
  }
  function up(index) {
    press = null;
    if (dragging !== index) return;
    dragging = null;
    dragged = true;
    const pose = poses[index], body = bodies[index];
    // Pushing the pin back in fixes the card at roughly the angle it was
    // hanging, so a quick swing doesn't leave it sideways.
    body.home = { x: pose.x, y: pose.y, angle: Math.max(-8, Math.min(8, pose.angle)) };
    Object.assign(body, { target: { ...body.home, scale: 1 }, vx: 0, vy: 0, startAt: 0 });
    if (reduced()) {
      Object.assign(pose, body.target);
      Object.assign(body, { carried: false, pinned: true, swing: 0, va: 0, vs: 0 });
      setPin(index, 0);
    } else wake();
  }
  function clicked(index) {
    if (dragged) { dragged = false; return; }
    if (explorations[index].src) open(index);
  }
  function nudge(event, index) {
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
    if (!step || active !== null) return;
    event.preventDefault();
    const home = bodies[index].home;
    bodies[index].home = { ...home, x: home.x + step[0], y: home.y + step[1] };
    carry(index, { ...bodies[index].home, scale: 1 });
  }

  function measure() {
    return {
      width: board.offsetWidth, height: board.offsetHeight,
      // The gutter between the board and the screen edge, which the section clips.
      gutter: board.getBoundingClientRect().left - section.getBoundingClientRect().left,
      boxes: cards.map(card => ({ left: card.offsetLeft, top: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight }))
    };
  }
  // Correct for scaling about the pin when placing a card's top-left corner.
  const place = (box, left, top, scale, angle) => ({
    x: left - box.left - box.width / 2 * (1 - scale),
    y: top - box.top - PIN_Y * (1 - scale), angle, scale
  });
  function edges(indices, { width, height, gutter, boxes }, { scale = .8, show = .45, sideOf }) {
    const targets = [], sides = { left: [], right: [] };
    for (const index of indices) sides[sideOf(index)].push(index);
    for (const [side, group] of Object.entries(sides)) {
      group.sort((a, b) => boxes[a].top - boxes[b].top);
      const first = side === 'left' ? 230 : 10;
      const heights = group.map(index => boxes[index].height * scale);
      const spare = height - first - heights.reduce((sum, h) => sum + h, 0);
      const gap = Math.min(40, spare / Math.max(1, group.length));
      let y = first + Math.max(0, jitter(group[0] ?? 0, 1, 20));
      for (const [rank, index] of group.entries()) {
        const box = boxes[index], visible = show + (index % 3) * .08;
        const x = side === 'left' ? -gutter - box.width * scale * (1 - visible) : width + gutter - box.width * scale * visible;
        targets[index] = place(box, x + jitter(index, 2, 14), y, scale, (side === 'left' ? -1 : 1) * (4 + (index * 5) % 9));
        y += heights[rank] + gap + jitter(index, 3, Math.max(0, gap / 3));
      }
    }
    return targets;
  }

  /** Push cards straight away from `origin`, the way a card being picked up
      shoves its neighbours: nearer cards go further. */
  function scatter(indices, { boxes }, origin, { squash = 1 } = {}) {
    const targets = [];
    for (const index of indices) {
      const box = boxes[index], current = bodies[index].target;
      const cx = box.left + current.x + box.width / 2, cy = box.top + current.y + box.height / 2;
      const dx = cx - origin[0], dy = (cy - origin[1]) / squash, distance = Math.hypot(dx, dy) || 1;
      const ux = dx / distance, uy = dy / distance * squash;
      const push = 120 + 220 * Math.max(0, 1 - distance / 900);
      targets[index] = { ...current, x: current.x + ux * push, y: current.y + uy * push, angle: current.angle + Math.sign(dx || 1) * 5 };
    }
    return targets;
  }

  // Gather matching cards in the middle and park the rest at stable edges.
  const ASIDE_SCALE = .7, ASIDE_SHOW = .35;
  function focus(category) {
    clearTimeout(leaving);
    if (category === active || viewing !== null) return;
    active = category;
    if (mobile()) return;
    if (reduced()) {
      for (const index of explorations.keys()) carry(index, { ...bodies[index].home, scale: 1 }, {
        dimmed: category !== null && explorations[index].category !== category
      });
      return;
    }
    const layout = measure(), { width, height, gutter, boxes } = layout;
    // Keep the same left-to-right order used to assign the resting sides.
    // Home positions stay stable even while a previous hover is in flight.
    const centreX = index => boxes[index].left + bodies[index].home.x + boxes[index].width / 2;
    const chosen = category === null ? [] : [...explorations.keys()]
      .filter(index => explorations[index].category === category)
      .sort((a, b) => centreX(a) - centreX(b));
    const rest = category === null ? [] : [...explorations.keys()].filter(index => !chosen.includes(index));
    const indices = [...explorations.keys()];
    const sides = edgeSides(boxes, bodies.map(body => body.home));
    const targets = category === null ? [] : edges(indices, layout, {
      scale: ASIDE_SCALE, show: ASIDE_SHOW, sideOf: index => sides[index]
    });
    const reach = Math.max(0, ...rest.map(index => boxes[index].width * ASIDE_SCALE * (ASIDE_SHOW + .16) + 14)) - gutter;
    const room = Math.max(1, width - 2 * Math.max(60, reach + 32));
    const gap = Math.min(32, room / Math.max(1, chosen.length * 2));
    // Fit by wrapping rows rather than shrinking selected cards.
    const rows = [];
    for (const index of chosen) {
      let row = rows.at(-1);
      if (!row || row.width + gap + boxes[index].width > room) {
        row = { indices: [], width: 0, height: 0 };
        rows.push(row);
      }
      row.width += (row.indices.length ? gap : 0) + boxes[index].width;
      row.height = Math.max(row.height, boxes[index].height);
      row.indices.push(index);
    }
    const totalHeight = rows.reduce((sum, row) => sum + row.height, 0) + gap * Math.max(0, rows.length - 1);
    let top = height * .52 - totalHeight / 2;
    let chosenRank = 0;
    for (const row of rows) {
      let left = (width - row.width) / 2;
      for (const index of row.indices) {
        raise(index);
        targets[index] = place(boxes[index], left, top + (row.height - boxes[index].height) / 2, 1, chosenRank++ % 2 ? 1.5 : -1.5);
        left += boxes[index].width + gap;
      }
      top += row.height + gap;
    }
    let rank = 0;
    for (const index of explorations.keys()) {
      const isChosen = chosen.includes(index);
      const scattered = category !== null && !isChosen;
      const delay = isChosen ? 70 + chosen.indexOf(index) * 45 : rank++ * 30;
      carry(index, targets[index] ?? { ...bodies[index].home, scale: 1 }, { delay, dimmed: scattered, keepUp: scattered });
    }
  }
  // Moving between neighbouring categories shouldn't send everything home on
  // the way, so leaving one waits a beat before clearing.
  let leaving;
  function leave() {
    clearTimeout(leaving);
    if (locked === null) leaving = setTimeout(() => focus(null), 160);
  }
  function select(category) {
    locked = locked === category ? null : category;
    focus(locked);
  }
  function clearFocus() {
    locked = null;
    focus(null);
  }

  // Lightbox. Three beats: the pin comes out and the card lifts slightly off
  // the board; then it is carried to the middle of the screen, straightening
  // as it comes, while the board blurs behind it; closing reverses that and
  // the pin goes back in once the card lands, on top of the pile.
  let restore = [];
  function others(index) {
    if (mobile()) return;
    const layout = measure();
    const boardRect = board.getBoundingClientRect();
    // Include the live category/drag transforms, rather than the original
    // CSS position, when locating the card that causes the scatter.
    const centres = cards.map(card => {
      const rect = card.getBoundingClientRect();
      return [rect.left - boardRect.left + rect.width / 2, rect.top - boardRect.top + rect.height / 2];
    });
    const [ox, oy] = centres[index];
    const rest = [...explorations.keys()].filter(i => i !== index);
    restore = rest.map(i => [i, captureCardState(bodies[i])]);
    // Nearer cards get shoved further, like a ripple from the one picked up.
    const targets = scatter(rest, layout, [ox, oy], { squash: .7 });
    for (const i of rest) carry(i, targets[i], { delay: Math.round(Math.hypot(...centres[i].map((v, axis) => v - [ox, oy][axis])) / 12) });
  }

  function settleOthers() {
    const moved = restore.map(([i]) => i);
    for (const [i, state] of restore) carry(i, state.target, { dimmed: state.dimmed, keepUp: state.keepUp });
    restore = [];
    return moved;
  }
  /** Resolves once every card in `indices` is within `distance` of home (or
      has landed, with no distance), or after `limit` ms either way. */
  function nearlyHome(indices, limit, distance = 0) {
    const start = performance.now();
    return new Promise(resolve => {
      const check = now => {
        const near = indices.every(i => bodies[i].pinned
          || Math.abs(bodies[i].target.x - poses[i].x) + Math.abs(bodies[i].target.y - poses[i].y) < distance);
        if (near || now - start > limit) resolve(); else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  function cardTransform(index) {
    const media = cards[index].querySelector('.media');
    const from = media.getBoundingClientRect(), to = viewer.getBoundingClientRect();
    const flat = mobile(), pose = poses[index];
    const scale = media.offsetWidth * (flat ? 1 : pose.scale * lifting(index)) / to.width;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) rotate(${flat ? 0 : pose.angle}deg) scale(${scale})`;
  }
  const SMALL = shadow(0), LARGE = '0 40px 90px -30px rgb(0 0 0 / .35)';
  async function open(index) {
    if (viewing !== null || dragging !== null) return;
    clearTimeout(leaving);
    raise(index);
    viewing = index;
    const motion = !reduced();
    if (motion) {
      pinClearance[index] = true;
      setPin(index, LIFTED);
      others(index);
      await wait(200);
    }
    fullReady = false;
    shown = true;
    flushSync();
    // Start the flight on the exact frame the card is showing, then hand
    // over to the full-size video once it can play from the same moment.
    const source = cards[index].querySelector('video');
    if (source && still) {
      still.width = source.videoWidth; still.height = source.videoHeight;
      still.getContext('2d').drawImage(source, 0, 0);
      if (full) full.currentTime = source.currentTime;
    }
    dialog.showModal();
    [backdrop, closeButton].forEach(element => {
      element.getAnimations().forEach(animation => animation.cancel());
      element.style.opacity = '';
      element.style.transform = '';
    });
    if (!motion) return;
    viewer.animate([{ transform: cardTransform(index), boxShadow: SMALL }, { transform: 'none', boxShadow: LARGE }],
      { duration: 520, easing: EASE_IN_OUT, fill: 'backwards' });
    // The backdrop holds off a beat so the board's own movement reads first.
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 440, delay: 140, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
    closeButton.animate([{ opacity: 0, transform: 'scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 420, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
  }
  let closing = false;
  async function close() {
    if (viewing === null || closing || !shown) return;
    const index = viewing;
    closing = true;
    const source = cards[index].querySelector('video');
    if (source && full) source.currentTime = full.currentTime;
    const moved = settleOthers();
    if (!reduced()) {
      // Reverse from what is actually on screen, even if opening is unfinished.
      const currentViewer = freezeAnimations(viewer, ['transform', 'boxShadow']);
      const currentBackdrop = freezeAnimations(backdrop, ['opacity']);
      const currentButton = freezeAnimations(closeButton, ['opacity', 'transform']);
      // Return the image and the rest of the board together immediately.
      // The open card is still pinned last after its return flight.
      closeButton.animate([{ opacity: currentButton.opacity }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
      backdrop.animate([{ opacity: currentBackdrop.opacity }, { opacity: 0 }], { duration: 520, easing: EASE_IN_OUT, fill: 'forwards' });
      await viewer.animate([currentViewer, { transform: cardTransform(index), boxShadow: SMALL }],
        { duration: 460, easing: EASE_IN_OUT, fill: 'forwards' }).finished;
    }
    dialog.close();
    shown = false;
    viewing = null;
    closing = false;
    wake();
    // Anything that landed while the card was open is still unpinned; the
    // open card's own pin goes in last.
    for (const i of explorations.keys()) if (i !== index && !bodies[i].carried && dragging !== i && !bodies[i].keepUp) setPin(i, 0);
    await nearlyHome(moved, 500);
    setPin(index, 0, 60);
  }

  // A card comes off the board with its pin, so how far the pin is out is
  // how far the card is lifted: it grows a little toward the viewer and its
  // shadow drops away, larger, softer and lighter, down-right from the key
  // light. Both follow the pin frame by frame rather than switching on.
  const LIFT_SCALE = .03;
  const lifting = index => 1 + LIFT_SCALE * frames[index] / LIFTED;
  function shadow(frame) {
    const t = frame / LIFTED;
    return `0 ${1 + t}px ${2 + 2 * t}px rgb(0 0 0 / ${.08 - .04 * t}), ${3 + 9 * t}px ${10 + 22 * t}px ${22 + 34 * t}px ${-12 - 6 * t}px rgb(0 0 0 / ${.28 - .06 * t})`;
  }
  function sprite(frame) {
    const column = frame % COLUMNS, row = Math.floor(frame / COLUMNS), rows = Math.ceil(FRAMES / COLUMNS);
    return `${column / (COLUMNS - 1) * 100}% ${row / (rows - 1) * 100}%`;
  }
  const kind = item => item.height > item.width * 1.1 ? 'portrait' : item.width > item.height * 1.1 ? 'landscape' : 'square';

  $effect(() => () => {
    cancelAnimationFrame(loop); clearTimeout(leaving);
    pinTimers.forEach(timer => { clearTimeout(timer.wait); cancelAnimationFrame(timer.frame); });
  });
</script>

<svelte:window onkeydown={event => { if (event.key === 'Escape' && viewing === null) clearFocus(); }} />

<section aria-labelledby="explorations-title" bind:this={section}>
  <div class="head">
    <h2 id="explorations-title">Explorations</h2>
    <p>
      <span class="intro">Lately I've been exploring</span>
      {#each categories as category, index}
        <!-- Hover previews; clicking locks the category until toggled or cleared. -->
        <button type="button" class="category" class:on={active === category.id} class:off={active !== null && active !== category.id}
          aria-pressed={locked === category.id}
          onpointerenter={event => { if (locked === null && event.pointerType === 'mouse' && matchMedia('(hover: hover) and (pointer: fine)').matches) focus(category.id); }}
          onpointerleave={event => { if (event.pointerType === 'mouse') leave(); }}
          onblur={leave}
          onclick={() => select(category.id)}><span class="category-pill {category.pin}">{category.label}</span></button>{index < categories.length - 2 ? ', ' : index === categories.length - 2 ? ', and ' : '.'}{#if index === 0}<br />{/if}
      {/each}
    </p>
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions (Escape does the same from the keyboard) -->
  <ul class="board" class:focused={active !== null} style:--board-height="{boardHeight}px" bind:this={board} onclick={event => { if (event.target === board) clearFocus(); }}>
    {#each explorations as item, index}
      {@const spot = spots[index]}
      {@const pose = poses[index]}
      <li class="card {kind(item)}" bind:this={cards[index]}
        class:aside={aside[index]} class:hidden={active !== null && item.category !== active}
        class:held={dragging === index} class:viewing={shown && viewing === index}
        style:left="{spot.x}%" style:top="{spot.y}px" style:z-index={order.indexOf(index) + 1}
        style:transform="translate({pose.x}px, {pose.y}px) rotate({pose.angle}deg) scale({pose.scale * lifting(index)})"
        onpointerdown={event => down(event, index)} onpointermove={event => move(event, index)}
        onpointerup={() => up(index)} onpointercancel={() => up(index)}>
        <button type="button" class="media" class:placeholder={!item.src} aria-label={item.src ? `View ${item.title}` : 'Placeholder'}
          style:box-shadow={shadow(frames[index])} onclick={() => clicked(index)} onkeydown={event => nudge(event, index)} style:aspect-ratio="{item.width} / {item.height}">
          {#if item.src}
            <video src={item.src} poster={item.poster} autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>
          {:else}
            <span>Placeholder</span>
          {/if}
        </button>
        <span class="pin" style:transform="translateY({pinClearance[index] ? -20 * frames[index] / LIFTED : 0}px)" style:--pin-lift={frames[index] / LIFTED} aria-hidden="true" style:background-image="url(/explorations/pins/{pinColor[item.category]}.webp)" style:background-position={sprite(frames[index])}></span>
      </li>
    {/each}
  </ul>
</section>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions (Escape and the close button cover the keyboard) -->
<dialog bind:this={dialog} aria-label={viewing === null ? undefined : explorations[viewing].title}
  oncancel={event => { event.preventDefault(); close(); }} onclick={close}>
  <div class="backdrop" bind:this={backdrop}></div>
  {#if shown && viewing !== null}
    {@const item = explorations[viewing]}
    <div class="viewer" bind:this={viewer} style:aspect-ratio="{item.width} / {item.height}" style:--ratio={item.width / item.height}>
      <canvas bind:this={still} aria-hidden="true"></canvas>
      <video bind:this={full} class:ready={fullReady} src={item.full} autoplay muted loop playsinline onplaying={() => { fullReady = true; }}></video>
    </div>
  {/if}
  <button type="button" class="close" bind:this={closeButton} aria-label="Close">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
</dialog>

<style>
  section{position:relative;padding:56px var(--page-gutter) 32px;background:#fff;overflow:clip}
  .head{position:relative;z-index:30;width:440px;max-width:100%;pointer-events:none}
  h2{font-size:48px;line-height:1.2;letter-spacing:-.02em;margin-bottom:16px}
  p{font-size:16px;line-height:1.65;letter-spacing:-.02em}
  .category{display:inline-block;position:relative;pointer-events:auto;padding:4px 3px;margin:-4px -3px;border:0;background:none;color:inherit;font:inherit;line-height:1.2;border-radius:999px;white-space:nowrap;cursor:pointer}
  .category-pill{display:inline-block;padding:1px 9px 2px;border-radius:999px;color:#fff;pointer-events:none;transform-origin:center;transition:transform 180ms var(--ease-out),opacity 180ms ease}
  .category-pill.blue{background:#1400ff}.category-pill.orange{background:#f3742b}.category-pill.pink{background:#ec3293}.category-pill.black{background:#000}
  .category.off .category-pill{opacity:.4}
  .category:focus-visible{outline:2px solid #7950ef;outline-offset:3px}
  @media(hover:hover) and (pointer:fine){.category:hover .category-pill{transform:scale(.95) rotate(-1deg)}.category:hover:active .category-pill{transform:scale(.92) rotate(-1deg)}}
  .category:active .category-pill{transform:scale(.92)}
  @media(prefers-reduced-motion:reduce){.category-pill{transition:opacity 180ms ease}.category:hover .category-pill,.category:active .category-pill,.category:hover:active .category-pill{transform:none}}


  /* The board starts at the top of the section so the heading sits on it,
     like a note pinned among the cards. */
  .board{position:relative;height:var(--board-height);margin:-110px 0 0;padding:0;list-style:none}
  /* Pivots on the pin: PIN_Y in the script. */
  .card{position:absolute;width:280px;transform-origin:50% 16px;user-select:none;-webkit-user-select:none;transition:filter 300ms ease}
  .card.portrait{width:170px}.card.square{width:200px}
  /* Washed toward the white board rather than made see-through, so cards
     that overlap at the edges don't show through each other. */
  .card.aside{filter:saturate(.3) contrast(.25) brightness(1.75) blur(1px)}
  .media{display:block;width:100%;padding:0;border:0;border-radius:3px;overflow:hidden;background:#f1f0f3;cursor:pointer}
  .held .media,.held .pin{cursor:grabbing}
  .viewing .media{visibility:hidden}
  .media:focus-visible{outline:2px solid #7950ef;outline-offset:3px}
  video{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}
  .placeholder{display:grid;place-items:center;cursor:grab;background:repeating-linear-gradient(135deg,#f4f3f6 0 10px,#efeef2 10px 20px)}
  .placeholder span{font-size:12px;letter-spacing:.02em;color:#a9a6b0}
  /* The sprite's centre is the hole the needle goes into. */
  .pin{position:absolute;left:50%;top:16px;width:120px;height:120px;margin:-60px 0 0 -60px;background-size:400% 400%;background-repeat:no-repeat;pointer-events:none;cursor:grab}
  /* The 120px sprite includes empty space and shadow. Only the plastic pin
     plus roughly 4px receives input; follow its head as the pin lifts. */
  .pin::after{content:'';position:absolute;left:calc(41px + 3px * var(--pin-lift));top:calc(35px - 12px * var(--pin-lift));width:34px;height:calc(36px + 9px * var(--pin-lift));border-radius:45%;pointer-events:auto}

  dialog{position:fixed;inset:0;max-width:none;max-height:none;width:100%;height:100%;margin:0;padding:0;border:0;background:none;overflow:hidden;cursor:zoom-out}
  dialog[open]{display:grid;place-items:center}
  dialog::backdrop{background:none}
  /* Frosted rather than opaque, so the board stays as context. */
  .backdrop{position:absolute;inset:0;background:rgb(255 255 255 / .5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  /* Fits the screen whichever way round the work is. */
  .viewer{position:relative;width:min(88vw,calc(84vh * var(--ratio)),1200px);border-radius:6px;overflow:hidden;background:#f1f0f3;box-shadow:0 40px 90px -30px rgb(0 0 0 / .35)}
  .viewer canvas,.viewer video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .viewer video{opacity:0;transition:opacity 200ms ease}
  .viewer video.ready{opacity:1}
  .close{position:fixed;top:20px;right:20px;display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:999px;background:#080808;color:#fff;cursor:pointer;transition:transform 160ms var(--ease-out)}
  .close:active{transform:scale(.94)}

  @media(max-width:1100px){.board{height:var(--board-height);margin-top:20px}.card{width:220px}.card.portrait{width:140px}.card.square{width:160px}}
  @media(prefers-reduced-motion:reduce){.media{transition:none}}
  /* Phones: a two-column stack. No dragging so it never fights the page
     scroll, and a category filters the stack instead of moving cards. */
  @media(max-width:700px){
    section{padding:32px 24px 56px}
    h2{font-size:32px;margin-bottom:12px}
    .board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 14px;height:auto;margin-top:36px}
    .card,.card.portrait,.card.square{position:relative;left:auto!important;top:auto!important;width:auto;transform:none!important}
    .card:nth-child(odd){margin-top:18px}
    .card.hidden{display:none}
    .viewer{border-radius:4px}
  }
</style>
