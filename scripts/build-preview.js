#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');

function genId(p) {
  return p.replace(/\.(svg|png)$/, '').replace(/[\\\/]/g, '-').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function vb(c) {
  const m = c.match(/viewBox=["']([^"']+)["']/);
  return m ? m[1] : '0 0 24 24';
}

function inner(c) {
  return c.replace(/<\?xml[^?]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '')
    .replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/gi, '').trim();
}

// 按第一级目录分类（更稳定）
function getCat(rel) {
  return rel.split(/[\\/]/)[0];
}

function walk(dir) {
  const icons = [];
  if (!fs.existsSync(dir)) return icons;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      icons.push(...walk(p));
    } else if (f.name.endsWith('.svg') || f.name.endsWith('.png')) {
      const rel = path.relative(ICONS_DIR, p);
      const isSvg = f.name.endsWith('.svg');
      icons.push({
        id: genId(rel),
        name: f.name.replace(/\.(svg|png)$/, ''),
        path: rel,
        cat: getCat(rel),
        isSvg,
        viewBox: isSvg ? vb(fs.readFileSync(p, 'utf-8')) : '0 0 24 24',
        content: isSvg ? inner(fs.readFileSync(p, 'utf-8')) : ''
      });
    }
  }
  return icons;
}

function genPage(icons) {
  const cats = {};
  for (const i of icons) {
    if (!cats[i.cat]) cats[i.cat] = [];
    cats[i.cat].push(i);
  }
  for (const k in cats) cats[k].sort((a, b) => a.name.localeCompare(b.name));

  const labels = {
    'dashboard': 'Dashboard',
    'macos': 'macOS',
    'custom': 'Custom'
  };

  let nav = '<button class="btn on" data-c="all">All</button>';
  let data = {};

  for (const [cat, items] of Object.entries(cats)) {
    const label = labels[cat] || cat;
    nav += `<button class="btn" data-c="${cat}">${label} (${items.length})</button>`;
    data[cat] = items.map(i => ({
      id: i.id, name: i.name, cat: i.cat, isSvg: i.isSvg,
      viewBox: i.viewBox, content: i.content, path: i.path
    }));
  }

  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icons</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e5e5e5}
.h{position:sticky;top:0;background:rgba(10,10,10,.95);border-bottom:1px solid #2a2a2a;padding:1rem 2rem;z-index:100}
.hi{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
h1{font-size:1.25rem}.s{flex:1;min-width:200px;max-width:400px}
.s input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;outline:none}
.s input:focus{border-color:#3b82f6}
.nv{padding:1rem 2rem;max-width:1400px;margin:0 auto;display:flex;gap:.5rem;flex-wrap:wrap}
.btn{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer}
.btn:hover{border-color:#3b82f6;color:#fff}.btn.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ct{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
.se{display:none;margin-bottom:2rem}
.se.on{display:block}
.se h2{font-size:.875rem;color:#888;text-transform:uppercase;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:.5rem}
.c{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:1rem;text-align:center;cursor:pointer;transition:.2s;min-height:100px}
.c:hover{border-color:#3b82f6;transform:translateY(-2px)}
.c .ic{width:32px;height:32px;margin:0 auto .5rem;display:flex;align-items:center;justify-content:center}
.c .ic svg{width:32px;height:32px;fill:currentColor}
.c .ic img{width:32px;height:32px;object-fit:contain}
.c .ic .alt{color:#555;font-size:.625rem}
.n{font-size:.6875rem;color:#888;display:block;word-break:break-all}
.i{font-size:.625rem;color:#555;display:block;margin-top:.25rem}
.pg{display:flex;gap:.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap}
.pg button{padding:.25rem .5rem;background:#141414;border:1px solid #2a2a2a;border-radius:.25rem;color:#888;font-size:.75rem;cursor:pointer}
.pg button.on{background:#3b82f6;color:#fff;border-color:#3b82f6}
.t{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.75rem 1.5rem;border-radius:.5rem;opacity:0;transition:.3s;z-index:1000;pointer-events:none}.t.show{opacity:1;transform:translateX(-50%) translateY(0)}
.e{text-align:center;padding:4rem;color:#888;display:none}
.e.on{display:block}
@media(max-width:768px){.h{padding:1rem}.g{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}}
</style></head><body>
<div class="h"><div class="hi"><h1>Icons</h1><div class="s"><input id="q" placeholder="Search..."></div></div></div>
<div class="nv" id="nv">${nav}</div>
<div class="ct" id="ct"></div>
<div class="e" id="e"><p>No icons found</p></div>
<div class="t" id="t"></div>
<script>
const DATA=${json};
const PER_PAGE=200;
let cur='all',pg=0;

function $(id){return document.getElementById(id)}

function mkCard(i){
  let iconHtml;
  if(i.isSvg && i.content){
    iconHtml='<svg viewBox="'+i.viewBox+'">'+i.content+'</svg>';
  }else{
    iconHtml='<img src="icons/'+i.path+'" alt="'+i.name+'" onerror="this.parentNode.innerHTML=\\'<span class=\\\\'alt\\\\'>\\u56FE\\u6807\\u52A0\\u8F7D\\u5931\\u8D25</span>'">';
  }
  return '<div class="c" data-id="'+i.id+'" data-n="'+i.name.toLowerCase()+'">'+
    '<div class="ic">'+iconHtml+'</div>'+
    '<span class="n">'+i.name+'</span><span class="i">'+i.id+'</span></div>';
}

function render(cat,page,query){
  cur=cat;pg=page||0;
  let items=[];
  if(query){
    for(const c in DATA)for(const i of DATA[c])if(i.name.toLowerCase().includes(query)||i.id.toLowerCase().includes(query))items.push(i);
  }else if(cat==='all'){
    for(const c in DATA)items.push(...DATA[c]);
  }else{
    items=DATA[cat]||[];
  }
  
  // group by cat for sections
  const groups={};
  for(const i of items){
    if(!groups[i.cat])groups[i.cat]=[];
    groups[i.cat].push(i);
  }
  
  let html='';
  for(const [c,list] of Object.entries(groups)){
    const catItems=query?list:list.slice(pg*PER_PAGE,(pg+1)*PER_PAGE);
    if(catItems.length===0)continue;
    const pages=Math.ceil(list.length/PER_PAGE);
    let cards='';
    for(const i of catItems)cards+=mkCard(i);
    let pgh='';
    if(!query && pages>1){
      for(let i=0;i<pages;i++)pgh+='<button class="'+(i===pg?'on':'')+'" onclick="goPg('+i+')">'+(i+1)+'</button>';
    }
    html+='<div class="se on" data-c="'+c+'"><h2>'+c+' ('+list.length+')</h2><div class="g">'+cards+'</div>'+(pgh?'<div class="pg">'+pgh+'</div>':'')+'</div>';
  }
  
  $('ct').innerHTML=html||'';
  $('ct').style.display=html?'block':'none';
  $('e').classList.toggle('on',!html);
  
  document.querySelectorAll('.btn').forEach(b=>b.classList.toggle('on',b.dataset.c===cur));
}

function goPg(p){render(cur,p,$('q').value.toLowerCase());}

// nav
document.getElementById('nv').addEventListener('click',e=>{
  const b=e.target.closest('.btn');if(!b)return;
  render(b.dataset.c,0,$('q').value.toLowerCase());
});

// search
$('q').addEventListener('input',e=>render('all',0,e.target.value.toLowerCase()));

// copy
document.getElementById('ct').addEventListener('click',e=>{
  const c=e.target.closest('.c');if(!c)return;
  navigator.clipboard.writeText(c.dataset.id).then(()=>{
    const t=$('t');t.textContent='Copied: '+c.dataset.id;t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),2000);
  }).catch(()=>{});
});

// init
render('all',0,'');
</script></body></html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  if (!fs.existsSync(ICONS_DIR)) { console.log('No icons dir'); return; }

  const icons = walk(ICONS_DIR);
  if (icons.length === 0) { console.log('No icons found'); return; }

  // 统计分类
  const cats = {};
  for (const i of icons) {
    if (!cats[i.cat]) cats[i.cat] = 0;
    cats[i.cat]++;
  }
  console.log(`Found ${icons.length} icons:`);
  for (const [c, n] of Object.entries(cats)) console.log(`  ${c}: ${n}`);

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), genPage(icons), 'utf-8');
  console.log('Generated index.html');

  // Copy icons for direct access
  fs.copySync(ICONS_DIR, path.join(DIST_DIR, 'icons'));
  console.log('Copied icons to dist');

  // Sprite
  let syms = '';
  for (const i of icons) {
    if (i.isSvg && i.content) syms += `<symbol id="${i.id}" viewBox="${i.viewBox}">${i.content}</symbol>`;
  }
  fs.writeFileSync(path.join(DIST_DIR, 'sprite.svg'), `<svg xmlns="http://www.w3.org/2000/svg">${syms}</svg>`, 'utf-8');
  console.log('Generated sprite.svg');
}

main().catch(console.error);
