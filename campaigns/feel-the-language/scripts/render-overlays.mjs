#!/usr/bin/env node

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fonts = path.join(root, 'assets', 'fonts');
const output = path.join(root, 'work', 'overlays');

await mkdir(output, { recursive: true });

const [manrope, yeseva] = await Promise.all([
  readFile(path.join(fonts, 'Manrope-Variable.ttf'), 'base64'),
  readFile(path.join(fonts, 'YesevaOne-Regular.ttf'), 'base64'),
]);

const layouts = {
  landscape: {
    width: 1920,
    height: 1080,
    x: 116,
    top: 120,
    headlineSize: 91,
    headlineLeading: 104,
    labelSize: 22,
    endWordmarkSize: 126,
    endTaglineSize: 45,
    buttonWidth: 392,
  },
  vertical: {
    width: 1080,
    height: 1920,
    x: 82,
    top: 168,
    headlineSize: 105,
    headlineLeading: 120,
    labelSize: 24,
    endWordmarkSize: 138,
    endTaglineSize: 48,
    buttonWidth: 420,
  },
};

const beats = [
  { id: '01-know', lines: ['You know', 'the words.'] },
  { id: '02-feel', lines: ['Now let them', 'feel like yours.'], accent: 1 },
  { id: '03-speak', lines: ['Speak', 'with Mila.'], accent: 1 },
  { id: '04-voice', lines: ['English, in', 'your own voice.'], accent: 1 },
];

function stylesheet() {
  return `
    @font-face {
      font-family: 'Campaign Manrope';
      src: url(data:font/ttf;base64,${manrope});
      font-weight: 200 800;
    }
    @font-face {
      font-family: 'Campaign Yeseva';
      src: url(data:font/ttf;base64,${yeseva});
      font-weight: 400;
    }
    .sans { font-family: 'Campaign Manrope', sans-serif; }
    .display { font-family: 'Campaign Yeseva', serif; }
  `;
}

function svgShell(layout, body) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
      <style>${stylesheet()}</style>
      ${body}
    </svg>
  `);
}

function beatSvg(layout, beat) {
  const startY = layout.top + 86;
  const lines = beat.lines.map((line, index) => {
    const color = beat.accent === index ? '#d9006c' : '#26343b';
    return `<text x="${layout.x}" y="${startY + index * layout.headlineLeading}" class="sans" font-size="${layout.headlineSize}" font-weight="760" fill="${color}" letter-spacing="-3">${line}</text>`;
  }).join('\n');

  return svgShell(layout, `
    <rect x="${layout.x}" y="${layout.top}" width="72" height="7" rx="3.5" fill="#d9006c"/>
    <text x="${layout.x + 90}" y="${layout.top + 8}" class="sans" font-size="${layout.labelSize}" font-weight="700" fill="#456a60" letter-spacing="4">FEEL THE LANGUAGE</text>
    ${lines}
  `);
}

function endSvg(layout) {
  const landscape = layout.width > layout.height;
  const wordmarkY = landscape ? 350 : 330;
  const taglineY = wordmarkY + (landscape ? 92 : 104);
  const buttonY = taglineY + (landscape ? 86 : 105);
  const buttonH = landscape ? 78 : 86;
  const urlY = buttonY + buttonH + 60;
  return svgShell(layout, `
    <rect x="${layout.x}" y="${wordmarkY - 120}" width="7" height="${landscape ? 390 : 440}" rx="3.5" fill="#d9006c"/>
    <text x="${layout.x + 46}" y="${wordmarkY}" class="display" font-size="${layout.endWordmarkSize}" fill="#26343b">Mila</text>
    <text x="${layout.x + 46}" y="${taglineY}" class="sans" font-size="${layout.endTaglineSize}" font-weight="650" fill="#26343b" letter-spacing="-1.5">English, in your own voice.</text>
    <rect x="${layout.x + 46}" y="${buttonY}" width="${layout.buttonWidth}" height="${buttonH}" rx="${buttonH / 2}" fill="#d9006c"/>
    <text x="${layout.x + 46 + layout.buttonWidth / 2}" y="${buttonY + buttonH * 0.66}" class="sans" font-size="${landscape ? 28 : 31}" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.4">START SPEAKING FREE</text>
    <text x="${layout.x + 46}" y="${urlY}" class="sans" font-size="${landscape ? 25 : 29}" font-weight="650" fill="#456a60" letter-spacing="1.5">mila.purangpt.com</text>
    <text x="${layout.x + 46}" y="${urlY + 50}" class="sans" font-size="${landscape ? 19 : 22}" font-weight="650" fill="#5e6a6a" letter-spacing="2.2">NO CARD  •  NO JUDGEMENT</text>
  `);
}

for (const [name, layout] of Object.entries(layouts)) {
  for (const beat of beats) {
    await sharp(beatSvg(layout, beat)).png().toFile(path.join(output, `${name}-${beat.id}.png`));
  }
  await sharp(endSvg(layout)).png().toFile(path.join(output, `${name}-05-end.png`));
}

process.stdout.write(`${output}\n`);
