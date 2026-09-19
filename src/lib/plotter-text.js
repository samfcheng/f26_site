import * as THREE from 'three';
import { createSceneFilters } from './badge/scene-filters.js';
import { badgeSettings } from './badge/settings.js';

// Cache increasing stroke widths once, then animate only 2D copies on hover.
// The live HTML stays available to screen readers and keyboard navigation.
export function renderPlotterLabels(items) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshBasicMaterial({ transparent: true });
  scene.add(new THREE.Mesh(geometry, material));
  const filters = createSceneFilters(renderer, scene, camera);
  const labels = [];
  try {
    for (const { source, target } of items) {
      const rect = source.getBoundingClientRect();
      const width = Math.ceil(rect.width), height = Math.ceil(rect.height);
      if (!width || !height) continue;
      const artwork = document.createElement('canvas');
      const dpr = renderer.getPixelRatio();
      artwork.width = Math.ceil(width * dpr); artwork.height = Math.ceil(height * dpr);
      const ctx = artwork.getContext('2d');
      ctx.scale(dpr, dpr);ctx.textBaseline = 'alphabetic';ctx.fillStyle = '#080808';
      for (const element of source.querySelectorAll('[data-line]')) {
        const style = getComputedStyle(element), box = element.getBoundingClientRect();
        ctx.globalAlpha = Number(style.opacity);
        ctx.font = `${style.fontWeight} ${style.fontSize} Kyoto`;
        ctx.letterSpacing = style.letterSpacing;
        // Read actual browser line wrapping, including the longer project copy.
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const lines = new Map();
        let node;
        while ((node = walker.nextNode())) {
          for (let i = 0; i < node.textContent.length; i++) {
            const range = document.createRange();range.setStart(node, i);range.setEnd(node, i + 1);
            const bounds = range.getBoundingClientRect();
            const key = Math.round(bounds.top * 10);
            if (!lines.has(key)) lines.set(key, { text: '', x: bounds.left, y: bounds.top, height: bounds.height });
            lines.get(key).text += node.textContent[i];
          }
        }
        for (const line of lines.values()) {
          const metrics = ctx.measureText(line.text);
          const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
          const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .2;
          ctx.fillText(line.text, line.x - rect.left, line.y - rect.top + (line.height - ascent - descent) / 2 + ascent);
        }
      }
      const texture = new THREE.CanvasTexture(artwork);texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;material.needsUpdate = true;
      renderer.setSize(width, height, false);filters.resize(width, height);
      const frames = [];
      for (let index = 0; index <= 16; index++) {
        const progress = index / 16;
        const plotter = { ...badgeSettings.plotter, strokeWidth: 1 + progress * 3.5, strength: progress };
        filters.render(badgeSettings.filters, plotter);
        // Prime the output pass after its initial shader compilation.
        if (index === 0) filters.render(badgeSettings.filters, plotter);
        const frame = document.createElement('canvas');
        frame.width = renderer.domElement.width;frame.height = renderer.domElement.height;
        frame.getContext('2d').drawImage(renderer.domElement, 0, 0);frames.push(frame);
      }
      target.width = frames[0].width;target.height = frames[0].height;
      labels.push({ target, frames, progress: 0, destination: 0 });
      target.getContext('2d').drawImage(frames[0], 0, 0);
      texture.dispose();
    }
  } finally {
    filters.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();
  }
  let raf = 0, previousTime = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function paint(label) {
    const ctx = label.target.getContext('2d');
    const position = label.progress * 16, lower = Math.floor(position), upper = Math.min(16, lower + 1);
    ctx.clearRect(0, 0, label.target.width, label.target.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 - (position - lower);ctx.drawImage(label.frames[lower], 0, 0);
    ctx.globalAlpha = position - lower;ctx.drawImage(label.frames[upper], 0, 0);
    ctx.globalAlpha = 1;ctx.globalCompositeOperation = 'source-over';
  }
  function tick(time) {
    raf = 0;
    const step = previousTime ? (time - previousTime) / 150 : 0;
    previousTime = time;
    let moving = false;
    for (const label of labels) {
      const difference = label.destination - label.progress;
      label.progress += Math.sign(difference) * Math.min(Math.abs(difference), step);
      paint(label);
      moving ||= label.progress !== label.destination;
    }
    if (moving) raf = requestAnimationFrame(tick);else previousTime = 0;
  }
  return {
    setActive(active) {
      labels.forEach((label, index) => {
        label.destination = active !== null && active !== index ? 1 : 0;
        if (reduced.matches) { label.progress = label.destination;paint(label); }
      });
      if (!reduced.matches && !raf) raf = requestAnimationFrame(tick);
    },
    dispose() { cancelAnimationFrame(raf);labels.forEach(label => label.frames.forEach(frame => { frame.width = frame.height = 0; })); }
  };
}
