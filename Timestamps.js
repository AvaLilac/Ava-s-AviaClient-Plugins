(function () {

if (window.__AVIA_TIMESTAMPS__) return;
window.__AVIA_TIMESTAMPS__ = true;

const STORAGE_RECENT = "avia_timestamps_recent";
const MAX_RECENT = 8;

let RECENT = [];
try {
    RECENT = JSON.parse(localStorage.getItem(STORAGE_RECENT) || "[]");
    if (!Array.isArray(RECENT)) RECENT = [];
} catch { RECENT = []; }

const PRESETS = [
    { label: "Relative",        flag: "R", preview: d => relativePreview(d) },
    { label: "Short time",      flag: "t", preview: d => fmtTime(d) },
    { label: "Long time",       flag: "T", preview: d => fmtTimeSec(d) },
    { label: "Short date",      flag: "d", preview: d => fmtShortDate(d) },
    { label: "Long date",       flag: "D", preview: d => fmtLongDate(d) },
    { label: "Short date/time", flag: "f", preview: d => fmtLongDate(d) + " " + fmtTime(d) },
    { label: "Long date/time",  flag: "F", preview: d => fmtWeekday(d) + ", " + fmtLongDate(d) + " " + fmtTime(d) },
];

function pad(n) { return String(n).padStart(2, "0"); }

let STOAT_TIME_FORMAT = "HH:mm";
let STOAT_DATE_FORMAT = "MM/DD/YYYY";

(function loadStoatLocale() {
    try {
        const req = window.indexedDB.open("localforage");
        req.onsuccess = e => {
            const db = e.target.result;
            const tx = db.transaction("keyvaluepairs").objectStore("keyvaluepairs").get("locale");
            tx.onsuccess = ev => {
                const result = ev.target.result;
                if (result && result.options) {
                    if (result.options.timeFormat) STOAT_TIME_FORMAT = result.options.timeFormat;
                    if (result.options.dateFormat) STOAT_DATE_FORMAT = result.options.dateFormat;
                }
            };
        };
    } catch {}
})();

function is24h() {
    return STOAT_TIME_FORMAT.startsWith("HH");
}

function fmtTime(d) {
    if (is24h()) {
        return pad(d.getHours()) + ":" + pad(d.getMinutes());
    }
    const h = d.getHours() % 12 || 12;
    const ampm = d.getHours() < 12 ? "AM" : "PM";
    return pad(h) + ":" + pad(d.getMinutes()) + " " + ampm;
}
function fmtTimeSec(d) {
    if (is24h()) {
        return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }
    const h = d.getHours() % 12 || 12;
    const ampm = d.getHours() < 12 ? "AM" : "PM";
    return pad(h) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " " + ampm;
}
function fmtShortDate(d) {
    if (STOAT_DATE_FORMAT.startsWith("MM")) {
        return pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + d.getFullYear();
    }
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
}
function fmtLongDate(d) {
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}
function fmtWeekday(d) {
    const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return DAYS[d.getDay()];
}

function relativePreview(d) {
    const delta = (d - Date.now()) / 1000;
    const abs = Math.abs(delta);
    const dir = delta < 0 ? "ago" : "from now";
    const fmt = (n, u) => Math.round(n) + " " + u + (Math.round(n) !== 1 ? "s" : "") + " " + dir;
    if (abs < 60)       return fmt(abs, "second");
    if (abs < 3600)     return fmt(abs / 60, "minute");
    if (abs < 86400)    return fmt(abs / 3600, "hour");
    if (abs < 2592000)  return fmt(abs / 86400, "day");
    if (abs < 31536000) return fmt(abs / 2592000, "month");
    return fmt(abs / 31536000, "year");
}

function discordTimestamp(d, flag) {
    const unix = Math.floor(d.getTime() / 1000);
    return "<t:" + unix + ":" + flag + ">";
}

function saveRecent(text) {
    RECENT = [text, ...RECENT.filter(r => r !== text)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_RECENT, JSON.stringify(RECENT));
}

function copyText(text, btn) {
    const finish = () => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.background = "rgba(0,200,120,0.3)";
        saveRecent(text);
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.background = "";
        }, 1500);
    };
    navigator.clipboard.writeText(text).then(finish).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        finish();
    });
}

function buildPanel() {

    const panel = document.createElement("div");
    panel.id = "avia-timestamps-panel";

    Object.assign(panel.style, {
        position:      "fixed",
        bottom:        "40px",
        right:         "40px",
        width:         "380px",
        height:        "480px",
        background:    "#1e1e1e",
        color:         "#fff",
        borderRadius:  "20px",
        boxShadow:     "0 12px 35px rgba(0,0,0,0.45)",
        zIndex:        999999,
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        border:        "1px solid rgba(255,255,255,0.08)",
        fontFamily:    "system-ui, sans-serif"
    });

    const CSS = `
        #avia-timestamps-panel * { box-sizing: border-box; }
        #avia-timestamps-panel input[type="datetime-local"] {
            width: 100%; padding: 8px 10px; border-radius: 8px; border: none;
            outline: none; background: rgba(255,255,255,0.07); color: #fff;
            font-size: 13px;
        }
        #avia-timestamps-panel input:focus { background: rgba(255,255,255,0.11); }
        #avia-timestamps-panel .avia-chip {
            padding: 5px 10px; border-radius: 8px; border: none; cursor: pointer;
            font-size: 12px; background: rgba(255,255,255,0.07); color: #fff;
        }
        #avia-timestamps-panel .avia-chip.active { background: rgba(255,255,255,0.22); }
        #avia-timestamps-panel .avia-chip:hover   { background: rgba(255,255,255,0.14); }
        #avia-timestamps-panel .avia-label {
            font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
            color: rgba(255,255,255,0.4); margin-bottom: 5px;
        }
        #avia-timestamps-panel .avia-preview {
            background: rgba(255,255,255,0.05); border-radius: 10px;
            padding: 12px 14px; font-size: 14px; color: rgba(255,255,255,0.9);
            word-break: break-all; min-height: 42px; line-height: 1.5;
        }
        #avia-timestamps-panel .avia-copy {
            width: 100%; padding: 10px; border-radius: 10px; border: none;
            cursor: pointer; font-size: 13px; font-weight: 600;
            background: rgba(255,255,255,0.12); color: #fff;
        }
        #avia-timestamps-panel .avia-copy:hover { background: rgba(255,255,255,0.2); }
        #avia-timestamps-panel .avia-recent-item {
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(255,255,255,0.05); border-radius: 8px;
            padding: 6px 10px; margin-bottom: 5px; font-size: 12px;
            font-family: monospace; color: rgba(255,255,255,0.7); gap: 8px;
        }
        #avia-timestamps-panel .avia-recent-copy {
            flex-shrink: 0; border: none; border-radius: 6px; cursor: pointer;
            font-size: 11px; padding: 3px 8px;
            background: rgba(255,255,255,0.1); color: #fff;
        }
        #avia-timestamps-panel hr {
            border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 4px 0;
        }
        #avia-timestamps-panel .tab-bar {
            display: flex; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        #avia-timestamps-panel .tab-btn {
            flex: 1; padding: 5px; font-size: 11px; border: none; cursor: pointer;
            background: transparent; color: rgba(255,255,255,0.5);
        }
        #avia-timestamps-panel .tab-btn.active {
            color: #fff; background: rgba(255,255,255,0.06);
        }
    `;
    const style = document.createElement("style");
    style.textContent = CSS;
    panel.appendChild(style);

    const header = document.createElement("div");
    Object.assign(header.style, {
        padding:      "18px",
        fontWeight:   "600",
        fontSize:     "15px",
        background:   "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        textAlign:    "center",
        position:     "relative",
        cursor:       "move",
        userSelect:   "none"
    });
    header.textContent = "Avia Timestamps";

    let dragging = false, offX = 0, offY = 0;
    header.addEventListener("mousedown", e => {
        dragging = true;
        const r = panel.getBoundingClientRect();
        offX = e.clientX - r.left;
        offY = e.clientY - r.top;
        panel.style.bottom = "auto";
        panel.style.right  = "auto";
        panel.style.left   = r.left + "px";
        panel.style.top    = r.top  + "px";
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", e => {
        if (!dragging) return;
        panel.style.left = e.clientX - offX + "px";
        panel.style.top  = e.clientY - offY + "px";
    });
    document.addEventListener("mouseup", () => {
        dragging = false;
        document.body.style.userSelect = "";
    });

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style, { position: "absolute", right: "18px", top: "16px", cursor: "pointer", opacity: "0.6" });
    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);
    panel.appendChild(header);

    const tabBar = document.createElement("div");
    tabBar.className = "tab-bar";

    const tabs = ["Builder", "Recent"];
    const tabPanes = tabs.map((label, i) => {
        const btn = document.createElement("button");
        btn.className = "tab-btn" + (i === 0 ? " active" : "");
        btn.textContent = label;
        btn.onclick = () => {
            tabBar.querySelectorAll(".tab-btn").forEach((b, j) => b.classList.toggle("active", j === i));
            panes.forEach((p, j) => p.style.display = j === i ? "flex" : "none");
            if (i === 1) renderRecent();
        };
        tabBar.appendChild(btn);

        const pane = document.createElement("div");
        Object.assign(pane.style, {
            flex: "1", overflowY: "auto", padding: "16px",
            flexDirection: "column", gap: "12px",
            display: i === 0 ? "flex" : "none"
        });
        return pane;
    });

    const panes = tabPanes;
    panel.appendChild(tabBar);
    panes.forEach(p => panel.appendChild(p));

    const builderPane = panes[0];
    let activePreset = 0;

    const dtLabel = document.createElement("div");
    dtLabel.className = "avia-label";
    dtLabel.textContent = "Date & Time";
    builderPane.appendChild(dtLabel);

    const dtInput = document.createElement("input");
    dtInput.type = "datetime-local";
    const now = new Date();
    dtInput.value = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    builderPane.appendChild(dtInput);

    const formatLabel = document.createElement("div");
    formatLabel.className = "avia-label";
    formatLabel.textContent = "Format";
    formatLabel.style.marginTop = "4px";
    builderPane.appendChild(formatLabel);

    const chipRow = document.createElement("div");
    Object.assign(chipRow.style, { display: "flex", flexWrap: "wrap", gap: "6px" });
    builderPane.appendChild(chipRow);

    function getDate() {
        return dtInput.value ? new Date(dtInput.value) : new Date();
    }

    function getOutput() {
        return discordTimestamp(getDate(), PRESETS[activePreset].flag);
    }

    function updatePreview() {
        try { preview.textContent = PRESETS[activePreset].preview(getDate()); }
        catch { preview.textContent = "Invalid"; }
    }

    function buildChips() {
        chipRow.innerHTML = "";
        PRESETS.forEach((p, i) => {
            const btn = document.createElement("button");
            btn.className = "avia-chip" + (i === activePreset ? " active" : "");
            btn.textContent = p.label;
            btn.onclick = () => { activePreset = i; buildChips(); updatePreview(); };
            chipRow.appendChild(btn);
        });
    }

    const divider = document.createElement("hr");
    builderPane.appendChild(divider);

    const previewLabel = document.createElement("div");
    previewLabel.className = "avia-label";
    previewLabel.textContent = "Preview";
    builderPane.appendChild(previewLabel);

    const preview = document.createElement("div");
    preview.className = "avia-preview";
    builderPane.appendChild(preview);

    const copyBtn = document.createElement("button");
    copyBtn.className = "avia-copy";
    copyBtn.textContent = "Copy to clipboard";
    copyBtn.onclick = () => copyText(getOutput(), copyBtn);
    builderPane.appendChild(copyBtn);

    dtInput.addEventListener("input", updatePreview);
    buildChips();
    updatePreview();

    const recentPane = panes[1];

    function renderRecent() {
        recentPane.innerHTML = "";
        if (!RECENT.length) {
            const empty = document.createElement("div");
            empty.style.cssText = "color:rgba(255,255,255,0.35);font-size:13px;padding:16px 0;";
            empty.textContent = "No recent timestamps yet.";
            recentPane.appendChild(empty);
            return;
        }
        const label = document.createElement("div");
        label.className = "avia-label";
        label.textContent = "Recently copied";
        recentPane.appendChild(label);

        RECENT.forEach(text => {
            const row = document.createElement("div");
            row.className = "avia-recent-item";
            const span = document.createElement("span");
            span.textContent = text;
            span.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
            const btn = document.createElement("button");
            btn.className = "avia-recent-copy";
            btn.textContent = "Copy";
            btn.onclick = () => copyText(text, btn);
            row.appendChild(span);
            row.appendChild(btn);
            recentPane.appendChild(row);
        });

        const clearBtn = document.createElement("button");
        clearBtn.style.cssText = "margin-top:8px;width:100%;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;background:rgba(255,0,0,0.15);color:rgba(255,150,150,0.9);";
        clearBtn.textContent = "Clear history";
        clearBtn.onclick = () => {
            RECENT = [];
            localStorage.setItem(STORAGE_RECENT, "[]");
            renderRecent();
        };
        recentPane.appendChild(clearBtn);
    }

    return panel;
}

function togglePanel() {
    let panel = document.getElementById("avia-timestamps-panel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }
    panel = buildPanel();
    document.body.appendChild(panel);
}

function injectButton() {
    if (document.getElementById("avia-timestamps-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");
    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-timestamps-btn";
    clone.querySelector("span.material-symbols-outlined").textContent = "calendar_month";
    clone.querySelector("button").onclick = togglePanel;

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

let btnCooldown = false;
new MutationObserver(() => {
    if (btnCooldown) return;
    btnCooldown = true;
    setTimeout(() => { injectButton(); btnCooldown = false; }, 300);
}).observe(document.body, { childList: true, subtree: true });

injectButton();

})();