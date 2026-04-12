/**
 * One-shot: replace localhost API fallback so LAN dev uses same-origin /api (Vite proxy).
 * Run: node scripts/use-relative-api-in-dev.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '..', 'src');

const OLD = "import.meta.env.VITE_API_URL || 'http://localhost:5023'";
const NEW = "(import.meta.env.VITE_API_URL ?? '').toString().trim().replace(/\\/$/, '')";

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.jsx') || ent.name.endsWith('.js')) {
      let s = fs.readFileSync(p, 'utf8');
      if (!s.includes(OLD)) continue;
      fs.writeFileSync(p, s.split(OLD).join(NEW), 'utf8');
      console.log('patched', path.relative(path.join(__dirname, '..'), p));
    }
  }
}

walk(srcRoot);
console.log('done');
