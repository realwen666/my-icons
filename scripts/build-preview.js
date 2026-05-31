#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');

function genId(p) {
  return p.replace(/\.svg$/, '').replace(/[\\\/]/g, '-').toLowerCase()
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

function walk(dir) {
  const icons = [];
  if (!fs.existsSync(dir)) return icons;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      icons.push(...walk(p));
    } else if (f.name.endsWith('.svg') || f.name.endsWith('.png')) {
      const rel = path.relative(ICONS_DIR, p);
      const cat = rel.split(path.sep)[0];
      icons.push({
        id: genId(rel),
        name: f.name.replace(/\.svg$|\.png$/, ''),
        path: rel,
        cat,
        viewBox: f.name.endsWith('.svg') ? vb(fs.readFileSync(p, 'utf-8')) : '0 0 24 24',
        content: f.name.endsWith('.svg') ? inner(fs.readFileSync(p, 'utf-8')) : ''
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
    dashboard: 'Dashboard', macos: 'macOS', custom: 'Custom',
    'dashboard-hd-icons': 'HD-Icons', 'dashboard-homarr': 'Homarr SVG',
    'dashboard-homarr-png': 'Homarr PNG', 'macos-whitesur': 'WhiteSur'
  };

  let nav = '<button class="btn active" data-c="all">All (' + icons.length + ')</button>';
  let secs = '';
  let syms = '';

  for (const [cat, items] of Object.entries(cats)) {
    nav += `<button class="btn" data-c="${cat}">${labels[cat] || cat} (${items.length})</button>`;
    let cards = '';
    for (const i of items) {
      cards += `<div class="c" data-c="${cat}" data-n="${i.name.toLowerCase()}" data-id="${i.id}">` +
        `<svg viewBox="${i.viewBox}">${i.content}</svg>` +
        `<span class="n">${i.name}</span><span class="id">${i.id}</span></div>`;
      syms += `<symbol id="${i.id}" viewBox="${i.viewBox}">${i.content}</symbol>`;
    }
    secs += `<section data-c="${cat}"><h2>${labels[cat] || cat} (${items.length})</h2><div class="g">${cards}</div></section>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icons</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e5e5e5}
.h{position:sticky;top:0;background:rgba(10,10,10,.95);border-bottom:1px solid #2a2a2a;padding:1rem 2rem;z-index:100}
.hi{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
h1{font-size:1.25rem}.s{flex:1;min-width:200px;max-width:400px}
.s input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;outline:none}
.nv{padding:1rem 2rem;max-width:1400px;margin:0 auto;display:flex;gap:.5rem;flex-wrap:wrap}
.btn{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer}
.btn:hover{border-color:#3b82f6;color:#fff}.btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ct{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
h2{font-size:.875rem;color:#888;text-transform:uppercase;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:.5rem;margin-bottom:2rem}
.c{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:1rem;text-align:center;cursor:pointer;transition:.2s}
.c:hover{border-color:#3b82f6;transform:translateY(-2px)}.c svg{width:24px;height:24px;fill:currentColor;margin-bottom:.5rem}
.n{font-size:.6875rem;color:#888;display:block}.id{font-size:.625rem;color:#555;display:block;margin-top:.25rem}
.t{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.75rem 1.5rem;border-radius:.5rem;opacity:0;transition:.3s;z-index:1000;pointer-events:none}.t.show{opacity:1;transform:translateX(-50%) translateY(0)}
.e{text-align:center;padding:4rem;color:#888;display:none}@media(max-width:768px){.h{padding:1rem}.g{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}}
</style></head><body><div class="h"><div class="hi"><h1>Icons</h1><div class="s"><input id="q" placeholder="Search..."></div></div></div>
<div class="nv">${nav}</div><div class="ct" id="ct">${secs}</div><div class="e" id="e"><p>No icons</p></div><div class="t" id="t"></div>
<svg style="display:none">${syms}</svg><script>
const $=id=>document.getElementById(id),q=$('q'),ct=$('ct'),e=$('e'),t=$('t'),btns=document.querySelectorAll('.btn');
let c='all',s='';q.addEventListener('input',v=>{s=v.target.value.toLowerCase();f()});
btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>x.classList.remove('active'));b.classList.add('active');c=b.dataset.c;f()}));
function f(){let n=0;ct.querySelectorAll('section').forEach(sc=>{let sn=0;sc.querySelectorAll('.c').forEach(i=>{const ok=(c==='all'||i.dataset.c===c)&&i.dataset.n.includes(s);i.style.display=ok?'':'none';if(ok)sn++});sc.style.display=sn>0?'':'none';n+=sn});ct.style.display=n>0?'':'none';e.style.display=n>0?'none':''}
ct.addEventListener('click',x=>{const i=x.target.closest('.c');if(!i)return;navigator.clipboard.writeText(i.dataset.id).then(()=>{t.textContent='Copied: '+i.dataset.id;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000)}).catch(()=>{})})
</script></body></html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  if (!fs.existsSync(ICONS_DIR)) { console.log('No icons dir'); return; }

  const icons = walk(ICONS_DIR);
  if (icons.length === 0) { console.log('No icons found'); return; }

  console.log(`Found ${icons.length} icons`);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), genPage(icons), 'utf-8');
  console.log('Generated index.html');

  // Also generate sprite.svg
  let syms = '';
  for (const i of icons) {
    if (i.content) syms += `<symbol id="${i.id}" viewBox="${i.viewBox}">${i.content}</symbol>`;
  }
  fs.writeFileSync(path.join(DIST_DIR, 'sprite.svg'), `<svg xmlns="http://www.w3.org/2000/svg">${syms}</svg>`, 'utf-8');
  console.log('Generated sprite.svg');
}

main().catch(console.error);
