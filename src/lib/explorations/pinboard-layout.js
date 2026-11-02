// Pack measured card proportions around the heading, filling the lowest
// available gap instead of reserving full rows for differently sized cards.
export function cardSize(item) {
  const width = item.height > item.width * 1.1 ? 170 : item.width > item.height * 1.1 ? 280 : 200;
  return { width, height: width * (item.height || 3) / (item.width || 4) };
}

export function boardSpots(items) {
  const width = 1280, gap = 22;
  const occupied = [{ x: 0, y: -20, width: 440, height: 170 }];
  const spots = [];
  // Place tall cards first so they cannot be stranded below shorter cards.
  const order = items.map((_, index) => index).sort((a, b) => cardSize(items[b]).height - cardSize(items[a]).height);
  for (const index of order) {
    const item = items[index];
    const size = cardSize(item);
    let best;
    const positions = Array.from({ length: Math.floor((width - size.width) / 24) + 1 }, (_, i) => i * 24);
    positions.push(width - size.width);
    for (const x of positions) {
      let y = 0;
      for (;;) {
        const collisions = occupied.filter(box => x < box.x + box.width + gap
          && x + size.width + gap > box.x
          && y < box.y + box.height + gap && y + size.height + gap > box.y);
        if (!collisions.length) break;
        y = Math.max(...collisions.map(box => box.y + box.height + gap));
      }
      if (!best || y < best.y) best = { x, y };
    }
    const spot = item.spot ?? { x: best.x / width * 100, y: best.y, r: [-3, 2, -3, 0, 2][index % 5] };
    occupied.push({ x: spot.x / 100 * width, y: spot.y, ...size });
    spots[index] = spot;
  }
  return spots;
}

// Assign sides from the complete board, never from a category's remainder.
// Both membership and packing stay fixed while switching categories.
export function edgeSides(boxes, homes) {
  const sorted = boxes.map((_, index) => index).sort((a, b) =>
    boxes[a].left + homes[a].x + boxes[a].width / 2
    - (boxes[b].left + homes[b].x + boxes[b].width / 2));
  const left = new Set(sorted.slice(0, Math.floor(sorted.length / 2)));
  return boxes.map((_, index) => left.has(index) ? 'left' : 'right');
}

export function samePose(a, b) {
  return ['x', 'y', 'angle', 'scale'].every(key => Math.abs(a[key] - b[key]) < .001);
}
