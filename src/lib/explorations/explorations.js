// `pin` is the pin colour every card in the category is put up with.
export const categories = [
  { id: 'ui', label: 'micro interactions', pin: 'blue' },
  { id: 'motion', label: 'motion', pin: 'orange' },
  { id: 'tools', label: 'creative tools', pin: 'pink' },
  { id: 'graphic', label: 'graphic design', pin: 'black' }
];

// Optional `spot` positions compose the current collection; new items auto-pack.
// `src` is the small loop pinned to the board; `full` plays in the lightbox.
export const explorations = [
  { title: 'Logo versions', spot: { x: 45, y: 215, r: -1 }, category: 'graphic', src: '/explorations/logo-versions-sm.mp4', full: '/explorations/logo-versions.mp4', poster: '/explorations/logo-versions.webp', width: 1440, height: 1080 },
  { title: 'Leaf type', spot: { x: 80, y: 0, r: 3 }, category: 'tools', src: '/explorations/leaf-type-sm.mp4', full: '/explorations/leaf-type.mp4', poster: '/explorations/leaf-type.webp', width: 640, height: 462 },
  { title: 'SF windows', spot: { x: -5, y: 180, r: -4 }, category: 'ui', src: '/explorations/sf-windows-sm.mp4', full: '/explorations/sf-windows.mp4', poster: '/explorations/sf-windows.webp', width: 428, height: 640 },
  { title: 'Upgrade burst', spot: { x: 34, y: 10, r: 0 }, category: 'ui', src: '/explorations/burst-button-sm.mp4', full: '/explorations/burst-button.mp4', poster: '/explorations/burst-button.webp', width: 640, height: 440 },
  { title: 'NYC glimmer', spot: { x: 66, y: 0, r: 1 }, category: 'motion', src: '/explorations/nyc-glimmer-sm.mp4', full: '/explorations/nyc-glimmer.mp4', poster: '/explorations/nyc-glimmer.webp', width: 426, height: 640 },
  { title: 'Lightning bolt', spot: { x: 1, y: 325, r: -3 }, category: 'motion', src: '/explorations/lightning-bolt-sm.mp4', full: '/explorations/lightning-bolt.mp4', poster: '/explorations/lightning-bolt.webp', width: 800, height: 686 },
  { title: 'LA glimmer', spot: { x: 80, y: 245, r: 0 }, category: 'motion', src: '/explorations/la-glimmer-sm.mp4', full: '/explorations/la-glimmer.mp4', poster: '/explorations/la-glimmer.webp', width: 426, height: 640 },
  { title: 'Design flowers', spot: { x: 20, y: 260, r: 0 }, category: 'tools', src: '/explorations/designflowers-sm.mp4', full: '/explorations/designflowers.mp4', poster: '/explorations/designflowers.webp', width: 1472, height: 1080 },
  { title: 'Paper planes', spot: { x: 63, y: 290, r: 3 }, category: 'graphic', src: '/explorations/paper-planes-sm.mp4', full: '/explorations/paper-planes.mp4', poster: '/explorations/paper-planes.webp', width: 426, height: 640 },
];
