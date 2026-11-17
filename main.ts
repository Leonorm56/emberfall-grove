// Emberfall Grove — hands this directory's game/ and screenshots/ in to the grader.
// The game itself lives in game/ (plain static files: game/index.html and its ES modules).
// Copies both to the output directory and writes /output/dossier.json, the summary the
// judge reads, using the kit's vendored make.fun library.
//
// Serve the game locally with `node serve.ts` (http://localhost:8080).
// Outside the grader's container, set MAKEFUN_OUTPUT_DIR to choose where files land:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// The game: every static file, copied wholesale.
const gameSrc = join(here, 'game');
if (!existsSync(gameSrc)) {
  console.error(`main.ts: no game/ directory beside it (looked for ${gameSrc})`);
  process.exit(1);
}
cpSync(gameSrc, join(out, 'game'), { recursive: true });

// screenshots/ is optional in the same sense the gate treats it as required:
// only what the entry ships is copied.
const shotsSrc = join(here, 'screenshots');
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsSrc)) {
  for (const name of readdirSync(shotsSrc)) {
    const from = join(shotsSrc, name);
    if (statSync(from).isFile()) cpSync(from, join(out, 'screenshots', name));
  }
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`dossier written to ${join(out, 'dossier.json')}`);
