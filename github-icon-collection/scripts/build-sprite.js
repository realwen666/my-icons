#!/usr/bin/env node
/**
 * build-sprite.js
 * 将所有 SVG 图标合并为一个 SVG Sprite 文件
 * 支持按类别生成多个 sprite 文件
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// ==================== 配置 ====================
const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// 默认 viewBox
const DEFAULT_VIEWBOX = '0 0 24 24';

// ==================== 核心逻辑 ====================

/**
 * 从 SVG 内容中提取 viewBox
 */
function extractViewBox(content) {
  const match = content.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : DEFAULT_VIEWBOX;
}

/**
 * 从 SVG 内容中提取内部元素
 */
function extractContent(content) {
  // 移除 svg 标签，只保留内部内容
  let inner = content
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/<!DOCTYPE[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');
  
  // 移除 title 和 desc（已在优化阶段处理，这里做二次确认）
  inner = inner
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, '');
  
  return inner.trim();
}

/**
 * 生成合法的 symbol ID
 */
function generateSymbolId(relativePath) {
  // 去掉 .svg 扩展名，将路径分隔符替换为 -
  const id = relativePath
    .replace(/\.svg$/, '')
    .replace(/[\\\/]/g, '-')
    .toLowerCase()
    // 替换非法字符
    .replace(/[^a-z0-9-]/g, '-')
    // 去除连续的 -
    .replace(/-+/g, '-')
    // 去除首尾 -
    .replace(/^-|-$/g, '');
  
  return id;
}

/**
 * 处理单个 SVG 文件
 */
function processSvgFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const viewBox = extractViewBox(content);
  const innerContent = extractContent(content);
  
  // 生成相对路径作为 ID
  const relativePath = path.relative(ICONS_DIR, filePath);
  const symbolId = generateSymbolId(relativePath);
  
  return {
    id: symbolId,
    viewBox,
    content: innerContent,
    path: relativePath,
    category: relativePath.split(path.sep)[0]
  };
}

/**
 * 生成 Sprite 文件
 */
function generateSprite(symbols, spriteName = 'sprite') {
  const symbolElements = symbols.map(sym => {
    return `  <symbol id="${sym.id}" viewBox="${sym.viewBox}">${sym.content}</symbol>`;
  }).join('\n');
  
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none" aria-hidden="true">
${symbolElements}
</svg>`;
  
  return sprite;
}

/**
 * 生成 JS 模块导出（方便前端框架使用）
 */
function generateJsModule(symbols) {
  const exports = symbols.map(sym => {
    return `  '${sym.id}': '${sym.viewBox}'`;
  }).join(',\n');
  
  return `// 图标清单，由 build-sprite.js 自动生成
// 生成时间: ${new Date().toISOString()}

export const ICON_MANIFEST = {
${exports}
};

export const ICON_CATEGORIES = ${JSON.stringify(
  symbols.reduce((acc, sym) => {
    if (!acc[sym.category]) acc[sym.category] = [];
    acc[sym.category].push(sym.id);
    return acc;
  }, {}),
  null,
  2
)};

export default ICON_MANIFEST;
`;
}

/**
 * 生成 CSS 文件（提供基础样式）
 */
function generateCss(symbols) {
  return `/* 图标基础样式，由 build-sprite.js 自动生成 */

.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: middle;
  flex-shrink: 0;
}

.icon-sprite {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* 常见尺寸 */
.icon-xs { width: 0.75rem; height: 0.75rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
.icon-xl { width: 2rem; height: 2rem; }
.icon-2xl { width: 2.5rem; height: 2.5rem; }
`;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('🎨 SVG Sprite 生成工具');
  console.log('========================================\n');
  
  // 确保 dist 目录存在
  fs.ensureDirSync(DIST_DIR);
  
  // 获取所有 SVG 文件
  const pattern = path.join(ICONS_DIR, '**', '*.svg').replace(/\\/g, '/');
  const files = glob.sync(pattern);
  
  if (files.length === 0) {
    console.log('⚠️ 没有找到 SVG 文件');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个 SVG 文件\n`);
  
  // 处理所有 SVG
  const symbols = [];
  const categories = {};
  
  for (const file of files) {
    try {
      const sym = processSvgFile(file);
      symbols.push(sym);
      
      if (!categories[sym.category]) {
        categories[sym.category] = [];
      }
      categories[sym.category].push(sym);
    } catch (error) {
      console.error(`❌ 处理失败: ${file} - ${error.message}`);
    }
  }
  
  console.log(`✅ 成功处理 ${symbols.length} 个图标`);
  console.log(`📂 类别: ${Object.keys(categories).join(', ')}\n`);
  
  // 生成全量 Sprite
  console.log('📝 生成全量 Sprite...');
  const fullSprite = generateSprite(symbols, 'sprite');
  fs.writeFileSync(path.join(DIST_DIR, 'sprite.svg'), fullSprite, 'utf-8');
  console.log(`   ✅ dist/sprite.svg (${symbols.length} 个图标)`);
  
  // 按类别生成 Sprite
  console.log('\n📝 按类别生成 Sprite...');
  for (const [category, catSymbols] of Object.entries(categories)) {
    const catSprite = generateSprite(catSymbols, `sprite-${category}`);
    fs.writeFileSync(path.join(DIST_DIR, `sprite-${category}.svg`), catSprite, 'utf-8');
    console.log(`   ✅ dist/sprite-${category}.svg (${catSymbols.length} 个图标)`);
  }
  
  // 生成 JS 模块
  console.log('\n📝 生成 JS 模块...');
  const jsModule = generateJsModule(symbols);
  fs.writeFileSync(path.join(DIST_DIR, 'icons.js'), jsModule, 'utf-8');
  console.log('   ✅ dist/icons.js');
  
  // 生成 CSS
  console.log('\n📝 生成 CSS...');
  const css = generateCss(symbols);
  fs.writeFileSync(path.join(DIST_DIR, 'icons.css'), css, 'utf-8');
  console.log('   ✅ dist/icons.css');
  
  // 生成清单 JSON
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalIcons: symbols.length,
    categories: Object.entries(categories).map(([name, items]) => ({
      name,
      count: items.length,
      icons: items.map(i => i.id)
    })),
    icons: symbols.map(s => ({
      id: s.id,
      viewBox: s.viewBox,
      path: s.path
    }))
  };
  
  fs.writeFileSync(
    path.join(DIST_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  console.log('   ✅ dist/manifest.json');
  
  // 汇总
  console.log('\n========================================');
  console.log('📊 Sprite 生成完成');
  console.log('========================================');
  console.log(`📦 总图标数: ${symbols.length}`);
  console.log(`📂 类别数: ${Object.keys(categories).length}`);
  console.log('\n📁 输出文件:');
  console.log('   dist/sprite.svg - 全量 Sprite');
  console.log('   dist/sprite-[category].svg - 分类 Sprite');
  console.log('   dist/icons.js - JS 模块导出');
  console.log('   dist/icons.css - 基础 CSS 样式');
  console.log('   dist/manifest.json - 图标清单');
  console.log('\n💡 下一步: 运行 npm run font 生成 Icon Font');
}

main().catch(console.error);
