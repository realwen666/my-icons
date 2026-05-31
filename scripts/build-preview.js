#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

const ROOT = process.cwd();
const ICONS_DIR = path.join(ROOT, 'icons');
const DIST_DIR = path.join(ROOT, 'dist');

const CDN = {
  'dashboard/hd-icons': 'https://cdn.jsdelivr.net/gh/xushier/HD-Icons@master',
  'dashboard/homarr': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons@main/svg',
  'dashboard/homarr-png': 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons@main/png',
  'macos/whitesur': 'https://cdn.jsdelivr.net/gh/vinceliuice/WhiteSur-icon-theme@master/src/apps/scalable'
};

function genId(p) {
  return p.replace(/\.(png|svg)$/, '').replace(/[\\\/]/g, '-').toLowerCase()
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else if (/\.(png|svg)$/.test(f.name)) {
      const rel = path.relative(ICONS_DIR, p);
      const parts = rel.split(/[\\/]/);
      const catKey = parts.length >= 2 ? parts[0] + '-' + parts[1] : parts[0];
      let url = '';
      for (const [prefix, base] of Object.entries(CDN)) {
        if (rel.startsWith(prefix)) { url = base + '/' + rel.slice(prefix.length + 1); break; }
      }
      if (!url) url = 'icons/' + rel;
      out.push({ id: genId(rel), name: f.name.replace(/\.(png|svg)$/, ''), cat: catKey, url, isSvg: f.name.endsWith('.svg') });
    }
  }
  return out;
}

function genPage(icons) {
  const cats = {};
  for (const i of icons) { (cats[i.cat] ||= []).push(i); }
  for (const k in cats) cats[k].sort((a, b) => a.name.localeCompare(b.name));

  const labels = { 'dashboard-hd-icons': 'HD-Icons', 'dashboard-homarr': 'Homarr SVG', 'dashboard-homarr-png': 'Homarr PNG', 'macos-whitesur': 'WhiteSur macOS', 'custom': 'Custom' };
  let nav = '';
  const data = {};
  for (const [cat, items] of Object.entries(cats)) {
    nav += `<button data-c="${cat}">${labels[cat] || cat} (${items.length})</button>`;
    data[cat] = items.map(i => ({ id: i.id, name: i.name, cat: i.cat, url: i.url, isSvg: i.isSvg }));
  }
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icons</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#e5e5e5}
.h{padding:1rem 2rem;border-bottom:1px solid #222;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;position:sticky;top:0;background:#0a0a0a;z-index:100}
h1{font-size:1.25rem;white-space:nowrap}.s{flex:1;min-width:200px;max-width:400px}
.s input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;outline:none}
.nv{padding:1rem 2rem;display:flex;gap:.5rem;flex-wrap:wrap;max-width:1400px;margin:0 auto}
.nv button{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer}
.nv button:hover{border-color:#3b82f6;color:#fff}.nv button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ct{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
.sc{margin-bottom:2rem}.sc h2{font-size:.875rem;color:#888;text-transform:uppercase;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:.5rem}
.c{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:.75rem .5rem;text-align:center;cursor:pointer;transition:.2s}
.c:hover{border-color:#3b82f6;transform:translateY(-2px)}
.c .ic{width:48px;height:48px;margin:0 auto .4rem;display:flex;align-items:center;justify-content:center}
.c .ic img{max-width:48px;max-height:48px;object-fit:contain}
.c .ic svg{width:40px;height:40px;fill:currentColor}
.n{font-size:.6875rem;color:#888;word-break:break-all}.i{font-size:.625rem;color:#555;margin-top:.2rem;display:block}
.t{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.6rem 1.2rem;border-radius:.5rem;opacity:0;transition:.3s;z-index:1000;pointer-events:none;white-space:nowrap}
.t.show{opacity:1;transform:translateX(-50%) translateY(0)}
.e{text-align:center;padding:4rem;color:#666}
.pg{display:flex;gap:.4rem;justify-content:center;margin-top:.75rem}
.pg button{padding:.2rem .6rem;background:#141414;border:1px solid #2a2a2a;border-radius:.25rem;color:#888;font-size:.75rem;cursor:pointer}
.pg button.on{background:#3b82f6;color:#fff}
@media(max-width:768px){.g{grid-template-columns:repeat(auto-fill,minmax(75px,1fr))}}
</style></head><body>
<div class="h"><h1>Icons</h1><div class="s"><input id="q" placeholder="Search..."></div></div>
<div class="nv" id="nv"><button data-c="all" class="on">All (${icons.length})</button>${nav}</div>
<div class="ct" id="ct"></div><div class="t" id="t"></div>
<script>
const DATA=${json},PER=300;
let cur='all',pg=0;
function $(id){return document.getElementById(id)}
function card(i){const ic=i.isSvg?'<svg viewBox="0 0 24 24"><use href="'+i.url+'"></use></svg>':'<img src="'+i.url+'" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'<span style=color:#c00;font-size:9px>fail</span>\'">';return '<div class="c" data-id="'+i.id+'"><div class="ic">'+ic+'</div><span class="n">'+i.name+'</span><span class="i">'+i.id+'</span></div>'}
function render(cat,page,q){
  cur=cat;pg=page||0;const query=(q||'').toLowerCase().trim();
  let all=[];
  if(query){for(const c in DATA)for(const i of DATA[c])if(i.name.toLowerCase().includes(query)||i.id.toLowerCase().includes(query))all.push(i)}
  else if(cat==='all'){for(const c in DATA)all.push(...DATA[c])}else{all=DATA[cat]||[]}
  if(!all.length){$('ct').innerHTML='<div class="e">No icons</div>';upd();return}
  const g={};for(const i of all){g[i.cat]||(g[i.cat]=[]);g[i.cat].push(i)}
  let h='';
  for(const [cn,list] of Object.entries(g)){
    const lb=cn==='dashboard-hd-icons'?'HD-Icons':cn==='dashboard-homarr'?'Homarr SVG':cn==='dashboard-homarr-png'?'Homarr PNG':cn==='macos-whitesur'?'WhiteSur macOS':cn==='custom'?'Custom':cn;
    let d=list,pgn='';
    if(!query&&cat!=='all'){const ps=Math.ceil(list.length/PER);d=list.slice(pg*PER,(pg+1)*PER);if(ps>1){let b='';for(let j=0;j<ps;j++)b+='<button class="'+(j===pg?'on':'')+'" onclick="go('+j+')">'+(j+1)+'</button>';pgn='<div class="pg">'+b+'</div>'}}
    else if(cat==='all'&&!query){d=list.slice(0,PER);if(list.length>PER)pgn='<div class="pg"><button class="on">1</button><span style="color:#666;font-size:.75rem;margin-left:.3rem">+'+(list.length-PER)+' more</span></div>'}
    let c='';for(const i of d)c+=card(i);h+='<div class="sc"><h2>'+lb+' ('+list.length+')</h2><div class="g">'+c+'</div>'+pgn+'</div>'
  }
  $('ct').innerHTML=h;upd()
}
function go(p){render(cur,p,$('q').value)}
function upd(){document.querySelectorAll('.nv button').forEach(b=>b.classList.toggle('on',b.dataset.c===cur))}
$('nv').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;render(b.dataset.c,0,$('q').value)})
$('q').addEventListener('input',e=>render('all',0,e.target.value))
$('ct').addEventListener('click',e=>{const c=e.target.closest('.c');if(!c)return;navigator.clipboard.writeText(c.dataset.id).then(()=>{const t=$('t');t.textContent='Copied: '+c.dataset.id;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000)}).catch(()=>{})})
render('all',0,'')
</script></body></html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  if (!fs.existsSync(ICONS_DIR)) { console.log('No icons dir'); return; }
  const icons = walk(ICONS_DIR);
  if (!icons.length) { console.log('No icons'); return; }
  const cats = {};
  for (const i of icons) cats[i.cat] = (cats[i.cat] || 0) + 1;
  console.log(`Found ${icons.length} icons:`, cats);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), genPage(icons), 'utf-8');
  console.log('Generated index.html');
}
main().catch(console.error);
