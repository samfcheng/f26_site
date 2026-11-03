"""Compose site assets from fresh transparent renders of the actual badge scene."""
from pathlib import Path
from PIL import Image
import math
import sys

render_dir, output = map(Path, sys.argv[1:])
assets = output / 'assets'
for name, target in [('Badge', 'badge-still.webp'), ('BadgeFiltered', 'badge-still-filter.webp')]:
    image = Image.open(render_dir / f'{name}.png').convert('RGBA')
    image.crop((688, 0, 1392, 1768)).save(assets / target, lossless=True)

# Affine framing preserves transparency, sleeve reflections, and cast shadows.
def place(image, size, scale, degrees, anchor):
    angle = math.radians(degrees)
    c, s = math.cos(angle), math.sin(angle)
    ax, ay = anchor
    # The scene's strap pivot is at x=1000, y=0.
    inverse = (c / scale, -s / scale, 1000 - (c * ax - s * ay) / scale,
               s / scale, c / scale, -(s * ax + c * ay) / scale)
    return image.transform(size, Image.Transform.AFFINE, inverse, Image.Resampling.BICUBIC)

image = Image.open(render_dir / 'Badge.png').convert('RGBA')
place(image, (900, 1997), 1.22, 6, (290, -160)).save(assets / 'badge-lanyard.webp', lossless=True)
card = Image.new('RGBA', (1200, 630), 'white')
for x in (63, 600, 1137):
    card.alpha_composite(place(image, card.size, .48, 1.5, (x, -225)))
card.convert('RGB').save(output / 'card.png', optimize=True)
