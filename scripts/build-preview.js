#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');

// CDN 映射 - PNG 从 jsdelivr 直接加载
const CDN_MAP = {
  'dashboard/hd-icons': 'https://cdn.jsdelivr.net/gh/xushier/HD-Icons@master',
  'dashboard/homarr': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons@main/svg',
  'dashboard/homarr-png': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons@main/png',
  'macos/whitesur': 'https://cdn.jsdelivr.net/gh/vinceliuice/WhiteSur-icon-theme@master/src/apps/scalable'
};

function genId(p) {
  return p.replace(/\.(png|svg)$/, '').replace(/[\\/]/g, '-').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function walk(dir) {
  const icons = [];
  if (!fs.existsSync(dir)) return icons;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) icons.push(...walk(p));
    else if (f.name.endsWith('.png') || f.name.endsWith('.svg')) {
      const rel = path.relative(ICONS_DIR, p);
      const parts = rel.split(/[\\/]/);
      icons.push({
        id: genId(rel),
        name: f.name.replace(/\.(png|svg)$/, ''),
        path: rel,
        cat: parts.length >= 2 ? parts[0] + '-' + parts[1] : parts[0],
        isSvg: f.name.endsWith('.svg')
      });
    }
  }
  return icons;
}

function getCdnUrl(icon) {
  for (const [prefix, base] of Object.entries(CDN_MAP)) {
    if (icon.path.startsWith(prefix)) {
      return base + '/' + icon.path.slice(prefix.length + 1);
    }
  }
  return 'icons/' + icon.path;
}

function genPage(icons) {
  const cats = {};
  for (const i of icons) {
    if (!cats[i.cat]) cats[i.cat] = [];
    cats[i.cat].push(i);
  }
  for (const k in cats) cats[k].sort((a, b) => a.name.localeCompare(b.name));

  const labels = {
    'dashboard-hd-icons': 'HD-Icons',
    'dashboard-homarr': 'Homarr SVG',
    'dashboard-homarr-png': 'Homarr PNG',
    'macos-whitesur': 'WhiteSur macOS',
    'custom': 'Custom'
  };

  let nav = '<button class="btn on" data-c="all">All (' + icons.length + ')</button>';
  const catData = {};

  for (const [cat, items] of Object.entries(cats)) {
    const label = labels[cat] || cat;
    nav += `<button class="btn" data-c="${cat}">${label} (${items.length})</button>`;
    catData[cat] = items.map(i => ({
      id: i.id, name: i.name, cat: cat,
      url: getCdnUrl(i), isSvg: i.isSvg
    }));
  }

  const json = JSON.stringify(catData).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icon Library</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e5e5e5}
.h{position:sticky;top:0;background:rgba(10,10,10,.95);border-bottom:1px solid #2a2a2a;padding:1rem 2rem;z-index:100}
.hi{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
h1{font-size:1.25rem}.s{flex:1;min-width:200px;max-width:400px}
.s input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;outline:none;font-size:.875rem}
.s input:focus{border-color:#3b82f6}
.nv{padding:1rem 2rem;max-width:1400px;margin:0 auto;display:flex;gap:.5rem;flex-wrap:wrap}
.btn{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer;transition:.2s}
.btn:hover{border-color:#3b82f6;color:#fff}.btn.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ct{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
.sc h2{font-size:.875rem;color:#888;text-transform:uppercase;margin:1.5rem 0 .75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.sc:first-child h2{margin-top:0}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:.5rem}
.c{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:.75rem .5rem;text-align:center;cursor:pointer;transition:.2s}
.c:hover{border-color:#3b82f6;transform:translateY(-2px);box-shadow:0 4px 12px rgba(59,130,246,.15)}
.c .ic{width:48px;height:48px;margin:0 auto .4rem;display:flex;align-items:center;justify-content:center}
.c .ic img{max-width:48px;max-height:48px;object-fit:contain}
.c .ic svg{width:40px;height:40px;fill:currentColor}
.n{font-size:.6875rem;color:#888;display:block;word-break:break-all;line-height:1.3}
.i{font-size:.625rem;color:#555;display:block;margin-top:.2rem}
.pg{display:flex;gap:.4rem;justify-content:center;margin-top:.75rem;flex-wrap:wrap}
.pg button{padding:.2rem .6rem;background:#141414;border:1px solid #2a2a2a;border-radius:.25rem;color:#888;font-size:.75rem;cursor:pointer}
.pg button.on{background:#3b82f6;color:#fff;border-color:#3b82f6}
.e{text-align:center;padding:4rem;color:#666}
.t{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.6rem 1.2rem;border-radius:.5rem;font-size:.875rem;opacity:0;transition:all .3s;z-index:1000;pointer-events:none;white-space:nowrap}
.t.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media(max-width:768px){.h{padding:1rem}.g{grid-template-columns:repeat(auto-fill,minmax(75px,1fr))}}
</style></head><body>
<div class="h"><div class="hi"><h1>Icons</h1><div class="s"><input id="q" placeholder="Search icons..." autocomplete="off"></div></div></div>
<div class="nv" id="nv">${nav}</div>
<div class="ct" id="ct"></div>
<div class="t" id="t"></div>
<script>
const DATA=${json};
const PER=300;
let cur='all',pg=0;

function $(id){return document.getElementById(id)}

function mkCard(i){
  const img=i.isSvg
    ?'<svg viewBox="0 0 24 24"><use href="'+i.url+'"></use></svg>'
    :'<img src="'+i.url+'" alt="'+i.name+'" loading="lazy" onerror="this.parentNode.innerHTML=\'<span style=color:#c00;font-size:10px>failed</span>\'">';
  return '<div class="c" data-id="'+i.id+'">'+
    '<div class="ic">'+img+'</div>'+
    '<span class="n">'+i.name+'</span>'+
    '<span class="i">'+i.id+'</span></div>';
}

function render(cat,page,q){
  cur=cat;pg=page||0;
  const query=(q||'').toLowerCase().trim();
  
  let allItems=[];
  if(query){
    for(const c in DATA)for(const i of DATA[c])if(i.name.toLowerCase().includes(query)||i.id.toLowerCase().includes(query))allItems.push(i);
  }else if(cat==='all'){
    for(const c in DATA)allItems.push(...DATA[c]);
  }else{
    allItems=DATA[cat]||[];
  }
  
  if(allItems.length===0){
    $('ct').innerHTML='<div class="e">No icons found</div>';
    _updateBtns();return;
  }
  
  const groups={};
n  for(const i of allItems){if(!groups[i.cat])groups[i.cat]=[];groups[i.cat].push(i);}
  
  let html='';
  for(const [cname,list] of Object.entries(groups)){
    const label=cname==='dashboard-hd-icons'?'HD-Icons':cname==='dashboard-homarr'?'Homarr SVG':cname==='dashboard-homarr-png'?'Homarr PNG':cname==='macos-whitesur'?'WhiteSur macOS':cname==='custom'?'Custom':cname;
    
    let displayItems=list,pagination='';
    if(!query&&cat!=='all'){
      const pages=Math.ceil(list.length/PER);
      displayItems=list.slice(pg*PER,(pg+1)*PER);
      if(pages>1){let bt='';for(let i=0;i<pages;i++)bt+='<button class="'+(i===pg?'on':'')+'" onclick="go('+i+')">'+(i+1)+'</button>';pagination='<div class="pg">'+bt+'</div>';}
    }else if(cat==='all'&&!query){
      displayItems=list.slice(0,PER);
      if(list.length>PER)pagination='<div class="pg"><button class="on">1</button><span style="color:#666;font-size:.75rem;margin-left:.3rem">+'+(list.length-PER)+' more</span></div>';
    }
    
    let cards='';
    for(const i of displayItems)cards+=mkCard(i);
    html+='<div class="sc"><h2>'+label+' ('+list.length+')</h2><div class="g">'+cards+'</div>'+pagination+'</div>';
  }
  
  $('ct').innerHTML=html;
  _updateBtns();
}

function go(p){render(cur,p,document.getElementById('q').value);}

function _updateBtns(){
  document.querySelectorAll('.btn').forEach(b=>b.classList.toggle('on',b.dataset.c===cur));
}

document.getElementById('nv').addEventListener('click',e=>{
  const b=e.target.closest('.btn');if(!b)return;
  render(b.dataset.c,0,$('q').value);
});

$('q').addEventListener('input',e=>render('all',0,e.target.value));

document.getElementById('ct').addEventListener('click',e=>{
  const c=e.target.closest('.c');if(!c)return;
  navigator.clipboard.writeText(c.dataset.id).then(()=>{
    const t=$('t');t.textContent='Copied: '+c.dataset.id;t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2000);
  }).catch(()=>{});
});

render('all',0,'');
</script></body></html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  if (!fs.existsSync(ICONS_DIR)) { console.log('No icons dir'); return; }

  const icons = walk(ICONS_DIR);
  if (icons.length === 0) { console.log('No icons found'); return; }

  const cats = {};
  for (const i of icons) { cats[i.cat] = (cats[i.cat] || 0) + 1; }
  console.log(`Found ${icons.length} icons:`);
  for (const [c, n] of Object.entries(cats)) console.log(`  ${c}: ${n}`);

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), genPage(icons), 'utf-8');
  console.log('Generated index.html');
}

main().catch(console.error);
