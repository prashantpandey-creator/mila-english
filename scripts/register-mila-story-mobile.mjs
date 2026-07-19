#!/usr/bin/env node

import { rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 960;
const HEIGHT = 2024;
const LOW_WIDTH = 240;
const LOW_HEIGHT = 506;
const DRAWING_START = 30;
// The generated portrait sheets carry real deckled paper rails down both
// lateral edges. Registration moves only the sculpture: keep both full rail
// bands byte-identical, then ease the matte into the graphite rather than
// exposing a vertical cut line. Late, wider drawings enter through the
// bilateral feather safely.
const PAPER_RAIL_LOCK_PX = 64;
const OBJECT_TAPER_PX = 80;
const LEFT_OBJECT_TAPER_END_X = PAPER_RAIL_LOCK_PX + OBJECT_TAPER_PX;
const RIGHT_PAPER_RAIL_START_X = WIDTH - PAPER_RAIL_LOCK_PX;
const RIGHT_OBJECT_TAPER_START_X = RIGHT_PAPER_RAIL_START_X - OBJECT_TAPER_PX;
const LABELS = [
  'nearfinal', 'p08', 'p16', 'p33', 'p50', 'p58', 'p625',
  'p67', 'p695', 'p72', 'p76', 'p80', 'p825', 'p85', 'p90',
  'p92', 'p94', 'p97', 'p98', 'p99', 'final',
];

export const REGISTRATION_LIMITS = Object.freeze({
  // Bilateral paper locking necessarily leaves the graphite already touching
  // the delivery edge in place. The accepted cut stays below 8 px, versus the
  // unregistered 82.184 px snap.
  maxCentroidStepPx: 8,
  // Sharp's fixed-canvas resize and the renderer's contrast normalization
  // quantize the percentile bounds to whole pixels. The accepted bilateral
  // result is 0.992%; 1.45% is a narrow deterministic allowance, not a motion
  // budget (the unregistered source jump is 11.235%).
  maxAreaScaleStepPercent: 1.45,
  maxEdgeMad: 0,
  maxPaperRailMad: 0,
  maxPaperRailPixelDelta: 0,
  // The accepted bilateral matte measures 1.407 at worst on paper-only
  // samples; the former hard rail boundary was 13.842, so 1.45 keeps a narrow
  // deterministic seam budget.
  maxTaperColumnResidualStep: 1.45,
});

const luma = (red, green, blue) => Math.round((0.299 * red) + (0.587 * green) + (0.114 * blue));

function percentile(sorted, fraction) {
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

export function measureGraphiteGeometry(rgb, width = WIDTH, height = HEIGHT) {
  const xs = [];
  const ys = [];
  let sumX = 0;
  let sumY = 0;
  for (let y = 251; y < Math.min(1350, height); y += 1) {
    for (let x = PAPER_RAIL_LOCK_PX; x < Math.min(RIGHT_PAPER_RAIL_START_X, width); x += 1) {
      const offset = ((y * width) + x) * 3;
      if (luma(rgb[offset], rgb[offset + 1], rgb[offset + 2]) >= 170) continue;
      xs.push(x);
      ys.push(y);
      sumX += x;
      sumY += y;
    }
  }
  if (!xs.length) throw new Error('Registration could not find the graphite sculpture.');
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const left = percentile(xs, 0.01);
  const right = percentile(xs, 0.99);
  const top = percentile(ys, 0.01);
  const bottom = percentile(ys, 0.99);
  return {
    cx: sumX / xs.length,
    cy: sumY / ys.length,
    bboxArea: (right - left) * (bottom - top),
  };
}

function downsampleFour(rgb) {
  const result = Buffer.alloc(LOW_WIDTH * LOW_HEIGHT);
  for (let lowY = 0; lowY < LOW_HEIGHT; lowY += 1) {
    for (let lowX = 0; lowX < LOW_WIDTH; lowX += 1) {
      let total = 0;
      for (let dy = 0; dy < 4; dy += 1) {
        for (let dx = 0; dx < 4; dx += 1) {
          const x = (lowX * 4) + dx;
          const y = (lowY * 4) + dy;
          const offset = ((y * WIDTH) + x) * 3;
          total += luma(rgb[offset], rgb[offset + 1], rgb[offset + 2]);
        }
      }
      result[(lowY * LOW_WIDTH) + lowX] = Math.round(total / 16);
    }
  }
  return result;
}

function dilate(binary, radius = 10) {
  const integral = new Uint32Array((LOW_WIDTH + 1) * (LOW_HEIGHT + 1));
  for (let y = 0; y < LOW_HEIGHT; y += 1) {
    let row = 0;
    for (let x = 0; x < LOW_WIDTH; x += 1) {
      row += binary[(y * LOW_WIDTH) + x];
      integral[((y + 1) * (LOW_WIDTH + 1)) + x + 1] =
        integral[(y * (LOW_WIDTH + 1)) + x + 1] + row;
    }
  }
  const output = Buffer.alloc(binary.length);
  for (let y = 0; y < LOW_HEIGHT; y += 1) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(LOW_HEIGHT - 1, y + radius);
    for (let x = 0; x < LOW_WIDTH; x += 1) {
      const left = Math.max(0, x - radius);
      const right = Math.min(LOW_WIDTH - 1, x + radius);
      const sum = integral[((bottom + 1) * (LOW_WIDTH + 1)) + right + 1]
        - integral[(top * (LOW_WIDTH + 1)) + right + 1]
        - integral[((bottom + 1) * (LOW_WIDTH + 1)) + left]
        + integral[(top * (LOW_WIDTH + 1)) + left];
      output[(y * LOW_WIDTH) + x] = sum > 0 ? 255 : 0;
    }
  }
  return output;
}

export async function graphiteMask(original, transformed) {
  const masks = [];
  for (const image of [original, transformed]) {
    const reduced = downsampleFour(image);
    const binary = Buffer.alloc(reduced.length);
    for (let y = 55; y < 344; y += 1) {
      for (let x = 2; x < 238; x += 1) {
        const offset = (y * LOW_WIDTH) + x;
        binary[offset] = reduced[offset] < 222 ? 255 : 0;
      }
    }
    masks.push(await sharp(dilate(binary), {
      raw: { width: LOW_WIDTH, height: LOW_HEIGHT, channels: 1 },
    }).blur(6).greyscale().raw().toBuffer());
  }
  const union = Buffer.alloc(masks[0].length);
  for (let index = 0; index < union.length; index += 1) {
    union[index] = Math.max(masks[0][index], masks[1][index]);
  }
  const full = await sharp(union, {
    raw: { width: LOW_WIDTH, height: LOW_HEIGHT, channels: 1 },
  }).resize(WIDTH, HEIGHT, { kernel: sharp.kernel.linear }).greyscale().raw().toBuffer();
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH) + x;
      if (y < 220 || y >= 1375
          || x < PAPER_RAIL_LOCK_PX || x >= RIGHT_PAPER_RAIL_START_X) {
        full[offset] = 0;
        continue;
      }
      let progress = 1;
      if (x < LEFT_OBJECT_TAPER_END_X) {
        progress = (x - PAPER_RAIL_LOCK_PX) / OBJECT_TAPER_PX;
      } else if (x >= RIGHT_OBJECT_TAPER_START_X) {
        progress = (RIGHT_PAPER_RAIL_START_X - x) / OBJECT_TAPER_PX;
      }
      if (progress < 1) {
        const smooth = progress * progress * (3 - (2 * progress));
        full[offset] = Math.round(full[offset] * smooth);
      }
    }
  }
  return full;
}

export async function renderLocalized(source, sourceGeometry, control) {
  const scaledWidth = Math.max(1, Math.round(WIDTH * control.scale));
  const scaledHeight = Math.max(1, Math.round(HEIGHT * control.scale));
  const resized = await sharp(source, {
    raw: { width: WIDTH, height: HEIGHT, channels: 3 },
  }).resize(scaledWidth, scaledHeight, {
    fit: 'fill',
    kernel: sharp.kernel.cubic,
  }).removeAlpha().raw().toBuffer();
  const effectiveScaleX = scaledWidth / WIDTH;
  const effectiveScaleY = scaledHeight / HEIGHT;
  const exactLeft = control.cx - (effectiveScaleX * sourceGeometry.cx);
  const exactTop = control.cy - (effectiveScaleY * sourceGeometry.cy);
  const intendedLeft = Math.floor(exactLeft);
  const intendedTop = Math.floor(exactTop);
  const scaled = await sharp(resized, {
    raw: { width: scaledWidth, height: scaledHeight, channels: 3 },
  }).affine([[1, 0], [0, 1]], {
    odx: exactLeft - intendedLeft,
    ody: exactTop - intendedTop,
    interpolator: sharp.interpolators.bicubic,
    background: { r: 247, g: 244, b: 240 },
  }).removeAlpha().raw().toBuffer();
  const sourceLeft = Math.max(0, -intendedLeft);
  const sourceTop = Math.max(0, -intendedTop);
  const destinationLeft = Math.max(0, intendedLeft);
  const destinationTop = Math.max(0, intendedTop);
  const placedWidth = Math.min(scaledWidth - sourceLeft, WIDTH - destinationLeft);
  const placedHeight = Math.min(scaledHeight - sourceTop, HEIGHT - destinationTop);
  const overlay = await sharp(scaled, {
    raw: { width: scaledWidth, height: scaledHeight, channels: 3 },
  }).extract({ left: sourceLeft, top: sourceTop, width: placedWidth, height: placedHeight })
    .png().toBuffer();
  const transformed = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 247, g: 244, b: 240 },
    },
  }).composite([{ input: overlay, left: destinationLeft, top: destinationTop }])
    .removeAlpha().raw().toBuffer();
  const alpha = await graphiteMask(source, transformed);
  const output = Buffer.alloc(source.length);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) {
    const opacity = alpha[pixel];
    const inverse = 255 - opacity;
    const offset = pixel * 3;
    for (let channel = 0; channel < 3; channel += 1) {
      output[offset + channel] = Math.round(
        ((transformed[offset + channel] * opacity) + (source[offset + channel] * inverse)) / 255,
      );
    }
  }
  return output;
}

function geometryMetrics(geometries) {
  let maxCentroidStepPx = 0;
  let maxAreaScaleStepPercent = 0;
  for (let index = 1; index < geometries.length; index += 1) {
    const previous = geometries[index - 1];
    const current = geometries[index];
    maxCentroidStepPx = Math.max(
      maxCentroidStepPx,
      Math.hypot(current.cx - previous.cx, current.cy - previous.cy),
    );
    maxAreaScaleStepPercent = Math.max(
      maxAreaScaleStepPercent,
      Math.abs((Math.sqrt(current.bboxArea / previous.bboxArea) - 1) * 100),
    );
  }
  return {
    maxCentroidStepPx,
    maxAreaScaleStepPercent,
    monotonic: {
      centroidX: geometries.every((value, index) => index === 0 || value.cx > geometries[index - 1].cx),
      centroidY: geometries.every((value, index) => index === 0 || value.cy > geometries[index - 1].cy),
      bboxArea: geometries.every((value, index) => index === 0 || value.bboxArea > geometries[index - 1].bboxArea),
    },
  };
}

function edgeMad(source, output) {
  let total = 0;
  let samples = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (y >= 220 && y < 1375 && x >= 7 && x < 953) continue;
      const offset = ((y * WIDTH) + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        total += Math.abs(source[offset + channel] - output[offset + channel]);
        samples += 1;
      }
    }
  }
  return total / samples;
}

function paperIsolationMetrics(source, output) {
  let railTotal = 0;
  let railSamples = 0;
  let maxPaperRailPixelDelta = 0;
  const leftColumnResidual = new Float64Array(OBJECT_TAPER_PX + 1);
  const rightColumnResidual = new Float64Array(OBJECT_TAPER_PX + 1);
  const leftColumnSamples = new Uint32Array(OBJECT_TAPER_PX + 1);
  const rightColumnSamples = new Uint32Array(OBJECT_TAPER_PX + 1);
  for (let y = 220; y < 1375; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const inLeftRail = x < PAPER_RAIL_LOCK_PX;
      const inRightRail = x >= RIGHT_PAPER_RAIL_START_X;
      const inLeftTaper = x >= PAPER_RAIL_LOCK_PX && x <= LEFT_OBJECT_TAPER_END_X;
      const inRightTaper = x >= RIGHT_OBJECT_TAPER_START_X && x < RIGHT_PAPER_RAIL_START_X;
      if (!inLeftRail && !inRightRail && !inLeftTaper && !inRightTaper) continue;
      const offset = ((y * WIDTH) + x) * 3;
      let pixelDelta = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(source[offset + channel] - output[offset + channel]);
        pixelDelta += delta;
        if (inLeftRail || inRightRail) {
          railTotal += delta;
          railSamples += 1;
          maxPaperRailPixelDelta = Math.max(maxPaperRailPixelDelta, delta);
        }
      }
      const sourceLuma = luma(source[offset], source[offset + 1], source[offset + 2]);
      const outputLuma = luma(output[offset], output[offset + 1], output[offset + 2]);
      // A matte seam is a paper defect. Ignore true graphite contour changes
      // here; silhouette motion has its own centroid/area gates above.
      if (sourceLuma >= 222 && outputLuma >= 222) {
        if (inLeftTaper) {
          leftColumnResidual[x - PAPER_RAIL_LOCK_PX] += pixelDelta / 3;
          leftColumnSamples[x - PAPER_RAIL_LOCK_PX] += 1;
        }
        if (inRightTaper) {
          rightColumnResidual[RIGHT_PAPER_RAIL_START_X - x] += pixelDelta / 3;
          rightColumnSamples[RIGHT_PAPER_RAIL_START_X - x] += 1;
        }
      }
    }
  }
  for (const [columns, samples] of [
    [leftColumnResidual, leftColumnSamples],
    [rightColumnResidual, rightColumnSamples],
  ]) {
    for (let index = 0; index < columns.length; index += 1) {
      columns[index] /= Math.max(1, samples[index]);
    }
  }
  let maxTaperColumnResidualStep = 0;
  for (const columns of [leftColumnResidual, rightColumnResidual]) {
    for (let index = 1; index < columns.length; index += 1) {
      maxTaperColumnResidualStep = Math.max(
        maxTaperColumnResidualStep,
        Math.abs(columns[index] - columns[index - 1]),
      );
    }
  }
  return {
    paperRailMad: railTotal / railSamples,
    maxPaperRailPixelDelta,
    maxTaperColumnResidualStep,
  };
}

function assertGeometry(metrics, geometries) {
  if (!Object.values(metrics.monotonic).every(Boolean)) {
    throw new Error(`Mobile registration is not monotonic: ${JSON.stringify({ monotonic: metrics.monotonic, geometries })}`);
  }
  if (metrics.maxCentroidStepPx > REGISTRATION_LIMITS.maxCentroidStepPx) {
    throw new Error(`Centroid step ${metrics.maxCentroidStepPx} exceeds ${REGISTRATION_LIMITS.maxCentroidStepPx}: ${JSON.stringify(geometries)}`);
  }
  if (metrics.maxAreaScaleStepPercent > REGISTRATION_LIMITS.maxAreaScaleStepPercent) {
    throw new Error(`Area-scale step ${metrics.maxAreaScaleStepPercent} exceeds ${REGISTRATION_LIMITS.maxAreaScaleStepPercent}.`);
  }
}

export async function registerMobileDrawings(directory) {
  const drawings = await Promise.all(LABELS.map(async (label, index) => {
    const path = resolve(directory, `drawing-${String(DRAWING_START + index).padStart(2, '0')}.png`);
    const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== WIDTH || info.height !== HEIGHT || info.channels !== 3) {
      throw new Error(`${label}: expected ${WIDTH}x${HEIGHT} RGB, received ${info.width}x${info.height}x${info.channels}.`);
    }
    return { label, path, source: data, geometry: measureGraphiteGeometry(data) };
  }));

  const first = drawings[0].geometry;
  const last = drawings.at(-1).geometry;
  const outputs = [];
  const controls = [];
  for (let index = 0; index < drawings.length; index += 1) {
    const drawing = drawings[index];
    const progress = index / (drawings.length - 1);
    const target = {
      cx: first.cx + ((last.cx - first.cx) * progress),
      cy: first.cy + ((last.cy - first.cy) * progress),
      bboxArea: Math.exp(Math.log(first.bboxArea) + ((Math.log(last.bboxArea) - Math.log(first.bboxArea)) * progress)),
    };
    const control = {
      cx: target.cx,
      cy: target.cy,
      scale: Math.sqrt(target.bboxArea / drawing.geometry.bboxArea),
    };
    let output;
    for (let pass = 0; pass < 10; pass += 1) {
      output = await renderLocalized(drawing.source, drawing.geometry, control);
      const measured = measureGraphiteGeometry(output);
      control.cx += target.cx - measured.cx;
      control.cy += target.cy - measured.cy;
      control.scale *= Math.sqrt(target.bboxArea / measured.bboxArea);
    }
    output = await renderLocalized(drawing.source, drawing.geometry, control);
    outputs.push(output);
    controls.push({ label: drawing.label, target, control });
  }

  const geometries = outputs.map((output) => measureGraphiteGeometry(output));
  const metrics = geometryMetrics(geometries);
  const maxEdgeMad = Math.max(...outputs.map((output, index) => edgeMad(drawings[index].source, output)));
  const isolation = outputs.map((output, index) => paperIsolationMetrics(drawings[index].source, output));
  const paperRailMad = Math.max(...isolation.map((value) => value.paperRailMad));
  const maxPaperRailPixelDelta = Math.max(...isolation.map((value) => value.maxPaperRailPixelDelta));
  const maxTaperColumnResidualStep = Math.max(...isolation.map((value) => value.maxTaperColumnResidualStep));
  assertGeometry(metrics, geometries);
  if (maxEdgeMad > REGISTRATION_LIMITS.maxEdgeMad) {
    throw new Error(`Paper edge MAD ${maxEdgeMad} exceeds ${REGISTRATION_LIMITS.maxEdgeMad}.`);
  }
  if (paperRailMad > REGISTRATION_LIMITS.maxPaperRailMad
      || maxPaperRailPixelDelta > REGISTRATION_LIMITS.maxPaperRailPixelDelta) {
    throw new Error(`Paper rail moved: ${JSON.stringify({ paperRailMad, maxPaperRailPixelDelta })}.`);
  }
  if (maxTaperColumnResidualStep > REGISTRATION_LIMITS.maxTaperColumnResidualStep) {
    throw new Error(`Lateral matte seam ${maxTaperColumnResidualStep} exceeds ${REGISTRATION_LIMITS.maxTaperColumnResidualStep}.`);
  }

  const staged = [];
  try {
    for (let index = 0; index < drawings.length; index += 1) {
      const stage = `${drawings[index].path}.registered`;
      await writeFile(stage, await sharp(outputs[index], {
        raw: { width: WIDTH, height: HEIGHT, channels: 3 },
      }).png({ compressionLevel: 9 }).toBuffer());
      staged.push(stage);
    }
    for (let index = 0; index < drawings.length; index += 1) {
      await rename(staged[index], drawings[index].path);
    }
  } finally {
    await Promise.all(staged.map((path) => rm(path, { force: true })));
  }
  return {
    labels: LABELS,
    controls,
    geometries,
    maxEdgeMad,
    paperRailMad,
    maxPaperRailPixelDelta,
    maxTaperColumnResidualStep,
    ...metrics,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: register-mila-story-mobile.mjs <normalized-drawing-directory>');
  process.stdout.write(`${JSON.stringify(await registerMobileDrawings(resolve(directory)), null, 2)}\n`);
}
