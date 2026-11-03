// Reuse the installed Remotion toolchain from the share-video project without
// adding video-rendering dependencies to the portfolio's runtime bundle.
import { mkdtempSync, cpSync, copyFileSync, mkdirSync, symlinkSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const remotionRoot = process.env.REMOTION_ROOT ?? resolve(site, '../f26_og_video');
const modules = join(remotionRoot, 'node_modules');
if (!existsSync(join(modules, '@remotion/renderer'))) throw new Error('Install the share-video project dependencies first, or set REMOTION_ROOT.');
const { bundle } = await import(pathToFileURL(join(modules, '@remotion/bundler/dist/index.js')));
const { selectComposition, renderStill, renderMedia } = await import(pathToFileURL(join(modules, '@remotion/renderer/dist/index.js')));
const browserExecutable = join(modules, '.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const stage = mkdtempSync(join(tmpdir(), 'f26-badge-assets-'));
console.log(`Rendering badge assets in ${stage}`);
try {
  symlinkSync(modules, join(stage, 'node_modules'));
  cpSync(join(site, 'scripts/badge-assets'), join(stage, 'src'), { recursive: true });
  mkdirSync(join(stage, 'public/assets'), { recursive: true });
  copyFileSync(join(site, 'static/assets/badge-artwork.png'), join(stage, 'public/assets/badge-artwork.png'));
  const serveUrl = await bundle({
    entryPoint: join(stage, 'src/Root.tsx'), publicDir: join(stage, 'public'),
    webpackOverride: config => ({ ...config, resolve: { ...config.resolve, alias: {
      ...config.resolve.alias,
      '@site/badge-scene': join(site, 'src/lib/badge/badge-scene.js'),
      '@site/settings': join(site, 'src/lib/badge/settings.js')
    } } })
  });
  const options = { serveUrl, browserExecutable, chromiumOptions: { gl: 'angle' }, timeoutInMilliseconds: 120000 };
  for (const id of ['Badge', 'BadgeFiltered']) {
    const composition = await selectComposition({ ...options, id });
    await renderStill({ ...options, composition, output: join(stage, `${id}.png`), imageFormat: 'png' });
    console.log(`Rendered ${id}`);
  }
  execFileSync('python3', [join(site, 'scripts/badge-assets/compose.py'), stage, join(site, 'static')], { stdio: 'inherit' });
  // bundle() snapshots publicDir before the new card has been composed.
  copyFileSync(join(site, 'static/card.png'), join(serveUrl, 'public/card.png'));
  const composition = await selectComposition({ ...options, id: 'Sway4s' });
  await renderMedia({ ...options, composition, outputLocation: join(stage, 'og.mp4'), codec: 'h264', crf: 10, x264Preset: 'slow', pixelFormat: 'yuv420p', muted: true, concurrency: 2 });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', join(stage, 'og.mp4'), '-c', 'copy', '-movflags', '+faststart', join(site, 'static/og.mp4')]);
  console.log('Updated desktop stills, mobile lanyard, card.png, and og.mp4.');
} finally {
  if (!process.env.KEEP_BADGE_RENDERS) rmSync(stage, { recursive: true, force: true });
}
