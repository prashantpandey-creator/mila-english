#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [file, mode, widthArg, heightArg, framesArg, durationArg] = process.argv.slice(2);

if (!file || !mode || !widthArg || !heightArg || !framesArg || !durationArg) {
  throw new Error(
    'Usage: verify-mila-story-film.mjs FILE MODE WIDTH HEIGHT FRAMES DURATION',
  );
}

const expected = {
  width: Number(widthArg),
  height: Number(heightArg),
  frames: Number(framesArg),
  duration: Number(durationArg),
};

const probe = JSON.parse(execFileSync(
  'ffprobe',
  ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
  { encoding: 'utf8' },
));
const videos = probe.streams.filter((stream) => stream.codec_type === 'video');
const audios = probe.streams.filter((stream) => stream.codec_type === 'audio');

function requireValue(condition, message) {
  if (!condition) throw new Error(`${mode}: ${message}`);
}

requireValue(videos.length === 1, `expected one video stream, found ${videos.length}`);
requireValue(audios.length === 0, `expected no audio streams, found ${audios.length}`);

const video = videos[0];
requireValue(video.codec_name === 'h264', `unexpected codec ${video.codec_name}`);
requireValue(video.codec_tag_string === 'avc1', `unexpected codec tag ${video.codec_tag_string}`);
requireValue(video.profile === 'High', `unexpected profile ${video.profile}`);
requireValue(Number(video.level) === 42, `unexpected H.264 level ${video.level}`);
requireValue(Number(video.width) === expected.width, `unexpected width ${video.width}`);
requireValue(Number(video.height) === expected.height, `unexpected height ${video.height}`);
requireValue(video.pix_fmt === 'yuv420p', `unexpected pixel format ${video.pix_fmt}`);
requireValue(video.field_order === 'progressive', `unexpected field order ${video.field_order}`);
requireValue(video.color_range === 'tv', `unexpected color range ${video.color_range}`);
requireValue(video.color_space === 'bt709', `unexpected color space ${video.color_space}`);
requireValue(video.color_transfer === 'bt709', `unexpected transfer ${video.color_transfer}`);
requireValue(video.color_primaries === 'bt709', `unexpected primaries ${video.color_primaries}`);
requireValue(video.r_frame_rate === '12/1', `unexpected frame rate ${video.r_frame_rate}`);
requireValue(video.avg_frame_rate === '12/1', `unexpected average frame rate ${video.avg_frame_rate}`);
requireValue(Number(video.nb_frames) === expected.frames, `unexpected frame count ${video.nb_frames}`);
requireValue(
  Math.abs(Number(probe.format.duration) - expected.duration) < 0.01,
  `unexpected duration ${probe.format.duration}`,
);

const bytes = readFileSync(file);
const topLevelBoxes = [];
let offset = 0;
while (offset + 8 <= bytes.length) {
  let size = bytes.readUInt32BE(offset);
  const type = bytes.toString('ascii', offset + 4, offset + 8);
  let headerSize = 8;
  if (size === 1) {
    requireValue(offset + 16 <= bytes.length, `truncated ${type} box`);
    const largeSize = bytes.readBigUInt64BE(offset + 8);
    requireValue(largeSize <= BigInt(Number.MAX_SAFE_INTEGER), `${type} box is too large`);
    size = Number(largeSize);
    headerSize = 16;
  } else if (size === 0) {
    size = bytes.length - offset;
  }
  requireValue(size >= headerSize && offset + size <= bytes.length, `invalid ${type} box size`);
  topLevelBoxes.push(type);
  offset += size;
}

const moov = topLevelBoxes.indexOf('moov');
const mdat = topLevelBoxes.indexOf('mdat');
requireValue(moov >= 0 && mdat >= 0 && moov < mdat, 'MP4 is not fast-started');

process.stdout.write(`${JSON.stringify({
  mode,
  width: video.width,
  height: video.height,
  frames: Number(video.nb_frames),
  duration: Number(probe.format.duration),
  bytes: bytes.length,
  boxes: topLevelBoxes,
})}\n`);
