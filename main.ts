// FridayFinds — Black Friday deal finder, hand-in program (Node 22, standard
// library only). The site lives in app/ beside this file as plain static
// files, and its screenshots live in screenshots/. This program copies both
// into the output directory and writes dossier.json there with the kit's own
// vendored library, so the scorer can rebuild the same dossier byte for byte.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The grader runs it twice in a sandbox with no network; copying files is
// deterministic, so both runs write identical bytes.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail fast, naming the file, when the entry is past a cap the scorer
// would refuse — a screenshot over 256 KiB, or app/ over 16 MiB — instead
// of handing in a dossier the gate rejects.
function treeBytes(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stats = statSync(path);
    total += stats.isDirectory() ? treeBytes(path) : stats.size;
  }
  return total;
}
const appBytes = treeBytes(join(here, "app"));
if (appBytes > 16777216) {
  throw new Error(`app/ is ${appBytes} bytes, over the 16 MiB cap`);
}
for (const name of readdirSync(join(here, "screenshots"))) {
  const size = statSync(join(here, "screenshots", name)).size;
  if (size > 262144) {
    throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps (from the kit's reference/gate.json): at most 4
// screenshots of at most 256 KiB each, at most 993 files and 16 MiB in app/,
// and the dossier text capped at 160 KiB.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  })
);
