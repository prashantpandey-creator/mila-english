#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertDesktopPulse,
  desktopPulseMetrics,
  measureDesktopGraphiteGeometry,
} from './register-mila-story-desktop-pulse.mjs';

const WIDTH = 2048;
const HEIGHT = 978;
const STARTS = Object.freeze([110, 112, 114, 116, 118]);
const LABELS = Object.freeze(['p76', 'p80', 'p825', 'p85', 'p90']);

export function auditDesktopPulse(file) {
  const frameSize = WIDTH * HEIGHT * 3;
  const expression = STARTS.map((frame) => `eq(n\\,${frame})`).join('+');
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-i', file,
      '-vf', `select=${expression}`,
      '-vsync', '0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1',
    ],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  if (raw.length !== frameSize * STARTS.length) {
    throw new Error(`Desktop pulse audit decoded ${raw.length / frameSize} drawings, expected ${STARTS.length}.`);
  }

  const geometries = STARTS.map((_, index) => measureDesktopGraphiteGeometry(
    raw.subarray(index * frameSize, (index + 1) * frameSize),
  ));
  const metrics = desktopPulseMetrics(geometries);
  assertDesktopPulse(metrics);
  return { file, labels: LABELS, starts: STARTS, geometries, ...metrics };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] ?? 'public/visuals/v7/mila-origin-film-desktop-v1.mp4');
  process.stdout.write(`${JSON.stringify(auditDesktopPulse(file), null, 2)}\n`);
}
