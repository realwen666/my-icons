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
      let url = '';
      for (const [prefix, base] of Object.entries(CDN)) {
        if (rel.startsWith(prefix)) { url = base + '/' + rel.slice(prefix.length + 1); break; }
      }
      if (!url) url = 'icons/' + rel;
      const parts = rel.split(/[\\/]/);
      out.push({
        id: genId(rel),
        name: f.name.replace(/\.(png|svg)$/, ''),
        cat: parts.length >= 2 ? parts[0] + '-' + parts[1] : parts[0],
        url,
        isSvg: f.name.endsWith('.svg')
      });
    }
  }
  return out;
}

function genPage(icons) {
  const cats = {};
  for (const i of icons) { (cats[i.cat] ||= []).push(i); }
  for (const k in cats) cats[k].sort((a, b) => a.name.localeCompare(b.name));

  const labels = {
    'dashboard-hd-icons': 'HD-Icons',
    'dashboard-homarr': 'Homarr SVG',
    'dashboard-homarr-png': 'Homarr PNG',
    'macos-whitesur': 'WhiteSur macOS',
    'custom': 'Custom'
  };

  let nav = '';
  const catData = {};
  for (const [cat, items] of Object.entries(cats)) {
    nav += `<button data-c="${cat}">${labels[cat] || cat} (${items.length})</button>`;
    catData[cat] = items.map(i => ({ id: i.id, name: i.name, cat: i.cat, url: i.url, isSvg: i.isSvg }));
  }

  // Use template literal to avoid quote escaping hell
  const jsonData = JSON.stringify(catData).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Icon Library</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5}
.h{display:flex;align-items:center;gap:1rem;padding:1rem 2rem;border-bottom:1px solid #222;position:sticky;top:0;background:rgba(10,10,10,.95);z-index:100;flex-wrap:wrap}
h1{font-size:1.25rem;flex-shrink:0}
.s{flex:1;min-width:200px;max-width:400px}
.s input{width:100%;padding:.5rem 1rem;background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;color:#e5e5e5;font-size:.875rem;outline:none}
.nv{display:flex;gap:.5rem;padding:1rem 2rem;flex-wrap:wrap;max-width:1400px;margin:0 auto}
.nv button{padding:.375rem .75rem;background:#141414;border:1px solid #2a2a2a;border-radius:.375rem;color:#888;font-size:.8125rem;cursor:pointer;transition:.2s}
.nv button:hover{border-color:#3b82f6;color:#fff}
.nv button.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ct{max-width:1400px;margin:0 auto;padding:0 2rem 2rem}
.sc{margin-bottom:2rem}
.sc h2{font-size:.875rem;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid #2a2a2a}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:.5rem}
.c{background:#141414;border:1px solid #2a2a2a;border-radius:.5rem;padding:.75rem .5rem;text-align:center;cursor:pointer;transition:.2s}
.c:hover{border-color:#3b82f6;transform:translateY(-2px);box-shadow:0 4px 12px rgba(59,130,246,.15)}
.ic{width:48px;height:48px;margin:0 auto .4rem;display:flex;align-items:center;justify-content:center}
.ic img{max-width:48px;max-height:48px;object-fit:contain;display:block}
.ic svg{width:40px;height:40px;fill:currentColor}
.n{font-size:.6875rem;color:#888;display:block;line-height:1.3;word-break:break-all}
.i{font-size:.625rem;color:#555;display:block;margin-top:.2rem}
.e{text-align:center;padding:4rem;color:#666;font-size:.875rem}
.t{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(100px);background:#3b82f6;color:#fff;padding:.6rem 1.2rem;border-radius:.5rem;font-size:.875rem;opacity:0;transition:all .3s;z-index:1000;pointer-events:none;white-space:nowrap}
.t.show{opacity:1;transform:translateX(-50%) translateY(0)}
.pg{display:flex;gap:.4rem;justify-content:center;margin-top:.75rem;flex-wrap:wrap}
.pg button{padding:.2rem .6rem;background:#141414;border:1px solid #2a2a2a;border-radius:.25rem;color:#888;font-size:.75rem;cursor:pointer}
.pg button.on{background:#3b82f6;color:#fff;border-color:#3b82f6}
.pg button:hover{border-color:#555}
@media(max-width:768px){.h{padding:1rem}.g{grid-template-columns:repeat(auto-fill,minmax(75px,1fr))}}
</style>
</head>
<body>
<div class="h"><h1>Icons</h1><div class="s"><input id="q" placeholder="Search icons..."></div></div>
<div class="nv" id="nv"><button data-c="all" class="on">All (${icons.length})</button>${nav}</div>
<div class="ct" id="ct"></div>
<div class="t" id="t"></div>
<script>
// Inject data
const DATA = ${jsonData};
const PER = 300;
let cur = 'all', pg = 0;

function $(id) { return document.getElementById(id); }

// Create DOM element from icon data
function makeCard(icon) {
  var el = document.createElement('div');
  el.className = 'c';
  el.dataset.id = icon.id;
  
  var ic = document.createElement('div');
  ic.className = 'ic';
  
  if (icon.isSvg) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', icon.url);
    svg.appendChild(use);
    ic.appendChild(svg);
  } else {
    var img = document.createElement('img');
    img.src = icon.url;
    img.alt = icon.name;
    img.loading = 'lazy';
    img.onerror = function() { ic.textContent = 'fail'; };
    ic.appendChild(img);
  }
  
  el.appendChild(ic);
  
  var n = document.createElement('span');
  n.className = 'n';
  n.textContent = icon.name;
  el.appendChild(n);
  
  var i = document.createElement('span');
  i.className = 'i';
  i.textContent = icon.id;
  el.appendChild(i);
  
  return el;
}

function render(cat, page, q) {
  cur = cat; pg = page || 0;
  var query = (q || '').toLowerCase().trim();
  var all = [];
  
  if (query) {
    for (var c in DATA) {
      for (var j = 0; j < DATA[c].length; j++) {
        var item = DATA[c][j];
        if (item.name.toLowerCase().indexOf(query) !== -1 || item.id.toLowerCase().indexOf(query) !== -1) {
          all.push(item);
        }
      }
    }
  } else if (cat === 'all') {
    for (var c2 in DATA) all.push.apply(all, DATA[c2]);
  } else {
    all = DATA[cat] || [];
  }
  
  if (!all.length) {
    $('ct').innerHTML = '<div class="e">No icons found</div>';
    updateBtns();
    return;
  }
  
  var groups = {};
  for (var i = 0; i < all.length; i++) {
    var item = all[i];
    if (!groups[item.cat]) groups[item.cat] = [];
    groups[item.cat].push(item);
  }
  
  $('ct').innerHTML = '';
  
  for (var catName in groups) {
    var list = groups[catName];
    var label = catName === 'dashboard-hd-icons' ? 'HD-Icons' :
      catName === 'dashboard-homarr' ? 'Homarr SVG' :
      catName === 'dashboard-homarr-png' ? 'Homarr PNG' :
      catName === 'macos-whitesur' ? 'WhiteSur macOS' :
      catName === 'custom' ? 'Custom' : catName;
    
    var displayItems = list;
    
    if (!query && cat !== 'all') {
      var pages = Math.ceil(list.length / PER);
      displayItems = list.slice(pg * PER, (pg + 1) * PER);
      
      var sec = document.createElement('div');
      sec.className = 'sc';
      
      var h2 = document.createElement('h2');
      h2.textContent = label + ' (' + list.length + ')';
      sec.appendChild(h2);
      
      var grid = document.createElement('div');
      grid.className = 'g';
      for (var k = 0; k < displayItems.length; k++) {
        grid.appendChild(makeCard(displayItems[k]));
      }
      sec.appendChild(grid);
      
      if (pages > 1) {
        var pgDiv = document.createElement('div');
        pgDiv.className = 'pg';
        for (var p = 0; p < pages; p++) {
          var btn = document.createElement('button');
          btn.textContent = p + 1;
          if (p === pg) btn.className = 'on';
          btn.onclick = (function(pageNum) { return function() { go(pageNum); }; })(p);
          pgDiv.appendChild(btn);
        }
        sec.appendChild(pgDiv);
      }
      $('ct').appendChild(sec);
      
    } else if (cat === 'all' && !query) {
      displayItems = list.slice(0, PER);
      
      var sec2 = document.createElement('div');
      sec2.className = 'sc';
      
      var h22 = document.createElement('h2');
      h22.textContent = label + ' (' + list.length + ')';
      sec2.appendChild(h22);
      
      var grid2 = document.createElement('div');
      grid2.className = 'g';
      for (var k2 = 0; k2 < displayItems.length; k2++) {
        grid2.appendChild(makeCard(displayItems[k2]));
      }
      sec2.appendChild(grid2);
      
      if (list.length > PER) {
        var pgDiv2 = document.createElement('div');
        pgDiv2.className = 'pg';
        pgDiv2.innerHTML = '<button class="on">1</button><span style="color:#666;font-size:.75rem;margin-left:.3rem">+' + (list.length - PER) + ' more</span>';
        sec2.appendChild(pgDiv2);
      }
      $('ct').appendChild(sec2);
      
    } else {
      var sec3 = document.createElement('div');
      sec3.className = 'sc';
      
      var h23 = document.createElement('h2');
      h23.textContent = label + ' (' + list.length + ')';
      sec3.appendChild(h23);
      
      var grid3 = document.createElement('div');
      grid3.className = 'g';
      for (var k3 = 0; k3 < displayItems.length; k3++) {
        grid3.appendChild(makeCard(displayItems[k3]));
      }
      sec3.appendChild(grid3);
      $('ct').appendChild(sec3);
    }
  }
  
  updateBtns();
}

function go(p) {
  render(cur, p, $('q').value);
}

function updateBtns() {
  document.querySelectorAll('.nv button').forEach(function(b) {
    b.classList.toggle('on', b.dataset.c === cur);
  });
}

$('nv').addEventListener('click', function(e) {
  var b = e.target.closest('button');
  if (!b) return;
  render(b.dataset.c, 0, $('q').value);
});

$('q').addEventListener('input', function(e) {
  render('all', 0, e.target.value);
});

$('ct').addEventListener('click', function(e) {
  var c = e.target.closest('.c');
  if (!c) return;
  navigator.clipboard.writeText(c.dataset.id).then(function() {
    var t = $('t');
    t.textContent = 'Copied: ' + c.dataset.id;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2000);
  }).catch(function() {});
});

render('all', 0, '');
</script>
</body>
</html>`;
}

async function main() {
  fs.ensureDirSync(DIST_DIR);
  if (!fs.existsSync(ICONS_DIR)) { console.log('No icons dir'); return; }
  
  const icons = walk(ICONS_DIR);
  if (!icons.length) { console.log('No icons'); return; }
  
  const cats = {};
  for (const i of icons) cats[i.cat] = (cats[i.cat] || 0) + 1;
  console.log('Found ' + icons.length + ' icons:', cats);
  
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), genPage(icons), 'utf-8');
  console.log('Generated index.html');
}

main().catch(console.error);
