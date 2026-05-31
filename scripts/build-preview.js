#!/usr/bin/env node
/**
 * build-preview.js
 * 生成图标预览 HTML 页面
 * 基于模板填充图标数据
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// ==================== 配置 ====================
const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// GitHub 仓库地址（用于页脚链接）
const REPO_URL = 'https://github.com/yourname/github-icon-collection';

// ==================== 核心逻辑 ====================

/**
 * 生成合法的 symbol ID（与 build-sprite.js 保持一致）
 */
function generateSymbolId(relativePath) {
  const id = relativePath
    .replace(/\.svg$/, '')
    .replace(/[\\\/]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return id;
}

/**
 * 提取 SVG 的 viewBox
 */
function extractViewBox(content) {
  const match = content.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : '0 0 24 24';
}

/**
 * 提取 SVG 内部内容
 */
function extractContent(content) {
  let inner = content
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/<!DOCTYPE[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');
  
  inner = inner
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, '');
  
  return inner.trim();
}

/**
 * 扫描所有图标并按分类组织
 */
function scanIcons() {
  const categories = {};
  const allIcons = [];
  
  // 扫描图标目录
  const categories_dirs = fs.readdirSync(ICONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  for (const cat of categories_dirs) {
    const catPath = path.join(ICONS_DIR, cat);
    const pattern = path.join(catPath, '**', '*.svg').replace(/\\/g, '/');
    const files = glob.sync(pattern);
    
    if (files.length === 0) continue;
    
    const icons = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ICONS_DIR, file);
      const symbolId = generateSymbolId(relativePath);
      const viewBox = extractViewBox(content);
      const innerContent = extractContent(content);
      
      // 提取显示名称
      const displayName = path.basename(file, '.svg');
      
      icons.push({
        id: symbolId,
        name: displayName,
        viewBox,
        content: innerContent,
        path: relativePath
      });
    }
    
    // 按名称排序
    icons.sort((a, b) => a.name.localeCompare(b.name));
    
    categories[cat] = icons;
    allIcons.push(...icons);
  }
  
  return { categories, allIcons };
}

/**
 * 生成分类按钮
 */
function generateCategoryButtons(categories) {
  return Object.keys(categories).map(cat => {
    const label = getCategoryLabel(cat);
    const count = categories[cat].length;
    return `<button class="category-btn" data-category="${cat}">${label} (${count})</button>`;
  }).join('\n    ');
}

/**
 * 获取分类显示名称
 */
function getCategoryLabel(category) {
  const labels = {
    'ui': 'UI 图标',
    'brands': '品牌 Logo',
    'flags': '国旗/天气',
    'dashboard': '仪表盘图标',
    'macos': 'macOS 图标',
    'fluent': 'Fluent 图标',
    'dev': '开发图标',
    'linux': 'Linux 主题',
    'custom': '自定义'
  };
  return labels[category] || category;
}

/**
 * 生成图标内容
 */
function generateIconContent(categories) {
  return Object.entries(categories).map(([cat, icons]) => {
    const cards = icons.map(icon => `
      <div class="icon-card" data-id="${icon.id}" data-name="${icon.name.toLowerCase()}" title="点击复制 ID: ${icon.id}">
        <svg viewBox="${icon.viewBox}" aria-hidden="true">
          ${icon.content}
        </svg>
        <div class="icon-name">${icon.name}</div>
        <div class="icon-size-label">${icons.length > 100 ? icon.id.substring(0, 20) : icon.id}</div>
      </div>
    `).join('');
    
    return `
    <section class="category-section" data-category="${cat}">
      <h2 class="category-title">${getCategoryLabel(cat)} (${icons.length})</h2>
      <div class="icon-grid">
        ${cards}
      </div>
    </section>`;
  }).join('\n');
}

/**
 * 生成 Sprite 内容（用于预览页面内联）
 */
function generateSpriteContent(categories) {
  const symbols = [];
  
  for (const icons of Object.values(categories)) {
    for (const icon of icons) {
      symbols.push(`<symbol id="${icon.id}" viewBox="${icon.viewBox}">${icon.content}</symbol>`);
    }
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  ${symbols.join('\n  ')}
</svg>`;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('📱 预览页面生成工具');
  console.log('========================================\n');
  
  // 检查模板文件
  const templatePath = path.join(TEMPLATES_DIR, 'preview.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ 模板文件不存在:', templatePath);
    return;
  }
  
  // 读取模板
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // 扫描图标
  console.log('📁 扫描图标文件...');
  const { categories, allIcons } = scanIcons();
  
  if (allIcons.length === 0) {
    console.log('⚠️ 没有找到图标文件');
    return;
  }
  
  console.log(`   ✅ 找到 ${allIcons.length} 个图标，${Object.keys(categories).length} 个分类\n`);
  
  // 确保 dist 目录存在
  fs.ensureDirSync(DIST_DIR);
  
  // 替换模板变量
  console.log('📝 生成预览页面...');
  
  template = template.replace(/\{\{TITLE\}\}/g, 'GitHub Icon Collection');
  template = template.replace(/\{\{GENERATED_AT\}\}/g, new Date().toLocaleString('zh-CN'));
  template = template.replace(/\{\{REPO_URL\}\}/g, REPO_URL);
  template = template.replace(/\{\{CATEGORY_BUTTONS\}\}/g, generateCategoryButtons(categories));
  template = template.replace(/\{\{ICON_CONTENT\}\}/g, generateIconContent(categories));
  template = template.replace(/\{\{SPRITE_CONTENT\}\}/g, generateSpriteContent(categories));
  
  // 写入文件
  const outputPath = path.join(DIST_DIR, 'index.html');
  fs.writeFileSync(outputPath, template, 'utf-8');
  
  console.log(`   ✅ ${outputPath}`);
  
  // 汇总
  console.log('\n========================================');
  console.log('📊 预览页面生成完成');
  console.log('========================================');
  console.log(`📦 总图标数: ${allIcons.length}`);
  console.log(`📂 分类:`);
  for (const [cat, icons] of Object.entries(categories)) {
    console.log(`   - ${getCategoryLabel(cat)}: ${icons.length} 个`);
  }
  console.log('\n📁 输出文件:');
  console.log('   dist/index.html - 预览页面');
  console.log('\n💡 部署到 GitHub Pages 后即可在线预览');
}

main().catch(console.error);
