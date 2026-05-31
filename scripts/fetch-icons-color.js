#!/usr/bin/env node
/**
 * fetch-icons.js - 彩色图标版本
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// ==================== 彩色图标源 ====================
const SOURCES = [
  // 仪表盘/应用图标（彩色）
  {
    name: 'hd-icons',
    repo: 'https://github.com/xushier/HD-Icons.git',
    sourcePath: '',
    targetPath: 'icons/dashboard/hd-icons',
    include: (file) => file.endsWith('.png') || file.endsWith('.svg'),
    description: 'HD-Icons 高清彩色仪表盘图标'
  },
  {
    name: 'dashboard-icons',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/dashboard/homarr',
    include: (file) => file.endsWith('.svg'),
    description: 'Homarr 彩色仪表盘图标'
  },
  {
    name: 'dashboard-icons-png',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'png',
    targetPath: 'icons/dashboard/homarr-png',
    include: (file) => file.endsWith('.png'),
    description: 'Homarr 彩色仪表盘图标 PNG'
  },
  // macOS 图标主题（彩色）
  {
    name: 'whitesur',
    repo: 'https://github.com/vinceliuice/WhiteSur-icon-theme.git',
    sourcePath: 'src/apps/scalable',
    targetPath: 'icons/macos/whitesur',
    include: (file) => file.endsWith('.svg'),
    description: 'WhiteSur macOS Big Sur 彩色图标'
  },
  // Fluent Emoji（彩色）
  {
    name: 'fluent-emoji',
    repo: 'https://github.com/microsoft/fluentui-emoji.git',
    sourcePath: 'assets',
    targetPath: 'icons/emoji/fluent',
    include: (file) => file.endsWith('.svg') || file.endsWith('.png'),
    description: 'Microsoft Fluent 彩色 Emoji'
  }
];

// ==================== 核心逻辑 ====================

const TEMP_DIR = '.temp';
const ROOT_DIR = process.cwd();

function cleanTemp() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.removeSync(TEMP_DIR);
  }
}

function cloneRepo(repo, targetDir, branch) {
  console.log(`Cloning: ${repo}${branch ? ` (${branch})` : ''}`);
  try {
    const branchFlag = branch ? `--branch ${branch}` : '';
    execSync(`git clone --depth 1 ${branchFlag} ${repo} ${targetDir}`, {
      stdio: 'pipe',
      timeout: 120000
    });
    return true;
  } catch (error) {
    console.error(`Clone failed: ${repo}`);
    return false;
  }
}

function copyFiles(sourceDir, targetDir, filterFn) {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`Source not found: ${sourceDir}`);
    return 0;
  }

  fs.ensureDirSync(targetDir);

  const files = fs.readdirSync(sourceDir);
  let count = 0;

  for (const file of files) {
    const srcFile = path.join(sourceDir, file);
    let stat;
    try {
      stat = fs.lstatSync(srcFile);
    } catch (e) {
      continue;
    }

    if (stat.isSymbolicLink()) continue;

    if (stat.isDirectory()) {
      const subCount = copyFiles(srcFile, path.join(targetDir, file), filterFn);
      count += subCount;
    } else if (filterFn(file)) {
      fs.copyFileSync(srcFile, path.join(targetDir, file));
      count++;
    }
  }

  return count;
}

function cleanOldIcons() {
  const iconsDir = path.join(ROOT_DIR, 'icons');
  if (!fs.existsSync(iconsDir)) return;

  const categories = fs.readdirSync(iconsDir);
  for (const cat of categories) {
    if (cat === 'custom') continue;
    fs.removeSync(path.join(iconsDir, cat));
  }
}

async function main() {
  console.log('Color Icon Fetcher');
  console.log('===================\n');

  const startTime = Date.now();

  cleanTemp();
  cleanOldIcons();

  const results = [];

  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    console.log(`\n[${i + 1}/${SOURCES.length}] ${source.name}`);

    const tempCloneDir = path.join(TEMP_DIR, source.name);

    const cloned = cloneRepo(source.repo, tempCloneDir, source.branch);
    if (!cloned) {
      results.push({ name: source.name, status: 'failed', count: 0 });
      continue;
    }

    const sourcePath = path.join(tempCloneDir, source.sourcePath);
    const targetPath = path.join(ROOT_DIR, source.targetPath);
    const count = copyFiles(sourcePath, targetPath, source.include);

    results.push({ name: source.name, status: 'success', count });
    console.log(`  Copied ${count} icons -> ${source.targetPath}`);

    fs.removeSync(tempCloneDir);
  }

  cleanTemp();

  let totalIcons = 0;
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) walk(full);
      else if (item.name.endsWith('.svg') || item.name.endsWith('.png')) totalIcons++;
    }
  };
  walk(path.join(ROOT_DIR, 'icons'));

  const metadata = {
    generatedAt: new Date().toISOString(),
    totalIcons,
    sources: results.filter(r => r.status === 'success').map(r => ({
      name: r.name,
      count: r.count
    }))
  };

  fs.ensureDirSync(path.join(ROOT_DIR, 'dist'));
  fs.writeFileSync(
    path.join(ROOT_DIR, 'dist', 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n===================');
  console.log('Done');
  console.log(`Time: ${duration}s`);
  console.log(`Total: ${totalIcons} icons`);
  console.log(`OK: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Fail: ${results.filter(r => r.status === 'failed').length}`);
}

main().catch(console.error);
