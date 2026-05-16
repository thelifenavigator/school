/**
 * TLN Shared Whiteboard — whiteboard.js
 * Include AFTER Font Awesome and this script injects
 * a full whiteboard into any element you pass.
 *
 * Usage:
 *   TLNBoard.init('container-id', { role: 'teacher'|'student', userName: '...', readOnly: false });
 *
 * Teacher gets full access always.
 * Student access is controlled by TLNBoard.setWriteAccess(true/false)
 */

window.TLNBoard = (function() {

  const COLORS = [
    '#000000','#ffffff','#ef4444','#f97316','#eab308',
    '#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4',
    '#84cc16','#a16207','#64748b','#1e293b','#7f1d1d'
  ];

  const MATH_SYMBOLS = [
    ['+','−','×','÷','=','≠','≤','≥'],
    ['√','²','³','π','∞','∑','∫','∆'],
    ['α','β','θ','°','½','¼','∠','∝'],
    ['∈','∉','⊂','⊃','∪','∩','∀','∃']
  ];

  function init(containerId, opts) {
    opts = opts || {};
    const role     = opts.role     || 'student';
    const userName = opts.userName || 'User';
    const readOnly = (role === 'student') ? true : false;

    const wrap = document.getElementById(containerId);
    if (!wrap) { console.error('TLNBoard: container not found:', containerId); return; }

    // Inject CSS once
    if (!document.getElementById('tln-board-css')) {
      const style = document.createElement('style');
      style.id = 'tln-board-css';
      style.textContent = `
        .tln-wb{background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;font-family:'Poppins',sans-serif}
        .tln-wb-head{background:#0d1117;border-bottom:1px solid #30363d;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px}
        .tln-wb-title{font-size:.78rem;font-weight:600;color:#60a5fa;display:flex;align-items:center;gap:7px}
        .tln-wb-toolbar{background:#0d1117;border-bottom:1px solid #30363d;padding:7px 12px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
        .tln-wb-grp{display:flex;align-items:center;gap:4px;padding-right:9px;border-right:1px solid #30363d;flex-wrap:wrap}
        .tln-wb-grp:last-child{border-right:none;padding-right:0}
        .tln-wb-lbl{font-size:.6rem;color:#8b949e;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;margin-right:3px}
        .tln-btn{background:#21262d;border:1px solid #30363d;border-radius:7px;color:#e6edf3;min-width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:.82rem;cursor:pointer;padding:0 8px;font-family:inherit;white-space:nowrap;transition:all .15s;touch-action:manipulation}
        .tln-btn:hover{background:#30363d}
        .tln-btn.on{background:#0073e6;border-color:#0073e6;color:#fff}
        .tln-btn.er{background:#2a1a1a;border-color:#e53935;color:#f87171}
        .tln-sz{background:#21262d;border:1px solid #30363d;border-radius:7px;color:#e6edf3;height:34px;min-width:34px;padding:0 6px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;touch-action:manipulation}
        .tln-sz.on{background:#0073e6;border-color:#0073e6;color:#fff}
        .tln-csw{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .12s;flex-shrink:0;touch-action:manipulation}
        .tln-csw:hover{transform:scale(1.2)}
        .tln-csw.on{border-color:#fff;transform:scale(1.1)}
        .tln-math{background:#1a1a2a;border:1px solid #3b82f6;border-radius:6px;color:#93c5fd;height:32px;padding:0 7px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.95rem;transition:all .15s;font-family:'Times New Roman',serif;touch-action:manipulation}
        .tln-math:hover{background:#1a2a4a;color:#60a5fa}
        .tln-shp{background:#1a2a1a;border:1px solid #22c55e;border-radius:6px;color:#4ade80;height:32px;padding:0 8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.85rem;transition:all .15s;touch-action:manipulation}
        .tln-shp:hover{background:#1a3a2a}
        .tln-shp.on{background:#15803d;color:#fff;border-color:#15803d}
        .tln-canvas-wrap{position:relative;width:100%;background:#fff}
        .tln-canvas{display:block;width:100%;touch-action:none}
        .tln-canvas.er-c{cursor:cell}
        .tln-canvas.tx-c{cursor:text}
        .tln-canvas.no-c{cursor:not-allowed}
        .tln-lock{position:absolute;inset:0;background:rgba(13,17,23,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:10}
        .tln-lock i{font-size:2rem;color:#8b949e}
        .tln-lock p{font-size:.82rem;color:#8b949e;text-align:center;padding:0 20px;line-height:1.5}
        .tln-lock .tln-lock-btn{background:#0073e6;border:none;border-radius:8px;color:#fff;padding:8px 20px;font-size:.82rem;cursor:pointer;font-family:inherit;margin-top:4px;display:none}
        .tln-status{background:#0d1117;border-top:1px solid #30363d;padding:5px 14px;display:flex;align-items:center;gap:14px;font-size:.68rem;color:#8b949e;flex-wrap:wrap}
        @media(max-width:600px){
          .tln-wb-toolbar{padding:6px 8px;gap:4px}
          .tln-wb-grp{padding-right:7px;gap:3px}
          .tln-btn,.tln-sz{height:40px;min-width:40px;font-size:1.05rem}
          .tln-math{height:36px;padding:0 8px;font-size:1.1rem}
          .tln-shp{height:36px;padding:0 8px;font-size:1rem}
          .tln-csw{width:28px;height:28px}
          .tln-wb-lbl{display:none}
          .tln-wb-grp{flex-wrap:wrap;max-width:100%}
        }
        @media(max-width:400px){
          .tln-btn,.tln-sz{height:44px;min-width:44px}
          .tln-math{height:40px;padding:0 10px;font-size:1.2rem}
          .tln-shp{height:40px;padding:0 10px}
        }
      `;
      document.head.appendChild(style);
    }

    // Build HTML
    const id = 'tln-wb-' + containerId;
    wrap.innerHTML = `
      <div class="tln-wb" id="${id}">
        <div class="tln-wb-head">
          <div class="tln-wb-title">
            <i class="fas fa-chalkboard"></i>
            <span>Writing Board</span>
            <span style="font-size:.65rem;color:#8b949e;font-weight:400">${role === 'teacher' ? '— Teacher (full access)' : '— Student view'}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            ${role === 'teacher' ? `
            <button class="tln-btn" style="font-size:.7rem;padding:0 10px;background:#1a3a2a;border-color:#22c55e;color:#4ade80" onclick="TLNBoard.allowWrite('${id}')"><i class="fas fa-unlock"></i> Allow Student</button>
            <button class="tln-btn" style="font-size:.7rem;padding:0 10px;background:#3a1a1a;border-color:#e53935;color:#f87171" onclick="TLNBoard.lockWrite('${id}')"><i class="fas fa-lock"></i> Lock</button>
            ` : ''}
            <button class="tln-btn" style="font-size:.7rem;padding:0 10px" onclick="TLNBoard.saveBoard('${id}')"><i class="fas fa-download"></i> Save</button>
          </div>
        </div>

        <div class="tln-wb-toolbar" id="${id}-toolbar">
          <div class="tln-wb-grp">
            <span class="tln-wb-lbl">Tool</span>
            <button class="tln-btn on" id="${id}-tpen"   onclick="TLNBoard._setTool('${id}','pen')"  ><i class="fas fa-pen"></i></button>
            <button class="tln-btn"    id="${id}-terase" onclick="TLNBoard._setTool('${id}','erase')"><i class="fas fa-eraser"></i></button>
            <button class="tln-btn"    id="${id}-ttext"  onclick="TLNBoard._setTool('${id}','text')" ><i class="fas fa-font"></i></button>
          </div>
          <div class="tln-wb-grp">
            <span class="tln-wb-lbl">Size</span>
            <button class="tln-sz on" onclick="TLNBoard._setSize('${id}',2,this)"><span style="width:3px;height:3px;border-radius:50%;background:currentColor;display:block;margin:auto"></span></button>
            <button class="tln-sz"    onclick="TLNBoard._setSize('${id}',5,this)"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:block;margin:auto"></span></button>
            <button class="tln-sz"    onclick="TLNBoard._setSize('${id}',10,this)"><span style="width:10px;height:10px;border-radius:50%;background:currentColor;display:block;margin:auto"></span></button>
            <button class="tln-sz"    onclick="TLNBoard._setSize('${id}',18,this)"><span style="width:16px;height:16px;border-radius:50%;background:currentColor;display:block;margin:auto"></span></button>
            <button class="tln-sz"    onclick="TLNBoard._setSize('${id}',32,this)"><span style="width:22px;height:22px;border-radius:50%;background:currentColor;display:block;margin:auto"></span></button>
          </div>
          <div class="tln-wb-grp">
            <span class="tln-wb-lbl">Color</span>
            <div id="${id}-pal" style="display:flex;gap:3px;flex-wrap:wrap;max-width:160px"></div>
          </div>
          <div class="tln-wb-grp">
            <span class="tln-wb-lbl">Shape</span>
            <button class="tln-shp on" id="${id}-sfree"  onclick="TLNBoard._setShape('${id}','')">✏</button>
            <button class="tln-shp"    id="${id}-sline"  onclick="TLNBoard._setShape('${id}','line')">⟋</button>
            <button class="tln-shp"    id="${id}-srect"  onclick="TLNBoard._setShape('${id}','rect')">▭</button>
            <button class="tln-shp"    id="${id}-scirc"  onclick="TLNBoard._setShape('${id}','circ')">○</button>
            <button class="tln-shp"    id="${id}-sarrow" onclick="TLNBoard._setShape('${id}','arrow')">→</button>
          </div>
          <div class="tln-wb-grp" style="flex-wrap:wrap;max-width:260px">
            <span class="tln-wb-lbl">Math</span>
            ${MATH_SYMBOLS.flat().map(s => `<button class="tln-math" onclick="TLNBoard._sym('${id}','${s}')">${s}</button>`).join('')}
          </div>
          <div class="tln-wb-grp">
            <span class="tln-wb-lbl">Edit</span>
            <button class="tln-btn" onclick="TLNBoard._undo('${id}')"  title="Undo"><i class="fas fa-undo"></i></button>
            <button class="tln-btn" onclick="TLNBoard._redo('${id}')"  title="Redo"><i class="fas fa-redo"></i></button>
            <button class="tln-btn" onclick="TLNBoard._clear('${id}')" title="Clear"><i class="fas fa-trash"></i></button>
            <button class="tln-btn" id="${id}-bgbtn" onclick="TLNBoard._toggleBg('${id}')" title="Toggle BG">◻</button>
          </div>
        </div>

        <div class="tln-canvas-wrap" id="${id}-cwrap">
          <canvas class="tln-canvas" id="${id}-canvas"></canvas>
          <div class="tln-lock" id="${id}-lock" ${role === 'teacher' ? 'style="display:none"' : ''}>
            <i class="fas fa-lock"></i>
            <p>Board is locked.<br>Your teacher will enable writing when ready.</p>
            ${role === 'teacher' ? `<button class="tln-lock-btn" onclick="TLNBoard.allowWrite('${id}')">Enable Writing</button>` : ''}
          </div>
        </div>

        <div class="tln-status">
          <span>🖊 <span id="${id}-toollbl">Pen</span></span>
          <span id="${id}-coords" style="font-family:monospace">x:0 y:0</span>
          <span>⬤ <span id="${id}-clrlbl" style="color:#000">Black</span></span>
          <span id="${id}-writelbl">${role === 'teacher' ? '<span style="color:#60a5fa">👨‍🏫 Full access</span>' : '<span style="color:#8b949e">🔒 View only</span>'}</span>
        </div>
      </div>`;

    // Build state object
    const state = {
      role, userName,
      tool: 'pen', color: '#000000', size: 2, shape: '', bgWhite: true,
      down: false, sx: 0, sy: 0, snapshot: null,
      undoStack: [], redoStack: [],
      symMode: false, pendingSym: '',
      canWrite: role === 'teacher',
      txtBox: null
    };
    TLNBoard._states[id] = state;

    // Color palette
    const pal = document.getElementById(id + '-pal');
    COLORS.forEach(c => {
      const sw = document.createElement('div');
      sw.className = 'tln-csw' + (c === state.color ? ' on' : '');
      sw.style.background = c;
      sw.style.border = c === '#ffffff' ? '2px solid #30363d' : '2px solid transparent';
      sw.onclick = () => {
        state.color = c;
        pal.querySelectorAll('.tln-csw').forEach(x => x.classList.remove('on'));
        sw.classList.add('on');
        const lbl = document.getElementById(id + '-clrlbl');
        if (lbl) { lbl.style.color = c === '#ffffff' ? '#aaa' : c; lbl.textContent = '●'; }
        if (state.tool === 'erase') TLNBoard._setTool(id, 'pen');
      };
      pal.appendChild(sw);
    });

    // Canvas setup
    const canvas = document.getElementById(id + '-canvas');
    const ctx    = canvas.getContext('2d');
    state.ctx    = ctx;
    state.canvas = canvas;

    function resize() {
      const dpr  = window.devicePixelRatio || 1;
      const cwrap = document.getElementById(id + '-cwrap');
      const w = cwrap.offsetWidth;
      const isMobile = window.innerWidth < 600;
      const h = isMobile
        ? Math.max(300, Math.min(500, window.innerHeight * 0.5))
        : Math.max(280, Math.min(520, window.innerHeight * 0.42));
      const saved = canvas.width && canvas.height ? ctx.getImageData(0,0,canvas.width,canvas.height) : null;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
      if (saved) ctx.putImageData(saved, 0, 0);
      _fillBg(id);
    }
    state.resize = resize;
    window.addEventListener('resize', () => { clearTimeout(state._rt); state._rt = setTimeout(resize, 200); });

    // Pointer events
    function getPos(e) {
      const r   = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const sx2 = canvas.width / (dpr * r.width);
      const sy2 = canvas.height / (dpr * r.height);
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - r.left) * sx2, y: (src.clientY - r.top) * sy2 };
    }

    canvas.addEventListener('mousedown',  e => _down(id, getPos(e)), { passive: false });
    canvas.addEventListener('mousemove',  e => { _move(id, getPos(e)); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('mouseup',    e => _up(id, getPos(e)));
    canvas.addEventListener('mouseleave', e => _up(id, getPos(e)));
    canvas.addEventListener('touchstart', e => { _down(id, getPos(e)); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { _move(id, getPos(e)); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend',   e => _up(id, getPos(e)));

    setTimeout(resize, 50);
  }

  // ── State store ────────────────────────────────────────────────────────────
  const _states = {};

  function _fillBg(id) {
    const s = _states[id]; if (!s) return;
    if (s.bgWhite) { s.ctx.fillStyle = '#ffffff'; s.ctx.fillRect(0, 0, s.canvas.width, s.canvas.height); }
  }

  function _applyPen(id) {
    const s = _states[id]; if (!s) return;
    s.ctx.strokeStyle = s.tool === 'erase' ? (s.bgWhite ? '#ffffff' : '#0d1117') : s.color;
    s.ctx.lineWidth   = s.tool === 'erase' ? s.size * 4 : s.size;
    s.ctx.lineCap = 'round'; s.ctx.lineJoin = 'round';
  }

  function _saveState(id) {
    const s = _states[id]; if (!s) return;
    s.undoStack.push(s.ctx.getImageData(0, 0, s.canvas.width, s.canvas.height));
    if (s.undoStack.length > 40) s.undoStack.shift();
    s.redoStack = [];
  }

  function _drawShape(id, x1, y1, x2, y2) {
    const s = _states[id]; if (!s) return;
    const ctx = s.ctx;
    ctx.beginPath(); _applyPen(id);
    if (s.shape === 'line')  { ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    else if (s.shape === 'rect')  { ctx.strokeRect(x1,y1,x2-x1,y2-y1); }
    else if (s.shape === 'circ')  { ctx.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,Math.PI*2); ctx.stroke(); }
    else if (s.shape === 'arrow') {
      const ang = Math.atan2(y2-y1, x2-x1), hl = 16;
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2,y2);
      ctx.lineTo(x2-hl*Math.cos(ang-0.4), y2-hl*Math.sin(ang-0.4));
      ctx.lineTo(x2-hl*Math.cos(ang+0.4), y2-hl*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
    }
  }

  function _down(id, pos) {
    const s = _states[id]; if (!s || !s.canWrite) return;
    if (s.tool === 'text' || s.symMode) {
      if (s.symMode) {
        _saveState(id);
        s.ctx.fillStyle = s.color;
        s.ctx.font = (s.size * 7 + 12) + 'px Times New Roman, serif';
        s.ctx.fillText(s.pendingSym, pos.x, pos.y + 14);
        s.symMode = false; s.pendingSym = '';
        const lbl = document.getElementById(id + '-toollbl');
        if (lbl) lbl.textContent = 'Text';
      } else {
        _spawnText(id, pos.x, pos.y);
      }
      return;
    }
    s.down = true; s.sx = pos.x; s.sy = pos.y;
    if (s.shape) { s.snapshot = s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height); }
    else { _saveState(id); _applyPen(id); s.ctx.beginPath(); s.ctx.moveTo(pos.x, pos.y); }
  }

  function _move(id, pos) {
    const coords = document.getElementById(id + '-coords');
    if (coords) coords.textContent = 'x:' + Math.round(pos.x) + ' y:' + Math.round(pos.y);
    const s = _states[id]; if (!s || !s.down || !s.canWrite) return;
    if (s.shape && s.snapshot) {
      s.ctx.putImageData(s.snapshot, 0, 0);
      _drawShape(id, s.sx, s.sy, pos.x, pos.y);
    } else {
      _applyPen(id); s.ctx.lineTo(pos.x, pos.y); s.ctx.stroke();
      s.ctx.beginPath(); s.ctx.moveTo(pos.x, pos.y);
    }
  }

  function _up(id, pos) {
    const s = _states[id]; if (!s || !s.down) return;
    s.down = false;
    if (s.shape && s.snapshot) {
      _saveState(id); s.ctx.putImageData(s.snapshot, 0, 0);
      _drawShape(id, s.sx, s.sy, pos.x, pos.y); s.snapshot = null;
    }
    s.ctx.beginPath();
  }

  function _spawnText(id, x, y) {
    const s = _states[id]; if (!s) return;
    if (s.txtBox) { s.txtBox.remove(); s.txtBox = null; }
    const r = s.canvas.getBoundingClientRect();
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.style.cssText = 'position:fixed;left:'+(r.left+x)+'px;top:'+(r.top+y-10)+'px;background:rgba(255,255,255,.95);border:2px solid #0073e6;border-radius:4px;padding:4px 8px;font-size:'+(s.size*5+12)+'px;color:#000;z-index:9999;outline:none;min-width:120px;font-family:Poppins,sans-serif;max-width:280px;';
    document.body.appendChild(inp);
    s.txtBox = inp;
    inp.focus();
    const commit = () => {
      if (!s.txtBox) return;
      const t = inp.value.trim();
      if (t) { _saveState(id); s.ctx.fillStyle = s.color; s.ctx.font = (s.size*5+14) + 'px Poppins,sans-serif'; s.ctx.fillText(t, x, y+14); }
      inp.remove(); s.txtBox = null;
    };
    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { inp.remove(); s.txtBox = null; } });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function _setTool(id, t) {
    const s = _states[id]; if (!s) return;
    s.tool = t;
    ['pen','erase','text'].forEach(n => {
      const el = document.getElementById(id + '-t' + n);
      if (el) { el.classList.toggle('on', n === t); el.classList.toggle('er', n === 'erase' && t === 'erase'); }
    });
    const lbl = document.getElementById(id + '-toollbl');
    if (lbl) lbl.textContent = {pen:'Pen',erase:'Eraser',text:'Text'}[t] || t;
    s.canvas.className = 'tln-canvas' + (t === 'erase' ? ' er-c' : t === 'text' ? ' tx-c' : '') + (!s.canWrite ? ' no-c' : '');
  }

  function _setSize(id, sz, btn) {
    const s = _states[id]; if (!s) return;
    s.size = sz;
    const grp = btn.closest('.tln-wb-grp');
    if (grp) grp.querySelectorAll('.tln-sz').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  }

  function _setShape(id, sh) {
    const s = _states[id]; if (!s) return;
    s.shape = sh;
    ['free','line','rect','circ','arrow'].forEach(n => {
      const el = document.getElementById(id + '-s' + n);
      if (el) el.classList.toggle('on', sh === (n === 'free' ? '' : n));
    });
  }

  function _sym(id, symbol) {
    const s = _states[id]; if (!s || !s.canWrite) return;
    s.pendingSym = symbol; s.symMode = true;
    _setTool(id, 'text');
    const lbl = document.getElementById(id + '-toollbl');
    if (lbl) lbl.textContent = 'Click to place: ' + symbol;
  }

  function _undo(id) {
    const s = _states[id]; if (!s || !s.undoStack.length) return;
    s.redoStack.push(s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height));
    s.ctx.putImageData(s.undoStack.pop(), 0, 0);
  }

  function _redo(id) {
    const s = _states[id]; if (!s || !s.redoStack.length) return;
    s.undoStack.push(s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height));
    s.ctx.putImageData(s.redoStack.pop(), 0, 0);
  }

  function _clear(id) {
    const s = _states[id]; if (!s) return;
    if (!s.canWrite) return;
    _saveState(id);
    s.ctx.clearRect(0,0,s.canvas.width,s.canvas.height);
    _fillBg(id);
  }

  function _toggleBg(id) {
    const s = _states[id]; if (!s) return;
    s.bgWhite = !s.bgWhite;
    const btn = document.getElementById(id + '-bgbtn');
    if (btn) btn.textContent = s.bgWhite ? '◻' : '◼';
    _fillBg(id);
  }

  function allowWrite(id) {
    const s = _states[id]; if (!s) return;
    s.canWrite = true;
    const lock = document.getElementById(id + '-lock');
    const lbl  = document.getElementById(id + '-writelbl');
    if (lock) lock.style.display = 'none';
    if (lbl)  lbl.innerHTML = '<span style="color:#4ade80">✏️ Writing enabled</span>';
    s.canvas.className = 'tln-canvas';
  }

  function lockWrite(id) {
    const s = _states[id]; if (!s || s.role === 'teacher') return;
    s.canWrite = false;
    const lock = document.getElementById(id + '-lock');
    const lbl  = document.getElementById(id + '-writelbl');
    if (lock) lock.style.display = 'flex';
    if (lbl)  lbl.innerHTML = '<span style="color:#8b949e">🔒 View only</span>';
    s.canvas.className = 'tln-canvas no-c';
  }

  function saveBoard(id) {
    const s = _states[id]; if (!s) return;
    const a = document.createElement('a');
    a.download = 'board-' + id + '-' + Date.now() + '.png';
    a.href = s.canvas.toDataURL('image/png');
    a.click();
  }

  return { init, allowWrite, lockWrite, saveBoard, _states, _setTool, _setSize, _setShape, _sym, _undo, _redo, _clear, _toggleBg };
})();
