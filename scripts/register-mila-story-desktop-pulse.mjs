#!/usr/bin/env node

import { rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 2048;
const HEIGHT = 978;
const LOW_WIDTH = 512;
const LOW_HEIGHT = 245;

// p76 and p90 are the stable neighbours around the p80 -> p825 -> p85 pulse.
// Only the three interior redraws are rewritten; both anchors, every exposure,
// and every source drawing in the workshop remain byte-for-byte untouched.
const DRAWINGS = Object.freeze([
  { label: 'p76', index: 40, progress: 0.76, anchor: true },
  { label: 'p80', index: 41, progress: 0.80 },
  { label: 'p825', index: 42, progress: 0.825 },
  { label: 'p85', index: 43, progress: 0.85 },
  { label: 'p90', index: 44, progress: 0.90, anchor: true },
]);

export const DESKTOP_PULSE_LIMITS = Object.freeze({
  maxCentroidStepPx: 12.5,
  maxAreaScaleStepPercent: 0.8,
  maxCentroidTrajectoryErrorPx: 1.5,
  maxAreaTrajectoryErrorPercent: 0.8,
  maxPaperEdgeMad: 0,
  maxAdjacentRightColumnMadStep: 1,
  maxLast16ColumnMad: 0,
});

const luma = (red, green, blue) => Math.round(
  (0.299 * red) + (0.587 * green) + (0.114 * blue),
);

function dilateBinary(binary, radius = 14) {
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

export function measureDesktopGraphiteGeometry(rgb, width = WIDTH, height = HEIGHT) {
  let totalWeight = 0;
  let sumX = 0;
  let sumY = 0;

  // This fixed delivery-space ROI contains the sculpture and its grounding
  // shadow, but excludes the torn-paper border and the lower-left pencil note.
  for (let y = 54; y < Math.min(890, height); y += 1) {
    for (let x = 890; x < Math.min(2020, width); x += 1) {
      if (y >= 815 && x < 1180) continue;
      const offset = ((y * width) + x) * 3;
      const weight = Math.max(0, 205 - luma(rgb[offset], rgb[offset + 1], rgb[offset + 2]));
      if (!weight) continue;
      totalWeight += weight;
      sumX += x * weight;
      sumY += y * weight;
    }
  }

  if (!totalWeight) throw new Error('Desktop pulse registration could not find the graphite sculpture.');
  const cx = sumX / totalWeight;
  const cy = sumY / totalWeight;
  let weightedRadiusSquared = 0;
  for (let y = 54; y < Math.min(890, height); y += 1) {
    for (let x = 890; x < Math.min(2020, width); x += 1) {
      if (y >= 815 && x < 1180) continue;
      const offset = ((y * width) + x) * 3;
      const weight = Math.max(0, 205 - luma(rgb[offset], rgb[offset + 1], rgb[offset + 2]));
      if (!weight) continue;
      weightedRadiusSquared += weight * (((x - cx) ** 2) + ((y - cy) ** 2));
    }
  }
  return {
    cx,
    cy,
    momentArea: weightedRadiusSquared / totalWeight,
  };
}

export async function graphiteMask(original, transformed) {
  const masks = [];
  for (const image of [original, transformed]) {
    const reduced = await sharp(image, {
      raw: { width: WIDTH, height: HEIGHT, channels: 3 },
    }).resize(LOW_WIDTH, LOW_HEIGHT, {
      fit: 'fill',
      kernel: sharp.kernel.box,
    }).greyscale().raw().toBuffer();

    const binary = Buffer.alloc(reduced.length);
    for (let y = 18; y < 230; y += 1) {
      for (let x = 225; x < 508; x += 1) {
        // Leave the loose lower-left construction squiggle on the paper.
        if (y > 202 && x < 300) continue;
        const offset = (y * LOW_WIDTH) + x;
        binary[offset] = reduced[offset] < 222 ? 255 : 0;
      }
    }

    masks.push(await sharp(dilateBinary(binary), {
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

  // These hard-zero bands make paper/camera registration exact, not visual.
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (y < 54 || y >= 920 || x < 890 || x >= 2032 || (y >= 815 && x < 1180)) {
        full[(y * WIDTH) + x] = 0;
      } else if (x >= 1904) {
        // The right-hand ribbon is intentionally anchored into the crop. Ease
        // the matte to zero across 128 px so an affine background fill can
        // never create a vertical rail near the delivery edge.
        const progress = (2032 - x) / 128;
        const smooth = progress * progress * (3 - (2 * progress));
        full[(y * WIDTH) + x] = Math.round(full[(y * WIDTH) + x] * smooth);
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

  const shifted = await sharp(resized, {
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
  const overlay = await sharp(shifted, {
    raw: { width: scaledWidth, height: scaledHeight, channels: 3 },
  }).extract({ left: sourceLeft, top: sourceTop, width: placedWidth, height: placedHeight })
    .png().toBuffer();
  // Begin with the original paper, not a flat fill. Any affine footprint that
  // reaches the crop edge therefore resolves to real paper and cannot expose
  // a solid vertical rail under the feathered matte.
  const transformed = await sharp(source, {
    raw: { width: WIDTH, height: HEIGHT, channels: 3 },
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

function geometryVector(geometry) {
  return [geometry.cx, geometry.cy, Math.log(Math.sqrt(geometry.momentArea))];
}

function solveThreeByThree(matrix, vector) {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    if (Math.abs(augmented[column][column]) < 1e-8) return null;
    const divisor = augmented[column][column];
    for (let cell = column; cell < 4; cell += 1) augmented[column][cell] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let cell = column; cell < 4; cell += 1) {
        augmented[row][cell] -= factor * augmented[column][cell];
      }
    }
  }
  return augmented.map((row) => row[3]);
}

async function optimizeControl(drawing, target, initial) {
  const control = { ...initial };
  let output;
  for (let pass = 0; pass < 6; pass += 1) {
    output = await renderLocalized(drawing.source, drawing.geometry, control);
    const measured = measureDesktopGraphiteGeometry(output);
    const measuredVector = geometryVector(measured);
    const targetVector = geometryVector(target);
    const error = targetVector.map((value, index) => value - measuredVector[index]);
    if (Math.hypot(error[0], error[1]) < 0.25 && Math.abs(error[2]) < 0.0015) break;

    const perturbations = [
      { cx: 4, cy: 0, logScale: 0 },
      { cx: 0, cy: 4, logScale: 0 },
      { cx: 0, cy: 0, logScale: 0.006 },
    ];
    const columns = [];
    for (const perturbation of perturbations) {
      const candidate = {
        cx: control.cx + perturbation.cx,
        cy: control.cy + perturbation.cy,
        scale: control.scale * Math.exp(perturbation.logScale),
      };
      const candidateOutput = await renderLocalized(drawing.source, drawing.geometry, candidate);
      const candidateVector = geometryVector(measureDesktopGraphiteGeometry(candidateOutput));
      const amount = perturbation.cx || perturbation.cy || perturbation.logScale;
      columns.push(candidateVector.map((value, index) => (value - measuredVector[index]) / amount));
    }
    const jacobian = [0, 1, 2].map((row) => columns.map((column) => column[row]));
    const correction = solveThreeByThree(jacobian, error);
    if (!correction?.every(Number.isFinite)) break;
    control.cx += Math.max(-20, Math.min(20, correction[0] * 0.75));
    control.cy += Math.max(-20, Math.min(20, correction[1] * 0.75));
    control.scale *= Math.exp(Math.max(-0.03, Math.min(0.03, correction[2] * 0.75)));
  }
  output = await renderLocalized(drawing.source, drawing.geometry, control);
  return { control, output };
}

export function desktopPulseMetrics(geometries) {
  const first = geometries[0];
  const last = geometries.at(-1);
  let maxCentroidStepPx = 0;
  let maxAreaScaleStepPercent = 0;
  let maxCentroidTrajectoryErrorPx = 0;
  let maxAreaTrajectoryErrorPercent = 0;

  for (let index = 0; index < geometries.length; index += 1) {
    const progress = (DRAWINGS[index].progress - DRAWINGS[0].progress)
      / (DRAWINGS.at(-1).progress - DRAWINGS[0].progress);
    const target = {
      cx: first.cx + ((last.cx - first.cx) * progress),
      cy: first.cy + ((last.cy - first.cy) * progress),
      momentArea: Math.exp(
        Math.log(first.momentArea)
        + ((Math.log(last.momentArea) - Math.log(first.momentArea)) * progress),
      ),
    };
    const geometry = geometries[index];
    maxCentroidTrajectoryErrorPx = Math.max(
      maxCentroidTrajectoryErrorPx,
      Math.hypot(geometry.cx - target.cx, geometry.cy - target.cy),
    );
    maxAreaTrajectoryErrorPercent = Math.max(
      maxAreaTrajectoryErrorPercent,
      Math.abs((Math.sqrt(geometry.momentArea / target.momentArea) - 1) * 100),
    );
    if (index === 0) continue;
    const previous = geometries[index - 1];
    maxCentroidStepPx = Math.max(
      maxCentroidStepPx,
      Math.hypot(geometry.cx - previous.cx, geometry.cy - previous.cy),
    );
    maxAreaScaleStepPercent = Math.max(
      maxAreaScaleStepPercent,
      Math.abs((Math.sqrt(geometry.momentArea / previous.momentArea) - 1) * 100),
    );
  }

  return {
    maxCentroidStepPx,
    maxAreaScaleStepPercent,
    maxCentroidTrajectoryErrorPx,
    maxAreaTrajectoryErrorPercent,
    monotonic: {
      centroidX: geometries.every((value, index) => index === 0 || value.cx > geometries[index - 1].cx),
      centroidY: geometries.every((value, index) => index === 0 || value.cy > geometries[index - 1].cy),
      momentArea: geometries.every((value, index) => index === 0 || value.momentArea > geometries[index - 1].momentArea),
    },
  };
}

export function assertDesktopPulse(metrics, geometries = undefined) {
  if (!Object.values(metrics.monotonic).every(Boolean)) {
    throw new Error(`Desktop p80/p825/p85 geometry is not monotonic: ${JSON.stringify({ monotonic: metrics.monotonic, geometries })}`);
  }
  for (const key of [
    'maxCentroidStepPx',
    'maxAreaScaleStepPercent',
    'maxCentroidTrajectoryErrorPx',
    'maxAreaTrajectoryErrorPercent',
  ]) {
    if (metrics[key] > DESKTOP_PULSE_LIMITS[key]) {
      throw new Error(`Desktop pulse ${key} ${metrics[key]} exceeds ${DESKTOP_PULSE_LIMITS[key]}.`);
    }
  }
}

function paperEdgeMad(source, output) {
  let total = 0;
  let samples = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (y >= 54 && y < 920 && x >= 890 && x < 2032 && !(y >= 815 && x < 1180)) continue;
      const offset = ((y * WIDTH) + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        total += Math.abs(source[offset + channel] - output[offset + channel]);
        samples += 1;
      }
    }
  }
  return total / samples;
}

function rightEdgeTaperMetrics(source, output) {
  const columns = [];
  // The sculpture itself can create legitimate high-contrast column changes
  // before x=1984. The final 64 px are the rail-risk zone: here edit energy
  // must ease continuously to the 16-column zero-delta delivery edge.
  for (let x = 1984; x < WIDTH; x += 1) {
    let total = 0;
    let samples = 0;
    for (let y = 54; y < 920; y += 1) {
      const offset = ((y * WIDTH) + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        total += Math.abs(source[offset + channel] - output[offset + channel]);
        samples += 1;
      }
    }
    columns.push(total / samples);
  }
  let maxAdjacentRightColumnMadStep = 0;
  for (let index = 1; index < columns.length; index += 1) {
    maxAdjacentRightColumnMadStep = Math.max(
      maxAdjacentRightColumnMadStep,
      Math.abs(columns[index] - columns[index - 1]),
    );
  }
  return {
    maxAdjacentRightColumnMadStep,
    maxLast16ColumnMad: Math.max(...columns.slice(-16)),
  };
}

export async function registerDesktopPulse(directory) {
  const drawings = await Promise.all(DRAWINGS.map(async ({ label, index, progress, anchor }) => {
    const path = resolve(directory, `drawing-${String(index).padStart(2, '0')}.png`);
    const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== WIDTH || info.height !== HEIGHT || info.channels !== 3) {
      throw new Error(`${label}: expected ${WIDTH}x${HEIGHT} RGB, received ${info.width}x${info.height}x${info.channels}.`);
    }
    return {
      label,
      path,
      progress,
      anchor,
      source: data,
      geometry: measureDesktopGraphiteGeometry(data),
    };
  }));

  const first = drawings[0].geometry;
  const last = drawings.at(-1).geometry;
  const span = drawings.at(-1).progress - drawings[0].progress;
  const outputs = [drawings[0].source];
  const controls = [];

  for (const drawing of drawings.slice(1, -1)) {
    const progress = (drawing.progress - drawings[0].progress) / span;
    const target = {
      cx: first.cx + ((last.cx - first.cx) * progress),
      cy: first.cy + ((last.cy - first.cy) * progress),
      momentArea: Math.exp(
        Math.log(first.momentArea)
        + ((Math.log(last.momentArea) - Math.log(first.momentArea)) * progress),
      ),
    };
    const initial = {
      cx: target.cx,
      cy: target.cy,
      scale: Math.sqrt(target.momentArea / drawing.geometry.momentArea),
    };
    const { control, output } = await optimizeControl(drawing, target, initial);
    outputs.push(output);
    controls.push({ label: drawing.label, target, control });
  }
  outputs.push(drawings.at(-1).source);

  const geometries = outputs.map((output) => measureDesktopGraphiteGeometry(output));
  const metrics = desktopPulseMetrics(geometries);
  assertDesktopPulse(metrics, geometries);
  const maxPaperEdgeMad = Math.max(...outputs.slice(1, -1).map(
    (output, index) => paperEdgeMad(drawings[index + 1].source, output),
  ));
  if (maxPaperEdgeMad > DESKTOP_PULSE_LIMITS.maxPaperEdgeMad) {
    throw new Error(`Desktop paper edge MAD ${maxPaperEdgeMad} exceeds ${DESKTOP_PULSE_LIMITS.maxPaperEdgeMad}.`);
  }
  const rightEdge = outputs.slice(1, -1).map(
    (output, index) => rightEdgeTaperMetrics(drawings[index + 1].source, output),
  );
  const rightEdgeMetrics = {
    maxAdjacentRightColumnMadStep: Math.max(...rightEdge.map((value) => value.maxAdjacentRightColumnMadStep)),
    maxLast16ColumnMad: Math.max(...rightEdge.map((value) => value.maxLast16ColumnMad)),
  };
  for (const key of ['maxAdjacentRightColumnMadStep', 'maxLast16ColumnMad']) {
    if (rightEdgeMetrics[key] > DESKTOP_PULSE_LIMITS[key]) {
      throw new Error(`Desktop right-edge ${key} ${rightEdgeMetrics[key]} exceeds ${DESKTOP_PULSE_LIMITS[key]}.`);
    }
  }

  const staged = [];
  try {
    for (let index = 1; index < drawings.length - 1; index += 1) {
      const stage = `${drawings[index].path}.registered`;
      await writeFile(stage, await sharp(outputs[index], {
        raw: { width: WIDTH, height: HEIGHT, channels: 3 },
      }).png({ compressionLevel: 9 }).toBuffer());
      staged.push(stage);
    }
    for (let index = 1; index < drawings.length - 1; index += 1) {
      await rename(staged[index - 1], drawings[index].path);
    }
  } finally {
    await Promise.all(staged.map((path) => rm(path, { force: true })));
  }

  return {
    labels: DRAWINGS.map(({ label }) => label),
    transformed: DRAWINGS.filter(({ anchor }) => !anchor).map(({ label }) => label),
    controls,
    geometries,
    maxPaperEdgeMad,
    ...rightEdgeMetrics,
    ...metrics,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: register-mila-story-desktop-pulse.mjs <normalized-drawing-directory>');
  process.stdout.write(`${JSON.stringify(await registerDesktopPulse(resolve(directory)), null, 2)}\n`);
}
