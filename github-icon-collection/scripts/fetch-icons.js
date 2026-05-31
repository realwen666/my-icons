#!/usr/bin/env node
/**
 * fetch-icons.js
 * 从 GitHub 批量拉取开源图标库
 * 支持配置多个源，自动提取需要的 SVG 文件
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// ==================== 配置区域 ====================
// 在这里添加你想收集的图标库
const SOURCES = [
  // ===== UI 通用图标 =====
  {
    name: 'lucide',
    repo: 'https://github.com/lucide-icons/lucide.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/lucide',
    include: (file) => file.endsWith('.svg'),
    description: '轻量级优雅图标库'
  },
  {
    name: 'heroicons',
    repo: 'https://github.com/tailwindlabs/heroicons.git',
    sourcePath: 'optimized/24/outline',
    targetPath: 'icons/ui/heroicons-outline',
    include: (file) => file.endsWith('.svg'),
    description: 'Tailwind 团队出品的 outline 风格图标'
  },
  {
    name: 'heroicons-solid',
    repo: 'https://github.com/tailwindlabs/heroicons.git',
    sourcePath: 'optimized/24/solid',
    targetPath: 'icons/ui/heroicons-solid',
    include: (file) => file.endsWith('.svg'),
    description: 'Tailwind 团队出品的 solid 风格图标'
  },
  {
    name: 'tabler-icons',
    repo: 'https://github.com/tabler/tabler-icons.git',
    sourcePath: 'icons/outline',
    targetPath: 'icons/ui/tabler-outline',
    include: (file) => file.endsWith('.svg'),
    description: 'Tabler outline 风格图标'
  },
  {
    name: 'feather',
    repo: 'https://github.com/feathericons/feather.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/feather',
    include: (file) => file.endsWith('.svg'),
    description: 'Feather 极简图标'
  },
  {
    name: 'remixicon',
    repo: 'https://github.com/Remix-Design/remixicon.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/remixicon',
    include: (file) => file.endsWith('.svg'),
    description: 'Remix Icon 中性风格图标'
  },
  {
    name: 'octicons',
    repo: 'https://github.com/primer/octicons.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/octicons',
    include: (file) => file.endsWith('.svg') && !file.includes('-16') && !file.includes('-24'),
    description: 'GitHub 官方图标'
  },
  {
    name: 'bootstrap-icons',
    repo: 'https://github.com/twbs/icons.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/bootstrap',
    include: (file) => file.endsWith('.svg'),
    description: 'Bootstrap 官方图标'
  },
  
  // ===== 品牌/Logo 图标 =====
  {
    name: 'simple-icons',
    repo: 'https://github.com/simple-icons/simple-icons.git',
    sourcePath: 'icons',
    targetPath: 'icons/brands/simple-icons',
    include: (file) => file.endsWith('.svg'),
    description: '3000+ 品牌单色图标'
  },
  
  // ===== 特殊场景图标 =====
  {
    name: 'weather-icons',
    repo: 'https://github.com/erikflowers/weather-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/flags/weather',
    include: (file) => file.endsWith('.svg'),
    description: '天气图标'
  },
  {
    name: 'academicons',
    repo: 'https://github.com/jpswalsh/academicons.git',
    sourcePath: 'svg',
    targetPath: 'icons/brands/academicons',
    include: (file) => file.endsWith('.svg'),
    description: '学术/科研图标'
  },
  
  // ===== 仪表盘/应用图标 =====
  {
    name: 'hd-icons',
    repo: 'https://github.com/xushier/HD-Icons.git',
    sourcePath: '',
    targetPath: 'icons/dashboard/hd-icons',
    include: (file) => file.endsWith('.svg') || file.endsWith('.png'),
    description: '高清仪表盘图标（1024x1024）'
  },
  {
    name: 'dashboard-icons',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/dashboard/homarr',
    include: (file) => file.endsWith('.svg'),
    description: 'Homarr 仪表盘图标（1800+ 自托管应用）'
  },
  
  // ===== macOS 图标 =====
  {
    name: 'macos-icons',
    repo: 'https://github.com/vinceliuice/WhiteSur-icon-theme.git',
    sourcePath: 'src/apps/scalable',
    targetPath: 'icons/macos/whitesur',
    include: (file) => file.endsWith('.svg'),
    description: 'WhiteSur macOS Big Sur 风格图标'
  },
  {
    name: 'macos-monterey',
    repo: 'https://github.com/vinceliuice/WhiteSur-icon-theme.git',
    sourcePath: 'src/apps/symbolic',
    targetPath: 'icons/macos/whitesur-symbolic',
    include: (file) => file.endsWith('.svg'),
    description: 'WhiteSur macOS Monterey 风格符号图标'
  },
  
  // ===== 仪表盘/自托管服务图标 =====
  {
    name: 'dashboard-icons',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/dashboard/homarr',
    include: (file) => file.endsWith('.svg'),
    description: 'Homarr 仪表盘图标（1800+ 自托管应用）'
  },
  {
    name: 'dashboard-icons-png',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'png',
    targetPath: 'icons/dashboard/homarr-png',
    include: (file) => file.endsWith('.png'),
    description: 'Homarr 仪表盘图标 PNG 版本'
  },
  {
    name: 'dashboard-icons-webp',
    repo: 'https://github.com/homarr-labs/dashboard-icons.git',
    sourcePath: 'webp',
    targetPath: 'icons/dashboard/homarr-webp',
    include: (file) => file.endsWith('.webp'),
    description: 'Homarr 仪表盘图标 WebP 版本'
  },
  {
    name: 'walkxcode-dashboard-icons',
    repo: 'https://github.com/walkxcode/dashboard-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/dashboard/walkxcode',
    include: (file) => file.endsWith('.svg'),
    description: 'Walkxcode 仪表盘图标（原始仓库）'
  },
  {
    name: 'selfh-st',
    repo: 'https://github.com/selfhst/icons.git',
    sourcePath: '',
    targetPath: 'icons/dashboard/selfh-st',
    include: (file) => file.endsWith('.svg') || file.endsWith('.png') || file.endsWith('.webp'),
    description: 'Selfh.st 自托管服务图标'
  },
  
  // ===== Fluent 设计图标 =====
  {
    name: 'fluent-emoji',
    repo: 'https://github.com/microsoft/fluentui-emoji.git',
    sourcePath: 'assets',
    targetPath: 'icons/fluent/emoji',
    include: (file) => file.endsWith('.svg') || file.endsWith('.png'),
    description: 'Microsoft Fluent Emoji（1500+ Emoji）'
  },
  {
    name: 'fluentui-system-icons',
    repo: 'https://github.com/microsoft/fluentui-system-icons.git',
    sourcePath: 'assets',
    targetPath: 'icons/fluent/system',
    include: (file) => file.endsWith('.svg') && file.includes('ic_fluent'),
    description: 'Microsoft Fluent UI 系统图标'
  },
  
  // ===== 开发者/技术图标 =====
  {
    name: 'devicon',
    repo: 'https://github.com/devicons/devicon.git',
    sourcePath: 'icons',
    targetPath: 'icons/dev/devicon',
    include: (file) => file.endsWith('.svg') && !file.includes('-original') && !file.includes('-plain') && !file.includes('-wordmark'),
    description: '开发者图标（编程语言、工具、框架）'
  },
  {
    name: 'super-tiny-icons',
    repo: 'https://github.com/edent/SuperTinyIcons.git',
    sourcePath: 'images/svg',
    targetPath: 'icons/dev/super-tiny',
    include: (file) => file.endsWith('.svg'),
    description: '超小 SVG 图标（品牌 Logo）'
  },
  {
    name: 'skill-icons',
    repo: 'https://github.com/tandpfun/skill-icons.git',
    sourcePath: '',
    targetPath: 'icons/dev/skill-icons',
    include: (file) => file.endsWith('.svg') || file.endsWith('.png'),
    description: '技能展示图标（GitHub Profile 用）'
  },
  
  // ===== 国旗/地区图标 =====
  {
    name: 'flag-icons',
    repo: 'https://github.com/lipis/flag-icons.git',
    sourcePath: 'flags',
    targetPath: 'icons/flags/4x3',
    include: (file) => file.endsWith('.svg') && file.includes('4x3'),
    description: '4:3 比例国旗 SVG 图标'
  },
  {
    name: 'flag-icons-1x1',
    repo: 'https://github.com/lipis/flag-icons.git',
    sourcePath: 'flags/1x1',
    targetPath: 'icons/flags/1x1',
    include: (file) => file.endsWith('.svg'),
    description: '1:1 比例国旗 SVG 图标'
  },
  {
    name: 'circle-flags',
    repo: 'https://github.com/HatScripts/circle-flags.git',
    sourcePath: 'flags',
    targetPath: 'icons/flags/circle',
    include: (file) => file.endsWith('.svg'),
    description: '圆形国旗 SVG 图标'
  },
  {
    name: 'country-flag-icons',
    repo: 'https://github.com/catamphetamine/country-flag-icons.git',
    sourcePath: '3x2',
    targetPath: 'icons/flags/country-3x2',
    include: (file) => file.endsWith('.svg'),
    description: '3:2 比例国家/地区旗帜'
  },
  
  // ===== Linux 图标主题 =====
  {
    name: 'papirus',
    repo: 'https://github.com/PapirusDevelopmentTeam/papirus-icon-theme.git',
    sourcePath: 'Papirus',
    targetPath: 'icons/linux/papirus',
    include: (file) => file.endsWith('.svg'),
    description: 'Papirus Linux 图标主题'
  },
  {
    name: 'numix-circle',
    repo: 'https://github.com/numixproject/numix-icon-theme-circle.git',
    sourcePath: 'Numix-Circle',
    targetPath: 'icons/linux/numix-circle',
    include: (file) => file.endsWith('.svg'),
    description: 'Numix Circle Linux 图标主题'
  },
  
  // ===== 更多 UI 图标 =====
  {
    name: 'material-design-icons',
    repo: 'https://github.com/Templarian/MaterialDesign.git',
    sourcePath: 'svg',
    targetPath: 'icons/ui/material-design',
    include: (file) => file.endsWith('.svg'),
    description: 'Material Design 社区版图标'
  },
  {
    name: 'carbon-icons',
    repo: 'https://github.com/carbon-design-system/carbon-icons.git',
    sourcePath: 'svg',
    targetPath: 'icons/ui/carbon',
    include: (file) => file.endsWith('.svg'),
    description: 'IBM Carbon 设计系统图标'
  },
  {
    name: 'eva-icons',
    repo: 'https://github.com/akveo/eva-icons.git',
    sourcePath: 'package/icons/svg',
    targetPath: 'icons/ui/eva',
    include: (file) => file.endsWith('.svg'),
    description: 'Eva Icons（Akveo 出品）'
  },
  {
    name: 'iconoir',
    repo: 'https://github.com/iconoir-icons/iconoir.git',
    sourcePath: 'icons',
    targetPath: 'icons/ui/iconoir',
    include: (file) => file.endsWith('.svg'),
    description: 'Iconoir 开源 SVG 图标'
  },
  {
    name: 'majesticons',
    repo: 'https://github.com/majesticons/majesticons.git',
    sourcePath: 'svg',
    targetPath: 'icons/ui/majesticons',
    include: (file) => file.endsWith('.svg'),
    description: 'Majesticons 精致 SVG 图标'
  },
  {
    name: 'css-gg',
    repo: 'https://github.com/astrit/css.gg.git',
    sourcePath: 'icons/svg',
    targetPath: 'icons/ui/css-gg',
    include: (file) => file.endsWith('.svg'),
    description: 'CSS.gg 纯 CSS/SVG 图标'
  },
  {
    name: 'zondicons',
    repo: 'https://github.com/dukestreetstudio/zondicons.git',
    sourcePath: '',
    targetPath: 'icons/ui/zondicons',
    include: (file) => file.endsWith('.svg'),
    description: 'Zondicons 通用图标集'
  }
];

// ==================== 核心逻辑 ====================

const TEMP_DIR = '.temp';
const ROOT_DIR = process.cwd();

/**
 * 清理临时目录
 */
function cleanTemp() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.removeSync(TEMP_DIR);
    console.log(`🧹 清理临时目录: ${TEMP_DIR}`);
  }
}

/**
 * 克隆仓库（浅克隆，只取最新）
 */
function cloneRepo(repo, targetDir) {
  console.log(`📥 克隆: ${repo}`);
  try {
    execSync(`git clone --depth 1 ${repo} ${targetDir}`, {
      stdio: 'pipe',
      timeout: 120000
    });
    return true;
  } catch (error) {
    console.error(`❌ 克隆失败: ${repo}`);
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

/**
 * 复制符合条件的文件
 */
function copyFiles(sourceDir, targetDir, filterFn) {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`⚠️ 源目录不存在: ${sourceDir}`);
    return 0;
  }

  fs.ensureDirSync(targetDir);
  
  const files = fs.readdirSync(sourceDir);
  let count = 0;
  
  for (const file of files) {
    const srcFile = path.join(sourceDir, file);
    const stat = fs.statSync(srcFile);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      const subCount = copyFiles(srcFile, path.join(targetDir, file), filterFn);
      count += subCount;
    } else if (filterFn(file)) {
      const targetFile = path.join(targetDir, file);
      fs.ensureDirSync(path.dirname(targetFile));
      fs.copyFileSync(srcFile, targetFile);
      count++;
    }
  }
  
  return count;
}

/**
 * 清理旧的图标目录（保留 custom 目录）
 */
function cleanOldIcons() {
  const iconsDir = path.join(ROOT_DIR, 'icons');
  if (!fs.existsSync(iconsDir)) return;
  
  const categories = fs.readdirSync(iconsDir);
  for (const cat of categories) {
    if (cat === 'custom') continue; // 保留自定义图标
    
    const catPath = path.join(iconsDir, cat);
    const stat = fs.statSync(catPath);
    if (stat.isDirectory()) {
      fs.removeSync(catPath);
      console.log(`🗑️  清理旧目录: icons/${cat}`);
    }
  }
}

/**
 * 统计图标数量
 */
function countIcons(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      count += countIcons(fullPath);
    } else if (item.name.endsWith('.svg')) {
      count++;
    }
  }
  return count;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('🚀 GitHub 图标收集工具');
  console.log('========================================\n');
  
  const startTime = Date.now();
  
  // 清理
  cleanTemp();
  cleanOldIcons();
  
  const results = [];
  
  // 逐个处理源
  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    console.log(`\n[${i + 1}/${SOURCES.length}] 📦 ${source.name}`);
    console.log(`   ${source.description}`);
    console.log(`   源: ${source.repo}`);
    
    const tempCloneDir = path.join(TEMP_DIR, source.name);
    
    // 克隆
    const cloned = cloneRepo(source.repo, tempCloneDir);
    if (!cloned) {
      results.push({ name: source.name, status: 'failed', count: 0 });
      continue;
    }
    
    // 复制文件
    const sourcePath = path.join(tempCloneDir, source.sourcePath);
    const targetPath = path.join(ROOT_DIR, source.targetPath);
    const count = copyFiles(sourcePath, targetPath, source.include);
    
    results.push({ name: source.name, status: 'success', count });
    console.log(`   ✅ 已复制 ${count} 个图标到 ${source.targetPath}`);
    
    // 清理本次临时目录
    fs.removeSync(tempCloneDir);
  }
  
  // 最终清理
  cleanTemp();
  
  // 生成元数据
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalIcons: countIcons(path.join(ROOT_DIR, 'icons')),
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
  
  // 输出汇总
  console.log('\n========================================');
  console.log('📊 收集完成汇总');
  console.log('========================================');
  console.log(`⏱️  耗时: ${duration}秒`);
  console.log(`📁 总图标数: ${metadata.totalIcons}`);
  console.log(`✅ 成功: ${results.filter(r => r.status === 'success').length}`);
  console.log(`❌ 失败: ${results.filter(r => r.status === 'failed').length}`);
  console.log('\n📦 各源详情:');
  results.forEach(r => {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${r.name}: ${r.count} 个图标`);
  });
  console.log('\n💡 提示: 自定义图标可放在 icons/custom/ 目录下，不会被清理');
  console.log('   运行 npm run optimize 开始优化 SVG');
}

// 运行
main().catch(console.error);
