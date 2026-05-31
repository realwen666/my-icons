# GitHub Icon Collection

从 GitHub 自动收集和管理开源图标的仓库。支持自动拉取、优化、生成 Sprite/字体，并部署为在线预览站点。

## 功能特性

- **自动收集**：从 GitHub 批量拉取主流开源图标库
- **SVG 优化**：使用 SVGO 压缩、清理、标准化
- **Sprite 生成**：合并为 SVG Sprite，支持分类输出
- **字体生成**：自动转换为 TTF/WOFF/WOFF2/EOT 格式
- **在线预览**：生成搜索/复制友好的预览页面
- **自动部署**：GitHub Actions 自动构建并部署到 GitHub Pages
- **定时同步**：每周自动同步上游图标库更新

## 收集的图标库

| 图标库 | 数量 | 分类 | 来源 |
|--------|------|------|------|
| Lucide | 1000+ | UI | lucide-icons/lucide |
| Heroicons (Outline) | 300+ | UI | tailwindlabs/heroicons |
| Heroicons (Solid) | 300+ | UI | tailwindlabs/heroicons |
| Tabler Icons | 4000+ | UI | tabler/tabler-icons |
| Feather Icons | 300+ | UI | feathericons/feather |
| Remix Icon | 2500+ | UI | Remix-Design/remixicon |
| Octicons | 200+ | UI | primer/octicons |
| Bootstrap Icons | 2000+ | UI | twbs/icons |
| Material Design Icons | 7000+ | UI | Templarian/MaterialDesign |
| Carbon Icons | 1000+ | UI | carbon-design-system/carbon-icons |
| Eva Icons | 400+ | UI | akveo/eva-icons |
| Iconoir | 1300+ | UI | iconoir-icons/iconoir |
| Majesticons | 700+ | UI | majesticons/majesticons |
| CSS.gg | 700+ | UI | astrit/css.gg |
| Zondicons | 270+ | UI | dukestreetstudio/zondicons |
| Simple Icons | 3000+ | 品牌 | simple-icons/simple-icons |
| Weather Icons | 200+ | 天气 | erikflowers/weather-icons |
| Academicons | 150+ | 学术 | jpswalsh/academicons |
| **HD-Icons** | 1000+ | **仪表盘** | **xushier/HD-Icons** |
| **Dashboard Icons (Homarr)** | 1800+ | **仪表盘** | **homarr-labs/dashboard-icons** |
| **Walkxcode Dashboard Icons** | 1500+ | **仪表盘** | **walkxcode/dashboard-icons** |
| **Selfh.st Icons** | 500+ | **仪表盘** | **selfhst/icons** |
| **Fluent Emoji** | 1500+ | **Emoji** | **microsoft/fluentui-emoji** |
| **Fluent UI System** | 2000+ | **UI** | **microsoft/fluentui-system-icons** |
| **Devicon** | 500+ | **开发** | **devicons/devicon** |
| **Super Tiny Icons** | 300+ | **品牌** | **edent/SuperTinyIcons** |
| **Skill Icons** | 200+ | **开发** | **tandpfun/skill-icons** |
| **Flag Icons (4x3)** | 260+ | **国旗** | **lipis/flag-icons** |
| **Flag Icons (1x1)** | 260+ | **国旗** | **lipis/flag-icons** |
| **Circle Flags** | 260+ | **国旗** | **HatScripts/circle-flags** |
| **Country Flag Icons** | 250+ | **国旗** | **catamphetamine/country-flag-icons** |
| **Papirus** | 2000+ | **Linux** | **PapirusDevelopmentTeam/papirus-icon-theme** |
| **Numix Circle** | 1000+ | **Linux** | **numixproject/numix-icon-theme-circle** |
| **WhiteSur macOS** | 500+ | **macOS** | **vinceliuice/WhiteSur-icon-theme** |

> 总数超过 **35,000+** 个图标，持续增加中...

## 快速开始

### 1. Fork 本仓库

点击右上角的 "Fork" 按钮，将仓库复制到你的账号下。

### 2. 启用 GitHub Pages

进入仓库 **Settings > Pages**：
- Source: 选择 "GitHub Actions"

### 3. 运行工作流

进入 **Actions > Build and Deploy Icon Library**，点击 "Run workflow" 手动触发第一次构建。

约 3-5 分钟后，你的图标库站点将部署到 `https://你的用户名.github.io/github-icon-collection`

### 4. 本地开发（可选）

```bash
# 克隆仓库
git clone https://github.com/你的用户名/github-icon-collection.git
cd github-icon-collection

# 安装依赖
npm install

# 完整构建流程
npm run build

# 或分步执行
npm run fetch      # 拉取图标
npm run optimize   # 优化 SVG
npm run sprite     # 生成 Sprite
npm run font       # 生成字体
npm run preview    # 生成预览页
```

## 添加自定义图标

将 SVG 文件放入 `icons/custom/` 目录，提交后自动包含在构建中：

```bash
# 复制你的图标
cp my-icon.svg icons/custom/

# 提交
git add .
git commit -m "添加自定义图标"
git push
```

**自定义图标规范**：
- 使用 24×24 的 viewBox
- 单色图标不要硬编码 fill 颜色
- 命名使用小写和连字符：`my-custom-icon.svg`

## 添加新的图标源

编辑 `scripts/fetch-icons.js` 中的 `SOURCES` 数组：

```javascript
{
  name: 'my-icons',              // 源名称
  repo: 'https://github.com/...', // Git 仓库地址
  sourcePath: 'path/to/svgs',    // 仓库内 SVG 所在路径
  targetPath: 'icons/ui/my-icons', // 本地存放路径
  include: (file) => file.endsWith('.svg'), // 文件过滤
  description: '描述信息'
}
```

## 使用图标

### 方式一：SVG Sprite（推荐）

```html
<!-- 引入 Sprite -->
<svg style="display:none">
  <use href="https://你的用户名.github.io/github-icon-collection/sprite.svg#ui-lucide-home"></use>
</svg>

<!-- 使用图标 -->
<svg width="24" height="24" fill="currentColor">
  <use href="https://你的用户名.github.io/github-icon-collection/sprite.svg#ui-lucide-home"></use>
</svg>
```

### 方式二：Icon Font

```html
<!-- 引入 CSS -->
<link rel="stylesheet" href="https://你的用户名.github.io/github-icon-collection/icon-collection.css">

<!-- 使用 -->
<i class="ifont ifont-ui-lucide-home"></i>
```

### 方式三：React 组件

```jsx
// 使用 symbol ID
const Icon = ({ name, size = 24, className }) => (
  <svg width={size} height={size} className={className} fill="currentColor">
    <use href={`https://你的用户名.github.io/github-icon-collection/sprite.svg#${name}`} />
  </svg>
);

// 使用
<Icon name="ui-lucide-home" size={24} />
```

### 方式四：直接引用单个 SVG

```html
<img src="https://你的用户名.github.io/github-icon-collection/icons/ui/lucide/home.svg" />
```

## 构建产物

构建后 `dist/` 目录包含：

| 文件 | 说明 |
|------|------|
| `index.html` | 图标预览页面 |
| `sprite.svg` | 全量 SVG Sprite |
| `sprite-[category].svg` | 分类 Sprite |
| `icons.js` | JS 模块导出 |
| `icons.css` | Sprite 用基础 CSS |
| `manifest.json` | 图标清单数据 |
| `icon-collection.ttf` | TrueType 字体 |
| `icon-collection.woff` | WOFF 字体 |
| `icon-collection.woff2` | WOFF2 压缩字体 |
| `icon-collection.eot` | IE 兼容字体 |
| `icon-collection.css` | Icon Font CSS |
| `icon-collection.scss` | SCSS 变量 |

## 自动化流程

```
每周一凌晨 / 手动触发 / 推送触发
        │
        ▼
┌──────────────────┐
│  1. fetch-icons  │  ◄── 从 GitHub 拉取最新图标
│  2. optimize     │  ◄── SVGO 压缩优化
│  3. build-sprite │  ◄── 生成 SVG Sprite
│  4. generate-font│  ◄── 生成 Icon Font
│  5. build-preview│  ◄── 生成预览页面
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Deploy to Pages │  ◄── 自动部署到 GitHub Pages
└──────────────────┘
```

## 自定义配置

### 修改 SVGO 优化规则

编辑 `scripts/optimize.js` 中的 `SVGO_CONFIG`：

```javascript
const SVGO_CONFIG = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,  // 保留 viewBox
          removeTitle: false     // 保留 title 标签
        }
      }
    }
  ]
};
```

### 修改字体生成参数

编辑 `scripts/generate-font.js`：

```javascript
const FONT_NAME = 'my-font';
const DESCENT = 200;
```

### 修改预览页面样式

编辑 `templates/preview.html`：

自定义 CSS 变量、布局、颜色主题等。

## 项目结构

```
github-icon-collection/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions 工作流
├── icons/                     # 图标目录
│   ├── ui/                    # UI 通用图标
│   ├── brands/                # 品牌 Logo
│   ├── flags/                 # 国旗/天气
│   └── custom/                # 自定义图标（不会被清理）
├── scripts/                   # 构建脚本
│   ├── fetch-icons.js         # 拉取图标
│   ├── optimize.js            # SVG 优化
│   ├── build-sprite.js        # 生成 Sprite
│   ├── generate-font.js       # 生成字体
│   └── build-preview.js       # 生成预览
├── templates/
│   └── preview.html           # 预览页面模板
├── dist/                      # 构建输出（自动部署）
├── package.json
├── .gitignore
└── README.md
```

## 技术栈

- **svgicons2svgfont** - SVG 转字体
- **svgo** - SVG 优化
- **svg2ttf** - SVG 转 TTF
- **ttf2woff/woff2/eot** - 字体格式转换
- **GitHub Actions** - CI/CD
- **GitHub Pages** - 静态托管

## 许可证

- 构建工具和脚本：MIT
- 各图标库遵循其原始许可证（详见各仓库）

## 致谢

感谢以下开源项目：

- [Lucide](https://github.com/lucide-icons/lucide)
- [Heroicons](https://github.com/tailwindlabs/heroicons)
- [Tabler Icons](https://github.com/tabler/tabler-icons)
- [Simple Icons](https://github.com/simple-icons/simple-icons)
- [Feather Icons](https://github.com/feathericons/feather)
- [Remix Icon](https://github.com/Remix-Design/remixicon)
- [HD-Icons](https://github.com/xushier/HD-Icons)
- [Dashboard Icons (Homarr)](https://github.com/homarr-labs/dashboard-icons)
- [Walkxcode Dashboard Icons](https://github.com/walkxcode/dashboard-icons)
- [Selfh.st Icons](https://github.com/selfhst/icons)
- [Fluent Emoji](https://github.com/microsoft/fluentui-emoji)
- [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons)
- [WhiteSur macOS Icon Theme](https://github.com/vinceliuice/WhiteSur-icon-theme)
- [Devicon](https://github.com/devicons/devicon)
- [Super Tiny Icons](https://github.com/edent/SuperTinyIcons)
- [Skill Icons](https://github.com/tandpfun/skill-icons)
- [Flag Icons](https://github.com/lipis/flag-icons)
- [Circle Flags](https://github.com/HatScripts/circle-flags)
- [Papirus Icon Theme](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme)
- [Numix Circle](https://github.com/numixproject/numix-icon-theme-circle)
- [Material Design Icons](https://github.com/Templarian/MaterialDesign)
- [Carbon Icons](https://github.com/carbon-design-system/carbon-icons)
- [Eva Icons](https://github.com/akveo/eva-icons)
- [Iconoir](https://github.com/iconoir-icons/iconoir)
- [Majesticons](https://github.com/majesticons/majesticons)
- [CSS.gg](https://github.com/astrit/css.gg)
- [Zondicons](https://github.com/dukestreetstudio/zondicons)
- [以及所有其他图标库贡献者]
