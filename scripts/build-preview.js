#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function generateSymbolId(relativePath) {
  return relativePath
    .replace(/\.svg$/, '')
    .replace(/[\\/]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractViewBox(content) {
  const match = content.match(/viewBox=["']([^"']+)["']/);
  return match ? match[1] : '0 0 24 24';
}

function extractContent(content) {
  return content
    .replace(/<\?xml[^?]*\?>/, '')
    .replace(/<!DOCTYPE[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, '')
    .trim();
}

function scanIcons() {
  const categories = {};
  
  const catDirs = fs.readdirSync(ICONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  for (const cat of catDirs) {
    const pattern = path.join(ICONS_DIR, cat, '**', '*.svg').replace(/\\/g, '/');
    const files = glob.sync(pattern);
    if (files.length === 0) continue;
    
    const icons = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ICONS_DIR, file);
      icons.push({
        id: generateSymbolId(relativePath),
        name: path.basename(file, '.svg'),
        viewBox: extractViewBox(content),
        svgContent: extractContent(content),
        path: relativePath
      });
    }
    icons.sort((a, b) => a.name.localeCompare(b.name));
    categories[cat] = icons;
  }
  
  return { categories };
}

function generatePage(categories) {
  const catLabels = {
    'ui': 'UI Icons',
    'brands': 'Brand Logos',
    'dashboard': 'Dashboard',
    'macos': 'macOS',
    'custom': 'Custom'
  };
  
  let allIcons = [];
  let navButtons = '<button class="cat-btn active" data-cat="all">All</button>';
  let sections = '';
  
  for (const [cat, icons] of Object.entries(categories)) {
    allIcons.push(...icons);
    const label = catLabels[cat] || cat;
    navButtons += `<button class="cat-btn" data-cat="${cat}">${label} (${icons.length})</button>`;
    
    let cards = '';
    for (const icon of icons) {
      cards += `
        <div class="card" data-id="${icon.id}" data-name="${icon.name.toLowerCase()}" data-cat="${cat}">
          <svg viewBox="${icon.viewBox}">${icon.svgContent}</svg>
          <span class="name">${icon.name}</span>
          <span class="id">${icon.id}</span>
        </div>`;
    }
    
    sections += `
      <section class="cat-section" data-cat="${cat}">
        <h2>${label} <small>(${icons.length})</small></h2>
        <div class="grid">${cards}</div>
      </section>`;
  }
  
  // Generate inline sprite
  let symbols = '';
  for (const icons of Object.values(categories)) {
    for (const icon of icons) {
      symbols += `<symbol id="${icon.id}" viewBox="${icon.viewBox}">${icon.svgContent}</symbol>`;
    }
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Icon Library</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e5e5e5}
.header{position:sticky;top:0;background:rgba(10,10,10,.95);border-bottom:1px solid #2a2a2a;padding:1rem 2rem;z-index:100}
.header-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
h1{font-size:1.25rem;white-space:nowrap}
.search{flex:1;min-width:200px;max-width:400px}
.search input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;outline:none}
.search input:focus{border-color:#3b82f6}
.stats{margin-left:auto;font-size:.875rem;color:#888}
.nav{padding:1rem 2rem;max-width:1400px;margin:0 auto;display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.cat-btn{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer}
.cat-btn:hover{border-color:#3b82f6;color:#fff}
.cat-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}
.container{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
section h2{font-size:.875rem;color:#888;text-transform:uppercase;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:.5rem;margin-bottom:2rem}
.card{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:1rem;text-align:center;cursor:pointer;transition:all .2s}
.card:hover{border-color:#3b82f6;transform:translateY(-2px)}
.card svg{width:24px;height:24px;fill:currentColor;margin-bottom:.5rem}
.card .name{font-size:.6875rem;color:#888;word-break:break-all;display:block}
.card .id{font-size:.625rem;color:#555;display:block;margin-top:.25rem}
.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.75rem 1.5rem;border-radius:.5rem;opacity:0;transition:all .3s;z-index:1000;pointer-events:none}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.empty{text-align:center;padding:4rem;color:#888;display:none}
.sprite{display:none}
@media(max-width:768px){.header{padding:1rem}.grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}}
</style>
</head>
<body>
<div class="header">
  <div class="header-inner">
    <h1>Icon Library</h1>
    <div class="search"><input type="text" id="search" placeholder="Search icons..." autocomplete="off"></div>
    <div class="stats">${allIcons.length} icons</div>
  </div>
</div>
<div class="nav">${navButtons}</div>
<div class="container" id="container">${sections}</div>
<div class="empty" id="empty"><p>No icons found</p></div>
<div class="toast" id="toast"></div>
<svg class="sprite" xmlns="http://www.w3.org/2000/svg">${symbols}</svg>
<script>
const state={cat:'all',q:''};
const search=document.getElementById('search');
const container=document.getElementById('container');
const empty=document.getElementById('empty');
const toast=document.getElementById('toast');
const btns=document.querySelectorAll('.cat-btn');

search.addEventListener('input',e=>{state.q=e.target.value.toLowerCase();filter()});
btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>x.classList.remove('active'));b.classList.add('active');state.cat=b.dataset.cat;filter()}));

function filter(){
  const secs=container.querySelectorAll('section');
  let n=0;
  secs.forEach(s=>{
    const cat=s.dataset.cat;
    const cards=s.querySelectorAll('.card');
    let sn=0;
    cards.forEach(c=>{
      const ok=(state.cat==='all'||c.dataset.cat===state.cat)&&c.dataset.name.includes(state.q);
      c.style.display=ok?'':'none';
      if(ok){sn++;n++}
    });
    s.style.display=sn>0?'':'none';
  });
  container.style.display=n>0?'':'none';
  empty.style.display=n>0?'none':'';
}

container.addEventListener('click',e=>{
  const c=e.target.closest('.card');
  if(!c)return;
  navigator.clipboard.writeText(c.dataset.id).then(()=>show('Copied: '+c.dataset.id)).catch(()=>{});
});

function show(msg){
  toast.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2000);
}
</script>
</body>
</html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  
  if (!fs.existsSync(ICONS_DIR)) {
    console.log('No icons directory found');
    return;
  }
  
  const { categories } = scanIcons();
  const total = Object.values(categories).reduce((a, v) => a + v.length, 0);
  
  if (total === 0) {
    console.log('No icons found');
    return;
  }
  
  console.log(`Found ${total} icons in ${Object.keys(categories).length} categories`);
  
  const html = generatePage(categories);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
  console.log('Generated dist/index.html');
}

main().catch(console.error);
