#!/usr/bin/env node
/**
 * optimize.js
 * 使用 SVGO 优化所有 SVG 图标
 * 去除冗余属性、压缩路径、统一格式
 */

const { optimize } = require('svgo');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// ==================== SVGO 配置 ====================
const SVGO_CONFIG = {
  multipass: true, // 多次优化
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // 不移除 viewBox（对响应式很重要）
          removeViewBox: false,
          // 清理 fill 属性（让 CSS 能控制颜色）
          removeUselessStrokeAndFill: {
            removeNone: true
          }
        }
      }
    },
    // 不要 removeXMLNS，放在这里 SVGO 会报错
    // 确保有 viewBox
    {
      name: 'removeDimensions',
      active: true
    },
    // 统一根元素属性
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          { fill: 'currentColor' }
        ]
      }
    },
    // 移除空组
    {
      name: 'collapseGroups',
      active: true
    },
    // 将样式转换为属性
    {
      name: 'inlineStyles',
      active: true
    },
    // 移除 script 和 style 标签
    {
      name: 'removeScriptElement',
      active: true
    },
    {
      name: 'removeStyleElement',
      active: true
    },
    // 清理 title（保留语义化）
    {
      name: 'removeTitle',
      active: false // 保留 title 以提升可访问性
    },
    // 移除 desc
    {
      name: 'removeDesc',
      active: true
    },
    // 移除编辑器命名空间
    {
      name: 'removeEditorsNSData',
      active: true
    },
    // 移除注释
    {
      name: 'removeComments',
      active: true
    },
    // 移除 doctype
    {
      name: 'removeDoctype',
      active: true
    },
    // 移除 XML 处理指令
    {
      name: 'removeXMLProcInst',
      active: true
    },
    // 转换形状为路径
    {
      name: 'convertShapeToPath',
      active: true
    },
    // 合并路径
    {
      name: 'mergePaths',
      active: true,
      params: {
        force: false
      }
    },
    // 清理路径数据
    {
      name: 'cleanupNumericValues',
      active: true,
      params: {
        floatPrecision: 2
      }
    },
    // 排序属性
    {
      name: 'sortAttrs',
      active: true
    }
  ]
};

// ==================== 核心逻辑 ====================

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');

/**
 * 获取所有 SVG 文件
 */
function getSvgFiles() {
  const pattern = path.join(ICONS_DIR, '**', '*.svg').replace(/\\/g, '/');
  return glob.sync(pattern);
}

/**
 * 优化单个 SVG
 */
async function optimizeSvg(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  
  try {
    const result = optimize(content, {
      ...SVGO_CONFIG,
      path: filePath
    });
    
    await fs.writeFile(filePath, result.data, 'utf-8');
    
    // 计算压缩率
    const originalSize = Buffer.byteLength(content, 'utf-8');
    const optimizedSize = Buffer.byteLength(result.data, 'utf-8');
    const ratio = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    
    return {
      success: true,
      originalSize,
      optimizedSize,
      ratio
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('🔧 SVG 优化工具');
  console.log('========================================\n');
  
  const files = getSvgFiles();
  
  if (files.length === 0) {
    console.log('⚠️ 没有找到 SVG 文件，请先运行 npm run fetch');
    return;
  }
  
  console.log(`📁 找到 ${files.length} 个 SVG 文件\n`);
  
  let successCount = 0;
  let failCount = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  // 批量处理
  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(files.length / batchSize);
    
    console.log(`[${batchNum}/${totalBatches}] 处理中... (${batch.length} 个文件)`);
    
    await Promise.all(batch.map(async (file) => {
      const result = await optimizeSvg(file);
      const relativePath = path.relative(ROOT_DIR, file);
      
      if (result.success) {
        successCount++;
        totalOriginalSize += result.originalSize;
        totalOptimizedSize += result.optimizedSize;
        const indicator = parseFloat(result.ratio) > 0 ? `↓${result.ratio}%` : '→';
        console.log(`  ✅ ${relativePath} ${indicator}`);
      } else {
        failCount++;
        console.log(`  ❌ ${relativePath}: ${result.error}`);
      }
    }));
  }
  
  // 汇总
  const totalRatio = totalOriginalSize > 0 
    ? ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1) 
    : 0;
  
  console.log('\n========================================');
  console.log('📊 优化完成');
  console.log('========================================');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📦 原始大小: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`📦 优化后: ${(totalOptimizedSize / 1024).toFixed(1)} KB`);
  console.log(`📉 节省: ${totalRatio}%`);
  console.log('\n💡 下一步: 运行 npm run sprite 生成 SVG Sprite');
}

main().catch(console.error);
