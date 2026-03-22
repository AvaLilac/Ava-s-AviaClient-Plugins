(function () {

    if (window.__AVIA_DEVTOOLS__) return;
    window.__AVIA_DEVTOOLS__ = true;

    const _logs = [];
    const MAX_LOGS = 2000;

    const LEVELS = {
        log:    { color: 'rgba(255,255,255,0.88)' },
        info:   { color: '#58b4ff' },
        warn:   { color: '#ffd166' },
        error:  { color: '#ff6b6b' },
        debug:  { color: '#a3a3a3' },
        result: { color: '#b5e7a0' },
        input:  { color: '#9ecbff' },
    };

    function buildTree(val, depth, seen) {
        seen  = seen  || new Set();
        depth = depth === undefined ? 0 : depth;
        const MAX_DEPTH = 5, MAX_PROPS = 60, MAX_ITEMS = 100;

        if (val === null)      return { text: 'null',      color: '#9e9e9e' };
        if (val === undefined) return { text: 'undefined', color: '#9e9e9e' };
        if (typeof val === 'boolean') return { text: String(val), color: '#b388ff' };
        if (typeof val === 'number')  return { text: String(val), color: '#b5e7a0' };
        if (typeof val === 'bigint')  return { text: val + 'n',   color: '#b5e7a0' };
        if (typeof val === 'symbol')  return { text: val.toString(), color: '#ff9800' };
        if (typeof val === 'string')
            return { text: depth === 0 ? val : JSON.stringify(val), color: '#f28b82' };
        if (typeof val === 'function') {
            const s = val.toString().replace(/\s+/g, ' ').slice(0, 80);
            return { text: s + (s.length >= 80 ? '…' : ''), color: '#aaa' };
        }

        if (seen.has(val)) return { text: '[Circular]', color: '#aaa' };
        seen.add(val);

        if (typeof Node !== 'undefined' && val instanceof Node) {
            if (val.nodeType === Node.TEXT_NODE)
                return { text: `#text "${(val.textContent || '').slice(0, 40)}"`, color: '#aaa' };
            if (val.nodeType === Node.ELEMENT_NODE) {
                const tag   = val.tagName.toLowerCase();
                const attrs = [...(val.attributes || [])].map(a => ` ${a.name}="${a.value}"`).join('').slice(0, 80);
                const preview = `<${tag}${attrs}>`;
                if (depth >= MAX_DEPTH) return { text: preview, color: '#80cbc4' };
                const children = [...val.childNodes].slice(0, MAX_ITEMS)
                    .map(c => ({ key: null, value: buildTree(c, depth + 1, seen) }));
                return { kind: 'node', text: preview, children };
            }
            return { text: `[${val.constructor?.name ?? 'Node'}]`, color: '#80cbc4' };
        }

        if (val instanceof Error)
            return { text: val.stack ?? `${val.name}: ${val.message}`, color: '#ff6b6b' };

        if (val instanceof Promise)
            return { text: 'Promise {<pending>}', color: '#aaa' };

        if (Array.isArray(val)) {
            const preview = `Array(${val.length})`;
            if (depth >= MAX_DEPTH) return { text: preview, color: '#aaa' };
            const children = val.slice(0, MAX_ITEMS)
                .map((v, i) => ({ key: String(i), value: buildTree(v, depth + 1, seen) }));
            if (val.length > MAX_ITEMS)
                children.push({ key: null, value: { text: `… ${val.length - MAX_ITEMS} more`, color: '#777' } });
            return { kind: 'array', text: preview, children };
        }

        const name = val.constructor?.name && val.constructor.name !== 'Object' ? val.constructor.name : '';
        let keys;
        try { keys = Object.keys(val).slice(0, MAX_PROPS); } catch { keys = []; }
        const preview = (name ? name + ' ' : '') + '{' +
            keys.slice(0, 3).map(k => `${k}: …`).join(', ') + (keys.length > 3 ? ', …' : '') + '}';
        if (depth >= MAX_DEPTH) return { text: preview, color: '#aaa' };
        const children = keys.map(k => ({ key: k, value: buildTree(val[k], depth + 1, seen) }));
        if (Object.keys(val).length > MAX_PROPS)
            children.push({ key: null, value: { text: `… ${Object.keys(val).length - MAX_PROPS} more`, color: '#777' } });
        return { kind: 'object', text: preview, name, children };
    }

    function pushLog(level, args) {
        _logs.push({
            level,
            trees: [...args].map(a => buildTree(a)),
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        });
        if (_logs.length > MAX_LOGS) _logs.shift();
        flushOutput();
    }

    function pushRaw(level, text, color) {
        _logs.push({
            level,
            raw: text,
            rawColor: color || LEVELS[level]?.color || '#fff',
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        });
        if (_logs.length > MAX_LOGS) _logs.shift();
        flushOutput();
    }

    const _orig = {};
    ['log', 'info', 'warn', 'error', 'debug'].forEach(m => {
        _orig[m] = console[m].bind(console);
        console[m] = function (...a) { _orig[m](...a); pushLog(m, a); };
    });

    const _origTable = console.table.bind(console);
    console.table = function (data, cols) {
        _origTable(data, cols);
        try {
            const rows  = Array.isArray(data) ? data : Object.entries(data).map(([k, v]) => ({ '(index)': k, ...(typeof v === 'object' ? v : { Value: v }) }));
            const keys  = cols || Object.keys(rows[0] || {});
            const colW  = {};
            ['(index)', ...keys].forEach(k => { colW[k] = k.length; });
            rows.forEach((r, i) => {
                colW['(index)'] = Math.max(colW['(index)'], String(i).length);
                keys.forEach(k => { colW[k] = Math.max(colW[k] || k.length, String(r[k] ?? '').length); });
            });
            const pad = (s, w) => String(s).padEnd(w);
            const header = ['(index)', ...keys].map(k => pad(k, colW[k])).join('  │  ');
            const sep    = ['(index)', ...keys].map(k => '─'.repeat(colW[k])).join('──┼──');
            const body   = rows.map((r, i) => [pad(i, colW['(index)']), ...keys.map(k => pad(r[k] ?? '', colW[k]))].join('  │  ')).join('\n');
            pushRaw('log', header + '\n' + sep + '\n' + body, '#fff');
        } catch { pushLog('log', [data]); }
    };

    const _origDir = console.dir.bind(console);
    console.dir = function (val) { _origDir(val); pushLog('log', [val]); };

    let _groupDepth = 0;
    console.group = console.groupCollapsed = function (label = '') {
        pushRaw('log', '  '.repeat(_groupDepth) + '▶ ' + label, '#ffd166');
        _groupDepth++;
    };
    console.groupEnd = function () { if (_groupDepth > 0) _groupDepth--; };

    const _timers = {};
    console.time    = (l = 'default') => { _timers[l] = performance.now(); };
    console.timeEnd = (l = 'default') => {
        const ms = _timers[l] != null ? (performance.now() - _timers[l]).toFixed(3) : '?';
        pushRaw('log', `${l}: ${ms}ms`, '#ffd166');
        delete _timers[l];
    };
    console.timeLog = (l = 'default') => {
        const ms = _timers[l] != null ? (performance.now() - _timers[l]).toFixed(3) : '?';
        pushRaw('log', `${l}: ${ms}ms`, '#ffd166');
    };

    const _counts = {};
    console.count      = (l = 'default') => { _counts[l] = (_counts[l] || 0) + 1; pushRaw('log', `${l}: ${_counts[l]}`, '#fff'); };
    console.countReset = (l = 'default') => { _counts[l] = 0; };

    const _origAssert = console.assert.bind(console);
    console.assert = function (cond, ...args) {
        _origAssert(cond, ...args);
        if (!cond) pushRaw('error', 'Assertion failed: ' + (args.map(String).join(' ') || ''), '#ff6b6b');
    };

    console.clear = function () { _logs.length = 0; flushOutput(); };

    const _origTrace = console.trace.bind(console);
    console.trace = function (...args) {
        _origTrace(...args);
        const stack = new Error().stack || '';
        pushRaw('log', (args.map(String).join(' ') || 'console.trace') + '\n' + stack, '#aaa');
    };

    window.addEventListener('error', e => {
        pushRaw('error', `Uncaught ${e.message}\n    at ${e.filename}:${e.lineno}:${e.colno}`, '#ff6b6b');
    });
    window.addEventListener('unhandledrejection', e => {
        const msg = e.reason instanceof Error ? (e.reason.stack ?? e.reason.message) : String(e.reason);
        pushRaw('error', `Uncaught (in promise) ${msg}`, '#ff6b6b');
    });

    if (!window.$)  window.$  = (sel, ctx) => (ctx || document).querySelector(sel);
    if (!window.$$) window.$$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

    window.copy = function (val) {
        const text = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
        navigator.clipboard?.writeText(text)
            .then(() => pushRaw('log', 'Copied to clipboard.', '#4dff88'))
            .catch(() => pushRaw('error', 'Copy failed — clipboard permission denied.', '#ff6b6b'));
    };

    window.keys   = o => Object.keys(o);
    window.values = o => Object.values(o);

    const _history = [];
    let   _histIdx  = -1;

    const _scope = Object.create(null);
    const _GlobalFunction = window.Function;

    const _proxyScope = new Proxy(_scope, {
        has()        { return true; },
        get(t, k)    { return k in t ? t[k] : window[k]; },
        set(t, k, v) { t[k] = v; return true; },
    });

    async function runCode(code) {
        if (!code.trim()) return;
        _history.unshift(code);
        _histIdx = -1;
        pushRaw('input', '> ' + code, LEVELS.input.color);

        try {
            const fn = _GlobalFunction('__scope__',
                'return (async function(){ with(__scope__){ return (' + code + '); } })();'
            );
            const result = await fn(_proxyScope);
            window.$_ = result;
            if (result !== undefined) pushLog('result', [result]);
            return;
        } catch (exprErr) {
            if (!(exprErr instanceof SyntaxError)) {
                pushLog('error', [exprErr instanceof Error ? exprErr : new Error(String(exprErr))]);
                return;
            }
        }

        try {
            const fn = _GlobalFunction('__scope__',
                'return (async function(){ with(__scope__){ ' + code + ' } })();'
            );
            await fn(_proxyScope);
        } catch (e) {
            pushLog('error', [e instanceof Error ? e : new Error(String(e))]);
        }
    }

    let outputEl  = null;
    let autoScroll = true;

    function renderTree(node) {
        const wrap = document.createElement('span');

        if (!node.children || node.children.length === 0) {
            wrap.style.color = node.color || '#fff';
            wrap.style.whiteSpace = 'pre-wrap';
            wrap.style.wordBreak = 'break-all';
            wrap.textContent = node.text;
            return wrap;
        }

        const toggle = document.createElement('span');
        toggle.textContent = '▶ ';
        toggle.style.cssText = 'cursor:pointer;user-select:none;color:rgba(255,255,255,0.35);font-size:10px;';

        const label = document.createElement('span');
        label.textContent = node.text;
        label.style.cssText = `color:${node.kind === 'node' ? '#80cbc4' : '#aaa'};cursor:pointer;`;

        const childWrap = document.createElement('div');
        childWrap.style.cssText = 'display:none;padding-left:14px;border-left:1px solid rgba(255,255,255,0.07);margin-left:3px;';

        let expanded = false;
        const open = () => {
            if (!expanded) {
                expanded = true;
                node.children.forEach(({ key, value }) => {
                    const row = document.createElement('div');
                    row.style.padding = '1px 0';
                    if (key !== null) {
                        const k = document.createElement('span');
                        k.textContent = key + ': ';
                        k.style.color = '#9ecbff';
                        row.appendChild(k);
                    }
                    row.appendChild(renderTree(value));
                    childWrap.appendChild(row);
                });
            }
            childWrap.style.display = 'block';
            toggle.textContent = '▼ ';
        };

        toggle.onclick = label.onclick = () => {
            if (childWrap.style.display === 'none') open();
            else { childWrap.style.display = 'none'; toggle.textContent = '▶ '; }
        };

        wrap.appendChild(toggle);
        wrap.appendChild(label);
        wrap.appendChild(childWrap);
        return wrap;
    }

    function flushOutput() {
        if (!outputEl) return;
        outputEl.innerHTML = '';

        _logs.forEach(entry => {
            const line = document.createElement('div');
            Object.assign(line.style, {
                display: 'flex',
                gap: '8px',
                padding: '3px 0',
                fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                alignItems: 'flex-start',
            });

            const time = document.createElement('span');
            time.textContent = entry.time;
            time.style.cssText = 'color:rgba(255,255,255,0.22);flex-shrink:0;font-size:10px;padding-top:2px;min-width:65px;';

            const badge = document.createElement('span');
            badge.textContent = entry.level;
            badge.style.cssText = `color:${LEVELS[entry.level]?.color ?? '#fff'};flex-shrink:0;width:38px;font-size:10px;padding-top:2px;`;

            const body = document.createElement('span');
            body.style.cssText = 'flex:1;min-width:0;';

            if (entry.raw !== undefined) {
                body.style.color = entry.rawColor;
                body.style.whiteSpace = 'pre-wrap';
                body.style.wordBreak = 'break-all';
                body.textContent = entry.raw;
            } else if (entry.trees) {
                entry.trees.forEach((tree, i) => {
                    if (i > 0) body.appendChild(document.createTextNode(' '));
                    const el = renderTree(tree);
                    if (!el.style.color) el.style.color = LEVELS[entry.level]?.color || '#fff';
                    body.appendChild(el);
                });
            }

            line.appendChild(time);
            line.appendChild(badge);
            line.appendChild(body);
            outputEl.appendChild(line);
        });

        if (autoScroll) outputEl.scrollTop = outputEl.scrollHeight;
    }

    let _inputEl = null;

    function toggleDevtoolsPanel() {
        let panel = document.getElementById('avia-devtools-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            if (panel.style.display === 'flex') setTimeout(() => _inputEl?.focus(), 50);
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-devtools-panel';
        Object.assign(panel.style, {
            position: 'fixed', bottom: '24px', right: '24px',
            width: '700px', height: '520px',
            background: '#111', color: '#fff',
            borderRadius: '14px', boxShadow: '0 14px 48px rgba(0,0,0,0.65)',
            zIndex: '999998', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '10px 14px', fontWeight: '600', fontSize: '12px',
            fontFamily: '"JetBrains Mono",monospace',
            background: '#191919', borderBottom: '1px solid rgba(255,255,255,0.07)',
            cursor: 'move', userSelect: 'none',
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0',
        });
        const dot = document.createElement('span');
        dot.textContent = '⬤';
        dot.style.cssText = 'color:#4dff88;font-size:8px;';
        const titleEl = document.createElement('span');
        titleEl.textContent = '(Avia) Devtools — Console';
        titleEl.style.color = 'rgba(255,255,255,0.65)';
        const hint = document.createElement('span');
        hint.textContent = 'Shift+Enter = newline';
        hint.style.cssText = 'color:rgba(255,255,255,0.18);font-size:10px;margin-left:auto;padding-right:30px;';
        header.append(dot, titleEl, hint);

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute;top:10px;right:14px;cursor:pointer;opacity:0.45;font-size:12px;';
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.45';
        closeBtn.onclick = () => panel.style.display = 'none';

        const toolbar = document.createElement('div');
        Object.assign(toolbar.style, {
            padding: '5px 10px', display: 'flex', gap: '6px', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: '#161616', flexShrink: '0',
        });

        function toolBtn(label, tip, cb) {
            const b = document.createElement('button');
            b.textContent = label; b.title = tip;
            Object.assign(b.style, {
                padding: '2px 9px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px',
                color: 'rgba(255,255,255,0.55)', fontSize: '10.5px',
                fontFamily: '"JetBrains Mono",monospace', cursor: 'pointer',
            });
            b.onmouseenter = () => b.style.background = 'rgba(255,255,255,0.12)';
            b.onmouseleave = () => b.style.background = 'rgba(255,255,255,0.06)';
            b.onclick = cb;
            return b;
        }

        toolbar.appendChild(toolBtn('🗑 Clear', 'Clear (or console.clear())', () => { _logs.length = 0; flushOutput(); }));

        const asBtn = toolBtn('⬇ Auto-scroll', 'Toggle auto-scroll', () => {
            autoScroll = !autoScroll;
            asBtn.style.color = autoScroll ? '#4dff88' : 'rgba(255,255,255,0.35)';
        });
        asBtn.style.color = '#4dff88';
        toolbar.appendChild(asBtn);

        toolbar.appendChild(toolBtn('? Help', 'Show available helpers', () => {
            pushRaw('info', [
                'Available DevTools helpers:',
                '  $(sel)         → document.querySelector',
                '  $$(sel)        → document.querySelectorAll → Array',
                '  $_             → last evaluated value',
                '  copy(val)      → copy to clipboard',
                '  keys(obj)      → Object.keys',
                '  values(obj)    → Object.values',
                '  console.table(data)',
                '  console.time(label) / timeEnd(label)',
                '  console.count(label)',
                '  console.group(label) / groupEnd()',
                '  console.assert(cond, msg)',
                '  console.trace()',
                '  console.clear()',
                '  Shift+Enter    → newline in input',
                '  ↑ / ↓          → command history',
            ].join('\n'), '#58b4ff');
        }));

        outputEl = document.createElement('div');
        outputEl.id = 'avia-devtools-output';
        Object.assign(outputEl.style, {
            flex: '1', overflowY: 'auto', padding: '8px 12px', background: '#0c0c0c',
        });

        const styleTag = document.createElement('style');
        styleTag.textContent = `
            #avia-devtools-output::-webkit-scrollbar{width:5px}
            #avia-devtools-output::-webkit-scrollbar-track{background:transparent}
            #avia-devtools-output::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
            #avia-devtools-input{caret-color:#4dff88;resize:none}
            #avia-devtools-input::placeholder{color:rgba(255,255,255,0.16)}
            #avia-devtools-input::-webkit-scrollbar{width:3px}
            #avia-devtools-input::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        `;
        document.head.appendChild(styleTag);

        const inputRow = document.createElement('div');
        Object.assign(inputRow.style, {
            display: 'flex', alignItems: 'flex-end', gap: '8px',
            padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.07)',
            background: '#111', flexShrink: '0',
        });

        const promptEl = document.createElement('span');
        promptEl.textContent = '›';
        promptEl.style.cssText = 'color:#4dff88;font-size:20px;font-family:monospace;line-height:1;flex-shrink:0;padding-bottom:5px;';

        const inputEl = document.createElement('textarea');
        _inputEl = inputEl;
        inputEl.id = 'avia-devtools-input';
        inputEl.placeholder = 'Enter JavaScript…';
        inputEl.rows = 1;
        inputEl.autocomplete = 'off';
        inputEl.spellcheck = false;
        Object.assign(inputEl.style, {
            flex: '1', background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontFamily: '"JetBrains Mono","Fira Code",monospace',
            fontSize: '12.5px', lineHeight: '1.6', overflowY: 'auto', maxHeight: '120px', padding: '0',
        });

        function resizeInput() {
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
        }
        inputEl.addEventListener('input', resizeInput);

        inputEl.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const code = inputEl.value;
                inputEl.value = ''; resizeInput();
                runCode(code);
            } else if (e.key === 'ArrowUp' && !e.shiftKey && inputEl.selectionStart === 0) {
                e.preventDefault();
                if (_histIdx < _history.length - 1) _histIdx++;
                inputEl.value = _history[_histIdx] ?? ''; resizeInput();
            } else if (e.key === 'ArrowDown' && !e.shiftKey) {
                e.preventDefault();
                if (_histIdx > 0) _histIdx--;
                else { _histIdx = -1; inputEl.value = ''; resizeInput(); return; }
                inputEl.value = _history[_histIdx] ?? ''; resizeInput();
            }
        });

        const runBtn = document.createElement('button');
        runBtn.textContent = 'Run';
        Object.assign(runBtn.style, {
            padding: '5px 16px', background: '#4dff88', border: 'none', borderRadius: '7px',
            color: '#000', fontWeight: '700', fontSize: '11.5px',
            fontFamily: '"JetBrains Mono",monospace', cursor: 'pointer', flexShrink: '0', marginBottom: '2px',
        });
        runBtn.onmouseenter = () => runBtn.style.background = '#6fffaa';
        runBtn.onmouseleave = () => runBtn.style.background = '#4dff88';
        runBtn.onclick = () => { const c = inputEl.value; inputEl.value = ''; resizeInput(); runCode(c); };

        inputRow.append(promptEl, inputEl, runBtn);
        panel.append(header, closeBtn, toolbar, outputEl, inputRow);
        document.body.appendChild(panel);

        enableDrag(panel, header);
        flushOutput();
        setTimeout(() => inputEl.focus(), 50);
    }

    function enableDrag(panel, header) {
        let dragging = false, ox, oy;
        header.addEventListener('mousedown', e => { dragging = true; ox = e.clientX - panel.offsetLeft; oy = e.clientY - panel.offsetTop; });
        document.addEventListener('mouseup', () => dragging = false);
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - ox) + 'px';
            panel.style.top  = (e.clientY - oy) + 'px';
            panel.style.right = panel.style.bottom = 'auto';
        });
    }

    function injectButtons() {
        if (document.getElementById('stoat-fake-devtools')) return;
        const appearanceBtn = [...document.querySelectorAll('a')]
            .find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;
        const referenceNode = document.getElementById('stoat-fake-plugins');
        if (!referenceNode) return;

        const devtoolsBtn = appearanceBtn.cloneNode(true);
        devtoolsBtn.id = 'stoat-fake-devtools';
        const textNode = [...devtoolsBtn.querySelectorAll('div')]
            .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
        if (textNode) textNode.textContent = '(Avia) Devtools';
        if (typeof setIcon === 'function') setIcon(devtoolsBtn, 'terminal');
        devtoolsBtn.addEventListener('click', toggleDevtoolsPanel);
        referenceNode.parentElement.insertBefore(devtoolsBtn, referenceNode.nextSibling);
    }

    function waitForBody(cb) {
        if (document.body) cb();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); cb(); }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        new MutationObserver(() => injectButtons()).observe(document.body, { childList: true, subtree: true });
        injectButtons();
    });

    console.info('(Avia) Devtools loaded. Click ? Help for available helpers.');

})();
