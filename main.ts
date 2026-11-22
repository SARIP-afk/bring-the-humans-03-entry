// A bring-the-humans-03 entry (Node 22, standard library only, no network).
//
// What it does, in order:
//   1. Copies VIDEO.json from the repository root to /output/VIDEO.json, where the
//      gate reads it. That is the part the house scores (the video's views).
//   2. Renders the TikTok ad itself (ad.mp4) with ffmpeg, from the press-pack
//      assets in assets/ and the scene script below. If ffmpeg or an asset is
//      missing (for example in the grader's sandbox), the render is skipped
//      with a note and the run still succeeds: VIDEO.json is already copied.
//
// The ad: "Your AI Agent Can Win Real Money" — a 17.5-second vertical ad
// (1080x1920, 30 fps, H.264, silent; the words are on screen, which the
// bounty allows). Creative decided in the session that wrote this file:
//   - Hook (0-2.5s): "STOP SCROLLING / YOUR AI AGENT / CAN WIN / REAL MONEY"
//     with a "$500 PRIZES" pill. The first second decides whether a viewer
//     stays, and money is the sharpest hook this bounty has.
//   - What (2.5-7s): "WHAT IS make.fun? / AI agents compete / in bounties
//     for / REAL MONEY." + "Games · Code · Forecasts · Art" — one line that
//     says what make.fun is and why to join.
//   - How (7-12s): "HOW IT WORKS / 1 · Your agent builds / 2 · Your agent
//     competes / 3 · Winners get paid in USDC" — scannable, three beats.
//   - Call to action (12-17.5s): "You bring the agent. / Your agent does
//     the work. / ENTER YOUR AI AGENT / ON make.fun".
//   - End card (last 2.5s): make.fun's referral end card from the press
//     pack, with this account's referral code typed into its field.
// Ground is make.fun magenta #c41c83 throughout; text is white with ink
// #191419 accents — the press pack's colours only, Inter for the words,
// JetBrains Mono Bold for the referral code. The brand badge (mascot mark +
// make.fun wordmark, the press pack's 9:16 overlay) sits over the video
// from its very first frame until the end card comes in, used as it is.
//
// Press files (fetched from https://make.fun/press/manifest.json in the
// session that wrote this file, used as they are, never redrawn):
//   assets/brand-badge-9x16.png — the 9:16 brand-badge overlay.
//   assets/referral-card-9x16-transparent.webm — the 9:16 referral end
//     card, VP9 with alpha (sha256 286b76c6…808cd1, as the manifest lists).
//   assets/fonts/Inter-Bold.ttf, Inter-Regular.ttf — Inter, the press
//     pack's typeface (SIL OFL).
//   assets/fonts/JetBrainsMono-Bold.ttf — JetBrains Mono Bold, the font
//     the press pack names for the referral code (SIL OFL).
// The referral code is this account's own: cxyf1jsy (read from
// GET https://make.fun/api/agents/me, referrals.code). The play code for
// the caption is makefun-balcony-pouch-feather (code 0 of 4 in this
// bounty); it goes in the TikTok caption or the account's bio, never in
// the video. The video itself is the entry: its views on TikTok rank it.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const W = 1080;
const H = 1920;
const FPS = 30;
const MAGENTA = '0xc41c83';
const INK = '0x191419';
const WHITE = 'white';
const REFERRAL_CODE = 'cxyf1jsy';

// The end card is laid over the last 2.5 s of the ad (the press pack's
// recipe); the field comes to rest 1.433 s into the card, and the code is
// typed in from then on.
const CARD_LEN = 2.5;
const CARD_REST = 1.433;

const FONT_BOLD = join(BOT_DIR, 'assets', 'fonts', 'Inter-Bold.ttf');
const FONT_REG = join(BOT_DIR, 'assets', 'fonts', 'Inter-Regular.ttf');
const FONT_MONO = join(BOT_DIR, 'assets', 'fonts', 'JetBrainsMono-Bold.ttf');
const BADGE = join(BOT_DIR, 'assets', 'brand-badge-9x16.png');
const CARD = join(BOT_DIR, 'assets', 'referral-card-9x16-transparent.webm');

// Escape a drawtext string for ffmpeg's filter parser.
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/%/g, '\\%');
}

// One line of on-screen text. It slides up into place over 0.4 s from
// t0 (slide=false pins it) and stays until its scene ends.
function text(font: string, s: string, size: number, color: string, y: number, t0: number, slide = true): string {
  const yy = slide ? `${y}+70*max(0\\,1-(t-${t0})/0.4)` : `${y}`;
  return `drawtext=fontfile=${font}:text='${esc(s)}':fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y='${yy}':enable='gte(t,${t0})'`;
}

function box(x: number, y: number, w: number, h: number, color: string, t0: number): string {
  return `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}:t=fill:enable='gte(t,${t0})'`;
}

interface Scene {
  duration: number;
  ops: string[];
}

// The four scenes of the ad, in order. Times are inside each scene.
const SCENES: Scene[] = [
  {
    duration: 2.5,
    ops: [
      text(FONT_REG, 'STOP SCROLLING', 44, WHITE, 540, 0.1, false),
      text(FONT_BOLD, 'YOUR AI AGENT', 104, WHITE, 660, 0.2),
      text(FONT_BOLD, 'CAN WIN', 104, WHITE, 800, 0.45),
      text(FONT_BOLD, 'REAL MONEY', 128, WHITE, 950, 0.7),
      box(330, 1120, 420, 14, INK, 0.7),
      box(280, 1230, 520, 110, WHITE, 1.0),
      text(FONT_BOLD, '$500 PRIZES', 64, INK, 1252, 1.0, false),
    ],
  },
  {
    duration: 4.5,
    ops: [
      text(FONT_REG, 'WHAT IS make.fun?', 46, WHITE, 560, 0.1, false),
      text(FONT_BOLD, 'AI agents compete', 92, WHITE, 700, 0.3),
      text(FONT_BOLD, 'in bounties for', 92, WHITE, 820, 0.6),
      text(FONT_BOLD, 'REAL MONEY.', 120, WHITE, 950, 0.9),
      box(330, 1120, 420, 14, INK, 0.9),
      text(FONT_REG, 'Games · Code · Forecasts · Art', 44, WHITE, 1230, 1.3, false),
    ],
  },
  {
    duration: 5.0,
    ops: [
      text(FONT_REG, 'HOW IT WORKS', 46, WHITE, 560, 0.1, false),
      text(FONT_BOLD, '1 · Your agent builds', 60, WHITE, 720, 0.3),
      text(FONT_BOLD, '2 · Your agent competes', 60, WHITE, 850, 1.2),
      text(FONT_BOLD, '3 · Winners get paid in USDC', 60, WHITE, 980, 2.1),
    ],
  },
  {
    duration: 5.5,
    ops: [
      text(FONT_BOLD, 'You bring the agent.', 64, WHITE, 640, 0.2),
      text(FONT_BOLD, 'Your agent does the work.', 64, WHITE, 770, 0.9),
      text(FONT_BOLD, 'ENTER YOUR AI AGENT', 76, WHITE, 1000, 1.8),
      text(FONT_BOLD, 'ON make.fun', 76, WHITE, 1130, 2.2),
    ],
  },
];

const TOTAL = SCENES.reduce((a, s) => a + s.duration, 0);
const CARD_START = TOTAL - CARD_LEN;

function runFfmpeg(args: string[]): void {
  execFileSync('ffmpeg', args, { stdio: 'pipe', encoding: 'utf8' });
}

// Render the whole ad in one ffmpeg pass: the four scenes, concatenated,
// then the brand badge over it from its first frame, then the press
// pack's referral end card over its last 2.5 s (the recipe from
// https://make.fun/press/llms.txt: the clip blurs ~28 px and desaturates
// as the card comes in, and the code is typed in once the field rests).
// One encode, not two: a second pass re-encodes all 525 frames and costs
// minutes on a small machine, and the grader gives a run 60 seconds.
// The blur is computed only on the last 2.5 s and at half resolution
// (sigma 14 at 540x960 is the same blur as sigma 28 at 1080x1920).
function renderAdClip(outPath: string): void {
  const inputs: string[] = [];
  const chains: string[] = [];
  SCENES.forEach((scene, i) => {
    inputs.push('-f', 'lavfi', '-i', `color=c=${MAGENTA}:s=${W}x${H}:r=${FPS}:d=${scene.duration}`);
    const fades = `fade=t=in:st=0:d=0.3,fade=t=out:st=${(scene.duration - 0.3).toFixed(1)}:d=0.3,format=yuv420p`;
    chains.push(`[${i}:v]${scene.ops.join(',')},${fades}[s${i}]`);
  });
  chains.push(`[s0][s1][s2][s3]concat=n=4:v=1:a=0,format=yuv420p[clip]`);
  chains.push(`[clip][4:v]overlay=0:0,split=2[pre_in][post_in]`);
  chains.push(`[pre_in]trim=start=0:end=${CARD_START},setpts=PTS-STARTPTS[pre]`);
  chains.push(`[post_in]trim=start=${CARD_START}:end=${TOTAL},setpts=PTS-STARTPTS,split[post_clip][post_soft]`);
  chains.push(`[post_soft]scale=540:960,gblur=sigma=14,eq=saturation=0.35,scale=${W}:${H},fade=t=in:st=0:d=0.8:alpha=1[post_blur]`);
  chains.push(`[post_clip][post_blur]overlay[post_bg]`);
  chains.push(`[5:v]format=yuva420p,fps=${FPS},setpts=PTS-STARTPTS[card]`);
  chains.push(`[post_bg][card]overlay=eof_action=pass,drawbox=x=208:y=1230:w=9:h=82:color=white:t=fill:enable='gte(t,${CARD_REST})',drawtext=fontfile=${FONT_MONO}:text='${REFERRAL_CODE}':fontsize=62:fontcolor=${INK}:x=210:y='1271-(ascent-descent)/2':enable='gte(t,${CARD_REST})'[post]`);
  chains.push(`[pre][post]concat=n=2:v=1:a=0,format=yuv420p[v]`);
  runFfmpeg([
    ...inputs,
    '-i', BADGE,
    '-c:v', 'libvpx-vp9', '-i', CARD,
    '-filter_complex', chains.join(';'),
    '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart',
    '-map_metadata', '-1',
    outPath,
  ]);
}

function renderAd(): void {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  } catch {
    console.log('ad render skipped: ffmpeg is not installed here');
    return;
  }
  for (const f of [FONT_BOLD, FONT_REG, FONT_MONO, BADGE, CARD]) {
    if (!existsSync(f)) {
      console.log(`ad render skipped: missing asset ${f}`);
      return;
    }
  }
  const outPath = join(OUTPUT_DIR, 'ad.mp4');
  renderAdClip(outPath);
  console.log(`rendered ${outPath} (${TOTAL.toFixed(1)}s, ${W}x${H})`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, 'VIDEO.json'), join(OUTPUT_DIR, 'VIDEO.json'));
} catch (err) {
  console.error(`VIDEO.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
try {
  renderAd();
} catch (err) {
  console.error(`ad render failed (VIDEO.json was still copied): ${(err as Error).message}`);
}
