#!/usr/bin/env node
/**
 * generate-font.js
 * 将 SVG 图标生成为 Icon Font（TTF/WOFF/WOFF2/EOT）
 * 使用 svgicons2svgfont -> svg2ttf -> ttf2woff/woff2/eot 工具链
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const SVGIcons2SVGFont = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');
const { Readable } = require('stream');

// ==================== 配置 ====================
const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const FONT_NAME = 'icon-collection';
const FONT_FAMILY = 'Icon Collection';
const DESCENT = 200; // 基线下偏移

// ==================== 核心逻辑 ====================

/**
 * 从 SVG 内容中提取 viewBox 和路径
 */
function extractSvgInfo(content) {
  const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  
  return { width, height, viewBox };
}

/**
 * 获取所有 SVG 文件（只取单色图标，排除多色品牌图标）
 */
function getSvgFiles() {
  const pattern = path.join(ICONS_DIR, '{ui,flags}', '**', '*.svg').replace(/\\/g, '/');
  return glob.sync(pattern);
}

/**
 * 生成 Unicode 映射
 * 从 U+E000 开始分配私有使用区字符
 */
function generateUnicodeMap(files) {
  const map = {};
  let code = 0xE000;
  
  for (const file of files) {
    const name = path.basename(file, '.svg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const relativeDir = path.relative(ICONS_DIR, path.dirname(file));
    const uniqueName = `${relativeDir.replace(/[\\\/]/g, '-')}-${name}`.replace(/^-/, '');
    
    map[file] = {
      name: uniqueName,
      unicode: [String.fromCharCode(code)]
    };
    code++;
    
    // 防止超出私有使用区
    if (code > 0xF8FF) {
      console.warn('⚠️ 图标数量超出私有使用区范围');
      break;
    }
  }
  
  return map;
}

/**
 * 生成 SVG 字体
 */
function generateSvgFont(files, unicodeMap) {
  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFont({
      fontName: FONT_NAME,
      fontStyle: 'normal',
      fontWeight: 'normal',
      fixedWidth: true,
      centerHorizontally: true,
      centerVertically: true,
      normalize: true,
      fontHeight: 1000,
      descent: DESCENT,
      log: () => {} // 静默日志
    });
    
    let svgFont = '';
    fontStream
      .on('data', chunk => {
        svgFont += chunk;
      })
      .on('end', () => resolve(svgFont))
      .on('error', reject);
    
    // 按顺序写入每个图标
    const sortedFiles = files.sort((a, b) => {
      return unicodeMap[a].unicode[0].localeCompare(unicodeMap[b].unicode[0]);
    });
    
    for (const file of sortedFiles) {
      const glyph = unicodeMap[file];
      const content = fs.readFileSync(file, 'utf-8');
      
      // 创建可读流
      const stream = new Readable({
        read() {
          this.push(content);
          this.push(null);
        }
      });
      
      stream.metadata = {
        unicode: glyph.unicode,
        name: glyph.name
      };
      
      fontStream.write(stream);
    }
    
    fontStream.end();
  });
}

/**
 * 生成 CSS 文件（Icon Font 版本）
 */
function generateFontCss(unicodeMap) {
  let css = `/* Icon Font 样式，由 generate-font.js 自动生成 */
/* 生成时间: ${new Date().toISOString()} */

@font-face {
  font-family: '${FONT_FAMILY}';
  src: url('./${FONT_NAME}.eot');
  src: url('./${FONT_NAME}.eot?#iefix') format('embedded-opentype'),
       url('./${FONT_NAME}.woff2') format('woff2'),
       url('./${FONT_NAME}.woff') format('woff'),
       url('./${FONT_NAME}.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.ifont {
  font-family: '${FONT_FAMILY}' !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 图标类名 */
`;

  // 为每个图标生成类名
  const entries = Object.entries(unicodeMap);
  for (const [, glyph] of entries) {
    const hex = glyph.unicode[0].charCodeAt(0).toString(16).toUpperCase();
    css += `.ifont-${glyph.name}::before { content: '\\${hex}'; }\n`;
  }
  
  return css;
}

/**
 * 生成 SCSS 文件（带变量）
 */
function generateScss(unicodeMap) {
  let scss = `// Icon Font SCSS 变量\n// 由 generate-font.js 自动生成\n\n`;
  scss += `$ifont-font-family: '${FONT_FAMILY}';\n\n`;
  scss += `// Unicode 映射\n`;
  scss += `$ifont-icons: (\n`;
  
  const entries = Object.entries(unicodeMap);
  for (let i = 0; i < entries.length; i++) {
    const [, glyph] = entries[i];
    const hex = glyph.unicode[0].charCodeAt(0).toString(16).toUpperCase();
    const comma = i < entries.length - 1 ? ',' : '';
    scss += `  '${glyph.name}': '\\${hex}'${comma}\n`;
  }
  
  scss += `);\n\n`;
  scss += `// 使用示例:\n`;
  scss += `// .my-icon::before { content: map-get($ifont-icons, 'icon-name'); }\n`;
  
  return scss;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('🔤 Icon Font 生成工具');
  console.log('========================================\n');
  
  fs.ensureDirSync(DIST_DIR);
  
  // 获取 SVG 文件（排除品牌图标，因为字体不支持多色）
  const files = getSvgFiles();
  
  if (files.length === 0) {
    console.log('⚠️ 没有找到适合的 SVG 文件（字体只支持 ui 和 flags 目录的单色图标）');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个 SVG 文件（用于字体生成）\n`);
  
  // 生成 Unicode 映射
  console.log('📝 生成 Unicode 映射...');
  const unicodeMap = generateUnicodeMap(files);
  console.log(`   ✅ 已分配 ${Object.keys(unicodeMap).length} 个字符\n`);
  
  // 生成 SVG 字体
  console.log('📝 生成 SVG 字体...');
  let svgFont;
  try {
    svgFont = await generateSvgFont(files, unicodeMap);
    console.log('   ✅ SVG 字体生成成功');
  } catch (error) {
    console.error(`   ❌ SVG 字体生成失败: ${error.message}`);
    return;
  }
  
  // 转换为 TTF
  console.log('\n📝 转换为 TTF...');
  const ttf = svg2ttf(svgFont, {
    description: 'Generated from GitHub icon collection',
    url: 'https://github.com/yourname/github-icon-collection'
  });
  const ttfBuffer = Buffer.from(ttf.buffer);
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.ttf`), ttfBuffer);
  console.log(`   ✅ ${FONT_NAME}.ttf (${(ttfBuffer.length / 1024).toFixed(1)} KB)`);
  
  // 转换为 WOFF
  console.log('\n📝 转换为 WOFF...');
  const woff = ttf2woff(new Uint8Array(ttfBuffer), {});
  const woffBuffer = Buffer.from(woff.buffer);
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.woff`), woffBuffer);
  console.log(`   ✅ ${FONT_NAME}.woff (${(woffBuffer.length / 1024).toFixed(1)} KB)`);
  
  // 转换为 WOFF2
  console.log('\n📝 转换为 WOFF2...');
  try {
    const woff2 = ttf2woff2(new Uint8Array(ttfBuffer));
    const woff2Buffer = Buffer.from(woff2.buffer);
    fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.woff2`), woff2Buffer);
    console.log(`   ✅ ${FONT_NAME}.woff2 (${(woff2Buffer.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.warn(`   ⚠️ WOFF2 转换失败: ${error.message}`);
  }
  
  // 转换为 EOT（IE 兼容）
  console.log('\n📝 转换为 EOT...');
  try {
    const eot = ttf2eot(new Uint8Array(ttfBuffer));
    const eotBuffer = Buffer.from(eot.buffer);
    fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.eot`), eotBuffer);
    console.log(`   ✅ ${FONT_NAME}.eot (${(eotBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.warn(`   ⚠️ EOT 转换失败: ${error.message}`);
  }
  
  // 生成 CSS
  console.log('\n📝 生成 CSS 文件...');
  const css = generateFontCss(unicodeMap);
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.css`), css, 'utf-8');
  console.log(`   ✅ ${FONT_NAME}.css`);
  
  // 生成 SCSS
  console.log('\n📝 生成 SCSS 文件...');
  const scss = generateScss(unicodeMap);
  fs.writeFileSync(path.join(DIST_DIR, `${FONT_NAME}.scss`), scss, 'utf-8');
  console.log(`   ✅ ${FONT_NAME}.scss`);
  
  // 汇总
  console.log('\n========================================');
  console.log('📊 Icon Font 生成完成');
  console.log('========================================');
  console.log(`📦 图标数量: ${files.length}`);
  console.log('\n📁 输出文件:');
  console.log(`   ${FONT_NAME}.ttf  - TrueType 字体`);
  console.log(`   ${FONT_NAME}.woff - Web 字体`);
  console.log(`   ${FONT_NAME}.woff2- Web 字体（压缩版）`);
  console.log(`   ${FONT_NAME}.eot  - IE 兼容字体`);
  console.log(`   ${FONT_NAME}.css  - CSS 样式`);
  console.log(`   ${FONT_NAME}.scss - SCSS 变量`);
  console.log('\n💡 使用方式:');
  console.log('   1. 引入 CSS: <link rel="stylesheet" href="icon-collection.css">');
  console.log('   2. HTML: <i class="ifont ifont-[图标名]"></i>');
  console.log('\n💡 下一步: 运行 npm run preview 生成预览页面');
}

main().catch(console.error);
