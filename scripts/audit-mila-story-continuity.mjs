#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REGISTRATION_LIMITS,
  measureGraphiteGeometry,
} from './register-mila-story-mobile.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const visualsRoot = resolve(process.argv[2] ?? resolve(root, 'public/visuals/v7'));
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

function auditMobileRegistration(file, starts) {
  const finaleStarts = starts.slice(30);
  const width = 960;
  const height = 2024;
  const frameSize = width * height * 3;
  const expression = finaleStarts.map((frame) => `eq(n\\,${frame})`).join('+');
  const raw = execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-i', file,
      '-vf', `select=${expression}`,
      '-vsync', '0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1',
    ],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  if (raw.length !== frameSize * finaleStarts.length) {
    throw new Error(`mobile registration: decoded ${raw.length / frameSize} drawings, expected ${finaleStarts.length}`);
  }
  const geometry = finaleStarts.map((_, index) => measureGraphiteGeometry(
    raw.subarray(index * frameSize, (index + 1) * frameSize),
  ));
  let maxCentroidStepPx = 0;
  let maxAreaScaleStepPercent = 0;
  for (let index = 1; index < geometry.length; index += 1) {
    const previous = geometry[index - 1];
    const current = geometry[index];
    maxCentroidStepPx = Math.max(
      maxCentroidStepPx,
      Math.hypot(current.cx - previous.cx, current.cy - previous.cy),
    );
    maxAreaScaleStepPercent = Math.max(
      maxAreaScaleStepPercent,
      Math.abs((Math.sqrt(current.bboxArea / previous.bboxArea) - 1) * 100),
    );
  }
  const monotonic = {
    centroidX: geometry.every((value, index) => index === 0 || value.cx > geometry[index - 1].cx),
    centroidY: geometry.every((value, index) => index === 0 || value.cy > geometry[index - 1].cy),
    bboxArea: geometry.every((value, index) => index === 0 || value.bboxArea > geometry[index - 1].bboxArea),
  };
  const encodedAreaLimit = 1.51;
  if (!Object.values(monotonic).every(Boolean)) {
    throw new Error(`Encoded mobile finale is not monotonic: ${JSON.stringify(monotonic)}`);
  }
  if (maxCentroidStepPx > REGISTRATION_LIMITS.maxCentroidStepPx) {
    throw new Error(`Encoded centroid step ${maxCentroidStepPx} exceeds ${REGISTRATION_LIMITS.maxCentroidStepPx}.`);
  }
  if (maxAreaScaleStepPercent > encodedAreaLimit) {
    throw new Error(`Encoded area-scale step ${maxAreaScaleStepPercent} exceeds ${encodedAreaLimit}.`);
  }
  return {
    drawings: finaleStarts.length,
    maxCentroidStepPx,
    maxAreaScaleStepPercent,
    encodedAreaLimit,
    monotonic,
  };
}

function audit(mode, height) {
  const holds = holdsByMode[mode];
  const labels = labelsByMode[mode];
  const file = resolve(visualsRoot, `mila-origin-film-${mode}-v1.mp4`);
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
    ...(mode === 'mobile' ? { registration: auditMobileRegistration(file, starts) } : {}),
  };
}

process.stdout.write(`${JSON.stringify([
  audit('desktop', 104),
  audit('mobile', 456),
], null, 2)}\n`);
