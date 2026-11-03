// Read every animated property before cancelling anything, then hold the
// displayed pose until the next animation takes over (including delays).
export function freezeAnimations(element, properties) {
  const computed = getComputedStyle(element);
  const pose = Object.fromEntries(properties.map(property => [property, computed[property]]));
  element.getAnimations().forEach(animation => animation.cancel());
  Object.assign(element.style, pose);
  return pose;
}

export function captureCardState(body) {
  return { target: { ...body.target }, dimmed: body.dimmed, keepUp: body.keepUp };
}
