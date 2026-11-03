import React, { useEffect, useRef, useState } from 'react';
import { Composition, registerRoot, delayRender, continueRender, cancelRender, staticFile } from 'remotion';
import { createBadgeScene } from '@site/badge-scene';
import { badgeSettings } from '@site/settings';
import { Conveyor } from './Conveyor';

const Badge = ({ filtered = false }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender('Render badge artwork and sleeve'));
  useEffect(() => {
    let scene, cancelled = false;
    const settings = {
      ...badgeSettings, paused: true,
      ...(filtered ? {} : {
        material: { ...badgeSettings.material, unlitArtwork: true, wear: .2 },
        lighting: { ...badgeSettings.lighting, reflections: .9 },
        filters: { ...badgeSettings.filters, enabled: false },
        plotter: { ...badgeSettings.plotter, enabled: false }
      })
    };
    createBadgeScene(canvas.current, () => settings, () => {}, staticFile('assets/badge-artwork.png'))
      .then(value => {
        scene = value;
        if (cancelled) return scene.dispose();
        requestAnimationFrame(() => requestAnimationFrame(() => continueRender(handle)));
      }).catch(cancelRender);
    return () => { cancelled = true; scene?.dispose(); };
  }, []);
  return <canvas ref={canvas} style={{ width: '100%', height: '100%' }} />;
};

registerRoot(() => <>
  <Composition id="Badge" component={Badge} width={2000} height={2000} fps={30} durationInFrames={1} defaultProps={{ filtered: false }} />
  <Composition id="BadgeFiltered" component={Badge} width={2000} height={2000} fps={30} durationInFrames={1} defaultProps={{ filtered: true }} />
  <Composition id="Sway4s" component={Conveyor} width={1200} height={630} fps={30} durationInFrames={120} defaultProps={{ swaying: true }} />
</>);
