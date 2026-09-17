// Original badge playground defaults, with the plotter enabled.
export const badgeSettings = {
  physics: { gravity: 9.81, mass: .72, damping: .45, mouseForce: 1, grip: 100, strapStiffness: 90, antiTwist: 2.2, twistProgression: 3, swivelDamping: .15 },
  material: { wear: .7, edgeDamage: .55, roughness: .012, transmission: 1, thickness: .006, metalRoughness: .2, strapColor: '#30382d' },
  lighting: { exposure: 1, keyLight: 2.5, reflections: 1.8, shadow: .13 },
  background: { color: '#ffffff', transparent: true, filterBackground: false },
  filters: { enabled: false, dither: 1, levels: 4, ditherSize: 2, pixelSize: 1, grain: 0, monochrome: 0, sepia: 0, vignette: 0 },
  plotter: { enabled: true, strength: 1, strokeWidth: 5, edgeSoftness: .35, lineBlend: .5, direction: 0, colorSteps: 6, inkVariation: .55 },
  view: { angle: 0, zoom: 1 },
  paused: false
};
