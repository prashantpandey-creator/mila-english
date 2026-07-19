#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const renderer = readFileSync(resolve(root, 'scripts/render-mila-story-film.sh'), 'utf8');
function rendererHolds(name) {
  return renderer
    .match(new RegExp(`HOLDS_${name}=\\(([^)]+)\\)`))?.[1]
    .trim()
    .split(/\s+/)
    .map(Number);
}

const holdsByMode = {
  desktop: rendererHolds('DESKTOP'),
  mobile: rendererHolds('MOBILE'),
};
if (!holdsByMode.desktop?.length || !holdsByMode.mobile?.length) {
  throw new Error('Could not read the renderer exposure schedules.');
}

const beats = [
  'quiet', 'apart', 'listen', 'bridge', 'weave', 'midcurl',
  'fold', 'tighten', 'converge', 'land', 'nearfinal', 'final',
];
const desktopLabels = [];
for (let index = 0; index < 10; index += 1) {
  desktopLabels.push(beats[index], `${index}-${index + 1}-p33`, `${index}-${index + 1}-p67`);
}
desktopLabels.push(
  'nearfinal', 'p08', 'p16', 'p33', 'p50', 'p58', 'p625', 'p67',
  'p695', 'p72', 'p76', 'p80', 'p825', 'p85', 'p90', 'p92',
  'p93', 'p94', 'p97', 'p98', 'p99', 'p995', 'final',
);
const labelsByMode = {
  desktop: desktopLabels,
  mobile: desktopLabels.filter((label) => label !== 'p93' && label !== 'p995'),
};

for (const mode of ['desktop', 'mobile']) {
  if (labelsByMode[mode].length !== holdsByMode[mode].length) {
    throw new Error(
      `${mode} label/hold mismatch: ${labelsByMode[mode].length}/${holdsByMode[mode].length}`,
    );
  }
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[middle]
    : (ordered[middle - 1] + ordered[middle]) / 2;
}

function summarize(values) {
  return {
    min: Math.min(...values),
    median: median(values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    max: Math.max(...values),
  };
}

function audit(mode, height) {
  const holds = holdsByMode[mode];
  const labels = labelsByMode[mode];
  const file = resolve(root, `public/visuals/v7/mila-origin-film-${mode}-v1.mp4`);
  const width = 216;
  const frameSize = width * height;
  const expectedFrames = holds.reduce((sum, hold) => sum + hold, 0);
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-i', file,
      '-vf', `scale=${width}:${height}:flags=area,format=gray`,
      '-f', 'rawvideo', 'pipe:1',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  if (raw.length !== frameSize * expectedFrames) {
    throw new Error(`${mode}: decoded ${raw.length / frameSize} frames, expected ${expectedFrames}`);
  }

  const differences = [];
  for (let frame = 1; frame < expectedFrames; frame += 1) {
    const previous = (frame - 1) * frameSize;
    const current = frame * frameSize;
    let total = 0;
    for (let pixel = 0; pixel < frameSize; pixel += 1) {
      total += Math.abs(raw[previous + pixel] - raw[current + pixel]);
    }
    differences.push(total / frameSize);
  }

  const starts = [];
  let exposure = 0;
  for (const hold of holds) {
    starts.push(exposure);
    exposure += hold;
  }
  const boundaryFrames = new Set(starts.slice(1));
  const boundaries = [];
  const withinHolds = [];
  for (let frame = 1; frame < expectedFrames; frame += 1) {
    const value = differences[frame - 1];
    if (boundaryFrames.has(frame)) boundaries.push(value);
    else withinHolds.push(value);
  }

  const transitions = starts.slice(1).map((frame, index) => ({
    from: labels[index],
    to: labels[index + 1],
    frame,
    mad: differences[frame - 1],
  }));
  const late = transitions.filter((transition) => transition.frame >= starts[30]);
  const globalMedian = median(boundaries);

  return {
    mode,
    frames: expectedFrames,
    drawings: holds.length,
    boundary: summarize(boundaries),
    withinHold: summarize(withinHolds),
    late: summarize(late.map((transition) => transition.mad)),
    lateTransitions: late.map((transition) => ({
      ...transition,
      medianMultiple: transition.mad / globalMedian,
    })),
  };
}

process.stdout.write(`${JSON.stringify([
  audit('desktop', 104),
  audit('mobile', 456),
], null, 2)}\n`);
