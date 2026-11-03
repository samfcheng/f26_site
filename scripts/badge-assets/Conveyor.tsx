import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * The share card's badges sliding left to right. card.png repeats one badge
 * every 537 px, so moving the row exactly one spacing per loop brings it back
 * to the first frame — which is the card itself.
 */
const SPACING = 537;
const TILE_LEFT = 332; // the middle badge's tile, centred on its strap at x 600
const STRAP_X = 268;
// The lanyards run off the top of the frame; they swing from a point above it.
const PIVOT_Y = -380;

/**
 * Two slow waves, layered. Each is a whole number of cycles per loop in time
 * (so the last frame meets the first) and travels along the row in space, so
 * neighbouring badges are a third of a swing apart and never move in step.
 */
const sway = (t: number, x: number) => {
  const s = x / SPACING;
  return 1.3 * Math.sin(2 * Math.PI * (t + s / 3)) + .35 * Math.sin(2 * Math.PI * (2 * t + 2 * s / 3) + 1.1);
};

export const Conveyor = ({ swaying }: { swaying: boolean }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const offset = t * SPACING;
  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden' }}>
      {[-2, -1, 0, 1, 2].map(j => {
        const left = TILE_LEFT + j * SPACING + offset;
        return (
          <div key={j} style={{
            position: 'absolute', left, top: 0, width: SPACING, height: 630, overflow: 'hidden',
            transform: swaying ? `rotate(${sway(t, left)}deg)` : undefined,
            transformOrigin: `${STRAP_X}px ${PIVOT_Y}px`,
            // White multiplies away, so a tilted tile never covers its neighbour.
            mixBlendMode: 'multiply'
          }}>
            <Img src={staticFile('card.png')} style={{ position: 'absolute', left: -TILE_LEFT, top: 0, width: 1200, height: 630 }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
