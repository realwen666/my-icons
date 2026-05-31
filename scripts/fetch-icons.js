#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const SOURCES = [
  {
    name: 'hd-icons',
    repo: 'https://github.com/xushier/HD-Icons.git',
    sourcePath: '',
    targetPath: 'icons/dashboard/hd-icons',
    include: (file) => file.endsWith('.png') || file.endsWith('.svg')
  },
  {
    name: 'dashboard-icons',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/dashboard/homarr',
    include: (file) => file.endsWith('.svg')
  },
  {
    name: 'dashboard-icons-png',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'png',
    targetPath: 'icons/dashboard/homarr-png',
    include: (file) => file.endsWith('.png')
  },
  {
    name: 'whitesur',
    repo: 'https://github.com/vinceliuice/WhiteSur-icon-theme.git',
    sourcePath: 'src/apps/scalable',
    targetPath: 'icons/macos/whitesur',
    include: (file) => file.endsWith('.svg')
  }
];

const TEMP_DIR = '.temp';
const ROOT = process.cwd();

function clean() {
  if (fs.existsSync(TEMP_DIR)) fs.removeSync(TEMP_DIR);
}

function clone(repo, dir) {
  try {
    execSync(`git clone --depth 1 ${repo} ${dir}`, { stdio: 'pipe', timeout: 120000 });
    return true;
  } catch (e) {
    console.error('Clone failed:', repo);
    return false;
  }
}

function copy(src, dst, filter) {
  if (!fs.existsSync(src)) return 0;
  fs.ensureDirSync(dst);
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    let st;
    try { st = fs.lstatSync(s); } catch (e) { continue; }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      n += copy(s, path.join(dst, f), filter);
    } else if (filter(f)) {
      fs.copyFileSync(s, path.join(dst, f));
      n++;
    }
  }
  return n;
}

function cleanOld() {
  const d = path.join(ROOT, 'icons');
  if (!fs.existsSync(d)) return;
  for (const c of fs.readdirSync(d)) {
    if (c !== 'custom') fs.removeSync(path.join(d, c));
  }
}

async function main() {
  clean();
  cleanOld();

  for (const s of SOURCES) {
    const dir = path.join(TEMP_DIR, s.name);
    console.log(`\nFetching: ${s.name}`);
    if (!clone(s.repo, dir)) continue;
    const n = copy(path.join(dir, s.sourcePath), path.join(ROOT, s.targetPath), s.include);
    console.log(`  Copied ${n} icons`);
    fs.removeSync(dir);
  }

  clean();

  let total = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const i of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, i.name);
      if (i.isDirectory()) walk(p);
      else if (i.name.endsWith('.svg') || i.name.endsWith('.png')) total++;
    }
  };
  walk(path.join(ROOT, 'icons'));

  fs.ensureDirSync(path.join(ROOT, 'dist'));
  fs.writeFileSync(path.join(ROOT, 'dist', 'metadata.json'), JSON.stringify({ total, at: new Date().toISOString() }, null, 2));
  console.log(`\nDone. Total: ${total} icons`);
}

main().catch(console.error);
