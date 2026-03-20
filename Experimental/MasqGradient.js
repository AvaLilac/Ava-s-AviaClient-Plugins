(function(){

/* --- Impersonate.js --- */
if(window.__US_BUILDER_IMPERSONATE_JS__){return;}window.__US_BUILDER_IMPERSONATE_JS__=true;

(function () {
  if (window.__IMPERSONATE__) return;
  window.__IMPERSONATE__ = true;

  function apply() {

    const UserContextMenu = document.getElementsByClassName('d_flex flex-d_column p_var(--gap-md)_0 ov_hidden bdr_var(--borderRadius-xs) bg_var(--md-sys-color-surface-container) c_var(--md-sys-color-on-surface) fill_var(--md-sys-color-on-surface) bx-sh_0_0_3px_var(--md-sys-color-shadow) us_none UserContextMenu').item(0)
    if(UserContextMenu){
      const impersonateButton = document.createElement('div')
      impersonateButton.id='impersonate'
      impersonateButton.className = 'd_flex gap_var(--gap-md) ai_center p_var(--gap-md)_var(--gap-lg) [&:hover]:bg_color-mix(in_srgb,_var(--md-sys-color-on-surface)_8%,_transparent) [&_span]:flex-g_1 [&_span]:mt_1px cursor_pointer tt_capitalize'
      impersonateButton.innerText = 'Impersonate'
      impersonateButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M10.25 13a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M15 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10M10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12M4.42 9.47a8.05 8.05 0 0 0 3.66-4.44 8.05 8.05 0 0 0-3.66 4.44M20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 0 1-7.76-3.69A10.02 10.02 0 0 1 4 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8"></path></svg><span class="lh_1.25rem fs_0.875rem ls_0.015625rem fw_400">Impersonate</span>
      `

      const svg = document.createElement('svg')
      svg.innerHTML = `
      <path d="M10.25 13a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M15 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10M10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12M4.42 9.47a8.05 8.05 0 0 0 3.66-4.44 8.05 8.05 0 0 0-3.66 4.44M20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 0 1-7.76-3.69A10.02 10.02 0 0 1 4 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8"></path>
      `
      const path = document.createElement('path')
      path.d='M10.25 13a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M15 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10M10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12M4.42 9.47a8.05 8.05 0 0 0 3.66-4.44 8.05 8.05 0 0 0-3.66 4.44M20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 0 1-7.76-3.69A10.02 10.02 0 0 1 4 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8'

      const span = document.createElement('span')
      span.className = 'lh_1.25rem fs_0.875rem ls_0.015625rem fw_400'

      svg.appendChild(path)
      impersonateButton.appendChild(svg)
      impersonateButton.appendChild(span)
      if(!document.getElementById('impersonate')){
        UserContextMenu.appendChild(impersonateButton)
      }

      impersonateButton.addEventListener('click',async ()=>{
          if(impersonateButton.parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[0].children[0].children[0].innerText){
              let originalavatar = impersonateButton.parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[0].children[0].children[0].children[1].children[0].children[0].children[0].children[0].children[0].src
              let avatar = impersonateButton.parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[0].children[0].children[0].children[1].children[0].children[0].children[0].children[0].children[0].src+'/original'
              let displayname = impersonateButton.parentElement.parentElement.parentElement.parentElement.children[0].children[0].children[0].children[0].children[0].innerText

              const res = await fetch(avatar)
              if(res.ok){
                avatar = res.url 
              }else{
                avatar = originalavatar
              }

              if(displayname.includes('\n')){
                  displayname = displayname.substring(0,displayname.indexOf('\n'))
              }

              if(displayname.includes('#')){
                  displayname = displayname.substring(0,displayname.indexOf('#'))
              }
              const masquerade = {name:displayname,avatar:avatar,enabled:false}
              const masqueradeList= JSON.parse(localStorage.getItem('avia_masq_list'))||[];
              const currentMasquerade = masqueradeList.find(m=>m.enabled)
              currentMasquerade.enabled=false
              masqueradeList.splice(masqueradeList.indexOf(currentMasquerade),1)
              masqueradeList.push(currentMasquerade)
              const test = masqueradeList.find(m=>m.name==masquerade.name)
              if(!test){
                  masquerade.enabled=true;
                  masqueradeList.push(masquerade)  
              }else{
                  masqueradeList.splice(masqueradeList.indexOf(test),1)
                  test.enabled=true
                  masqueradeList.push(test)
              }
              localStorage.setItem('avia_masq_list',JSON.stringify(masqueradeList))
          }else{
            window.alert('Impersonating via the right click context menu doesn\'t work!')
          }
      });
    }
  }

  const observer = new MutationObserver(() => {
    apply();
  });

  function init() {
    apply();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.body) {
    init();
  } else {
    requestAnimationFrame(init);
  }
})();


/* --- masquerade.js --- */
if(window.__US_BUILDER_MASQUERADE_JS__){return;}window.__US_BUILDER_MASQUERADE_JS__=true;

(function () {

if (window.__AVIA_MASQ_PANEL__) return;
window.__AVIA_MASQ_PANEL__ = true;

const STORAGE_ENABLED = "avia_masq_enabled";
const STORAGE_LIST = "avia_masq_list";

let ENABLED = localStorage.getItem(STORAGE_ENABLED) !== "false";
let MASQ_LIST = JSON.parse(localStorage.getItem(STORAGE_LIST) || "[]");

function resolveToHex(color) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const hex6 = [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
    const canShorten = hex6[0]===hex6[1] && hex6[2]===hex6[3] && hex6[4]===hex6[5];
    return canShorten ? `#${hex6[0]}${hex6[2]}${hex6[4]}` : `#${hex6}`;
  } catch (_) { return color; }
}

function toHardStops(stopsArr) {
  const n = stopsArr.length;
  const out = [];
  stopsArr.forEach((stop, i) => {
    const start = Math.round((i / n) * 100);
    const end   = Math.round(((i + 1) / n) * 100);
    out.push(start === 0  ? stop.color : `${stop.color} ${start}%`);
    out.push(end   === 100 ? stop.color : `${stop.color} ${end}%`);
  });
  return out.join(",");
}

function buildGradientCSS(stopsStr, gType, gAngle) {
  if (gType === "radial") return `radial-gradient(${stopsStr})`;
  return `linear-gradient(${gAngle}deg,${stopsStr})`;
}

function buildCSSFromStops(stops, gType, gAngle, hardStop, forApi) {
  const s = forApi ? stops.map(s => ({...s, color: resolveToHex(s.color)})) : stops;
  const stopsStr = hardStop
    ? toHardStops(s)
    : s.map(s => `${s.color} ${s.pos}%`).join(forApi ? "," : ", ");
  return buildGradientCSS(stopsStr, gType, gAngle);
}

function openColorPickerDialog(initialColor, onSave) {
  if (document.getElementById("avia-masq-color-dialog")) return;

  let stops = [
    { color: "#ff0000", pos: 0 },
    { color: "#0000ff", pos: 100 },
  ];
  let gType = "linear";
  let gAngle = 90;
  let hardStop = false;
  let isGradient = false;

  if (initialColor && initialColor.includes("gradient")) {
    isGradient = true;

  } else if (initialColor && initialColor.startsWith("#")) {
    stops = [
      { color: initialColor, pos: 0 },
      { color: initialColor, pos: 100 },
    ];
  }

  const backdrop = document.createElement("div");
  backdrop.id = "avia-masq-color-dialog";
  Object.assign(backdrop.style, {
    position: "fixed", inset: "0",
    zIndex: 99999999,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)",
  });
  backdrop.onclick = (e) => { if (e.target === backdrop) close(); };

  const card = document.createElement("div");
  Object.assign(card.style, {
    padding: "24px",
    minWidth: "280px",
    maxWidth: "480px",
    width: "100%",
    borderRadius: "28px",
    display: "flex",
    flexDirection: "column",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    boxSizing: "border-box",
    gap: "14px",
  });

  const title = document.createElement("span");
  title.textContent = "Set Masquerade Color";
  Object.assign(title.style, {
    lineHeight: "2rem", fontSize: "1.5rem",
    letterSpacing: "0", fontWeight: "400",
    color: "var(--md-sys-color-on-surface)",
  });

  const preview = document.createElement("div");
  Object.assign(preview.style, {
    height: "36px", borderRadius: "8px",
    border: "1px solid color-mix(in srgb, 12% var(--md-sys-color-on-surface), transparent)",
    transition: "background 0.2s",
  });

  const typeRow = document.createElement("div");
  Object.assign(typeRow.style, { display: "flex", gap: "10px", alignItems: "center" });

  const typeSelect = document.createElement("select");
  Object.assign(typeSelect.style, {
    padding: "8px 12px", borderRadius: "4px",
    border: "none", outline: "none", flexShrink: "0",
    background: "color-mix(in srgb, 8% var(--md-sys-color-on-surface), transparent)",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "0.875rem", fontFamily: "inherit", cursor: "pointer",
  });
  ["linear", "radial"].forEach(v => {
    const o = document.createElement("option");
    o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1);
    typeSelect.appendChild(o);
  });
  typeSelect.value = gType;

  const angleLabel = document.createElement("span");
  Object.assign(angleLabel.style, {
    fontSize: "0.75rem", whiteSpace: "nowrap", width: "58px",
    color: "var(--md-sys-color-on-surface-variant)",
  });
  angleLabel.textContent = `${gAngle}°`;

  const angleSlider = document.createElement("input");
  angleSlider.type = "range"; angleSlider.min = 0; angleSlider.max = 360; angleSlider.value = gAngle;
  Object.assign(angleSlider.style, { flex: "1", accentColor: "var(--md-sys-color-primary)" });
  angleSlider.oninput = () => {
    gAngle = +angleSlider.value;
    angleLabel.textContent = `${gAngle}°`;
    refresh();
  };

  typeSelect.onchange = () => {
    gType = typeSelect.value;
    angleSlider.style.display = gType === "radial" ? "none" : "";
    angleLabel.style.display  = gType === "radial" ? "none" : "";
    refresh();
  };

  typeRow.append(typeSelect, angleSlider, angleLabel);

  const hardStopRow = document.createElement("label");
  Object.assign(hardStopRow.style, {
    display: "flex", alignItems: "center", gap: "10px",
    cursor: "pointer", userSelect: "none",
    padding: "8px 12px", borderRadius: "8px",
    background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
  });
  const hardStopCheckbox = document.createElement("input");
  hardStopCheckbox.type = "checkbox"; hardStopCheckbox.checked = hardStop;
  Object.assign(hardStopCheckbox.style, {
    width: "16px", height: "16px", cursor: "pointer",
    accentColor: "var(--md-sys-color-primary)", flexShrink: "0",
  });
  hardStopCheckbox.onchange = () => { hardStop = hardStopCheckbox.checked; refresh(); };
  const hardStopLbl = document.createElement("span");
  hardStopLbl.textContent = "Hard stops (no blending)";
  Object.assign(hardStopLbl.style, { fontSize: "0.875rem", color: "var(--md-sys-color-on-surface)" });
  hardStopRow.append(hardStopCheckbox, hardStopLbl);

  // Color stops list
  const stopsList = document.createElement("div");
  Object.assign(stopsList.style, { display: "flex", flexDirection: "column", gap: "6px" });

  const addStopBtn = document.createElement("button");
  addStopBtn.textContent = "+ Add Stop";
  Object.assign(addStopBtn.style, {
    alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer",
    color: "var(--md-sys-color-primary)", fontSize: "0.875rem",
    letterSpacing: "0.015625rem", padding: "4px 0", fontFamily: "inherit",
  });

  const capMsg = document.createElement("span");
  capMsg.textContent = "Max 5 color stops.";
  Object.assign(capMsg.style, {
    display: "none", fontSize: "0.72rem", lineHeight: "1.4",
    color: "var(--md-sys-color-on-surface-variant)",
  });

  function renderStops() {
    stopsList.innerHTML = "";
    stops.forEach((stop, idx) => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex", gap: "8px", alignItems: "center",
        background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
        borderRadius: "8px", padding: "8px 10px",
      });

      const swatch = document.createElement("input");
      swatch.type = "color"; swatch.value = resolveToHex(stop.color);
      Object.assign(swatch.style, {
        width: "30px", height: "30px", borderRadius: "50%",
        border: "none", cursor: "pointer", padding: "2px",
        background: "none", flexShrink: "0",
      });
      swatch.oninput = () => { stops[idx].color = swatch.value; refresh(); };

      const slider = document.createElement("input");
      slider.type = "range"; slider.min = 0; slider.max = 100; slider.value = stop.pos;
      Object.assign(slider.style, { flex: "1", accentColor: "var(--md-sys-color-primary)" });

      const posLbl = document.createElement("span");
      Object.assign(posLbl.style, {
        fontSize: "0.75rem", width: "30px", textAlign: "right",
        color: "var(--md-sys-color-on-surface-variant)",
      });
      posLbl.textContent = stop.pos + "%";

      slider.oninput = () => {
        stops[idx].pos = +slider.value;
        posLbl.textContent = slider.value + "%";
        refresh();
      };

      const rmBtn = document.createElement("button");
      rmBtn.textContent = "✕";
      Object.assign(rmBtn.style, {
        background: "none", border: "none", cursor: "pointer", flexShrink: "0",
        color: "var(--md-sys-color-on-surface-variant)",
        fontSize: "0.875rem", padding: "2px 6px", borderRadius: "4px",
      });
      rmBtn.onclick = () => {
        if (stops.length <= 2) return;
        stops.splice(idx, 1);
        renderStops(); refresh();
      };

      row.append(swatch, slider, posLbl, rmBtn);
      stopsList.appendChild(row);
    });

    addStopBtn.style.display = stops.length >= 5 ? "none" : "";
    capMsg.style.display     = stops.length >= 5 ? "" : "none";
  }

  addStopBtn.onclick = () => {
    if (stops.length >= 5) return;
    stops.push({ color: "#ffffff", pos: Math.min(100, stops[stops.length - 1].pos + 10) });
    renderStops(); refresh();
  };

  const noColorRow = document.createElement("label");
  Object.assign(noColorRow.style, {
    display: "flex", alignItems: "center", gap: "10px",
    cursor: "pointer", userSelect: "none",
    padding: "8px 12px", borderRadius: "8px",
    background: "color-mix(in srgb, 6% var(--md-sys-color-on-surface), transparent)",
  });
  const noColorCheckbox = document.createElement("input");
  noColorCheckbox.type = "checkbox"; noColorCheckbox.checked = !initialColor;
  Object.assign(noColorCheckbox.style, {
    width: "16px", height: "16px", cursor: "pointer",
    accentColor: "var(--md-sys-color-primary)", flexShrink: "0",
  });
  const noColorLbl = document.createElement("span");
  noColorLbl.textContent = "No color (use default)";
  Object.assign(noColorLbl.style, { fontSize: "0.875rem", color: "var(--md-sys-color-on-surface)" });
  noColorRow.append(noColorCheckbox, noColorLbl);

  noColorCheckbox.onchange = () => {
    const disabled = noColorCheckbox.checked;
    [typeRow, hardStopRow, stopsList, addStopBtn, capMsg].forEach(el => {
      el.style.opacity = disabled ? "0.4" : "1";
      el.style.pointerEvents = disabled ? "none" : "";
    });
    refresh();
  };

  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    gap: "8px", display: "flex", justifyContent: "flex-end", marginBlockStart: "8px",
  });

  function mkBtn(label, primary) {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      lineHeight: "1.25rem", fontSize: "0.875rem",
      letterSpacing: "0.015625rem", fontWeight: "400",
      padding: "0 16px", height: "40px",
      borderRadius: "9999px", border: "none", cursor: "pointer",
      fontFamily: "inherit",
      color: primary ? "var(--md-sys-color-on-primary)" : "var(--md-sys-color-primary)",
      background: primary ? "var(--md-sys-color-primary)" : "none",
    });
    return btn;
  }

  const cancelBtn = mkBtn("Cancel", false);
  cancelBtn.onclick = close;

  const saveBtn = mkBtn("Save", true);
  saveBtn.onclick = () => {
    if (noColorCheckbox.checked) {
      onSave(null);
    } else {
      onSave(buildCSSFromStops(stops, gType, gAngle, hardStop, true));
    }
    close();
  };

  btnRow.append(cancelBtn, saveBtn);

  card.append(title, preview, noColorRow, typeRow, hardStopRow, stopsList, addStopBtn, capMsg, btnRow);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); }

  function refresh() {
    if (noColorCheckbox.checked) {
      preview.style.background = "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)";
      return;
    }
    preview.style.background = buildCSSFromStops(stops, gType, gAngle, hardStop, false);
  }

  renderStops();
  refresh();

  if (noColorCheckbox.checked) {
    [typeRow, hardStopRow, stopsList, addStopBtn, capMsg].forEach(el => {
      el.style.opacity = "0.4";
      el.style.pointerEvents = "none";
    });
  }
}



const originalFetch = window.fetch.bind(window);

window.fetch = async function (resource, config = {}) {
    try {
        const url = resource?.toString?.() || "";
        if (
            ENABLED &&
            config.method === "POST" &&
            url.includes("/channels/") &&
            url.includes("/messages") &&
            config.body &&
            typeof config.body === "string" &&
            MASQ_LIST.length
        ) {
            const parsed = JSON.parse(config.body);
            if (parsed && typeof parsed.content === "string") {
                MASQ_LIST = JSON.parse(localStorage.getItem(STORAGE_LIST) || "[]");
                const activeMasq = MASQ_LIST.find(m => m.enabled);
                if (activeMasq) {
                    parsed.masquerade = {
                        name: activeMasq.name,
                        avatar: activeMasq.avatar,

                        ...(activeMasq.colour ? { colour: activeMasq.colour } : {}),
                    };
                    config = { ...config, body: JSON.stringify(parsed) };
                }
            }
        }
    } catch (e) { console.warn("Masq panel fetch error", e); }
    return originalFetch(resource, config);
};


function toggleMasqPanel() {
    let panel = document.getElementById("avia-masq-panel");

    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-masq-panel";

    Object.assign(panel.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        width: "380px",
        height: "500px",
        background: "#1e1e1e",
        color: "#fff",
        borderRadius: "20px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)"
    });

    const header = document.createElement("div");
    header.textContent = "Masquerade";

    Object.assign(header.style, {
        padding: "18px",
        fontWeight: "600",
        fontSize: "16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        cursor: "move",
        position: "relative",
        textAlign: "center",
        userSelect: "none"
    });

    let isDragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener("mousedown", e => {
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panel.style.bottom = "auto";
        panel.style.right = "auto";
        panel.style.left = rect.left + "px";
        panel.style.top = rect.top + "px";
        document.body.style.userSelect = "none";
    });
    document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";
    });
    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
    });

    const toggleBtn = document.createElement("div");
    Object.assign(toggleBtn.style, {
        position: "absolute",
        left: "18px",
        top: "16px",
        cursor: "pointer",
        fontSize: "12px",
        padding: "4px 8px",
        borderRadius: "8px"
    });
    function updateToggleUI() {
        toggleBtn.textContent = ENABLED ? "ON" : "OFF";
        toggleBtn.style.background = ENABLED
            ? "rgba(0,200,0,0.25)"
            : "rgba(200,0,0,0.25)";
    }
    updateToggleUI();
    toggleBtn.onclick = () => {
        ENABLED = !ENABLED;
        localStorage.setItem(STORAGE_ENABLED, ENABLED);
        updateToggleUI();
    };
    header.appendChild(toggleBtn);

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style, {
        position: "absolute",
        right: "18px",
        top: "16px",
        cursor: "pointer"
    });
    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    const container = document.createElement("div");
    Object.assign(container.style, { flex: "1", overflowY: "auto", padding: "18px" });

    const disclaimer = document.createElement("div");
    disclaimer.textContent = "⚠️ Masquerade only works in servers/groups with permission. Currently does not work in DMs. There has been a fix made, but it's not live yet.";
    Object.assign(disclaimer.style, { fontSize: "12px", marginBottom: "12px", color: "#ffcc00" });
    container.appendChild(disclaimer);

    const nameInput = document.createElement("input");
    nameInput.placeholder = "Masq Name";
    Object.assign(nameInput.style, { width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: "none", boxSizing: "border-box" });

    const avatarInput = document.createElement("input");
    avatarInput.placeholder = "Avatar URL";
    Object.assign(avatarInput.style, { width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: "none", boxSizing: "border-box" });


    let pendingColour = null; 

    const colourRow = document.createElement("div");
    Object.assign(colourRow.style, {
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "6px",
    });

    const colourSwatch = document.createElement("div");
    Object.assign(colourSwatch.style, {
        width: "28px", height: "28px", borderRadius: "6px", flexShrink: "0",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.08)",
        cursor: "pointer",
    });

    const colourLabel = document.createElement("span");
    Object.assign(colourLabel.style, {
        fontSize: "12px", color: "rgba(255,255,255,0.6)", flex: "1",
    });
    colourLabel.textContent = "No color set";

    const colourPickBtn = document.createElement("button");
    colourPickBtn.textContent = "🎨 Set Color";
    Object.assign(colourPickBtn.style, {
        padding: "4px 10px", borderRadius: "6px",
        border: "none", cursor: "pointer", fontSize: "12px",
        background: "rgba(255,255,255,0.12)", color: "#fff",
    });

    function updateColourUI(colour) {
        pendingColour = colour;
        if (colour) {
            colourSwatch.style.background = colour;

            colourLabel.textContent = colour.length > 40
                ? colour.substring(0, 37) + "…"
                : colour;
            colourLabel.title = colour;
        } else {
            colourSwatch.style.background = "rgba(255,255,255,0.08)";
            colourLabel.textContent = "No color set";
            colourLabel.title = "";
        }
    }

    colourPickBtn.onclick = () => {
        openColorPickerDialog(pendingColour, (newColour) => {
            updateColourUI(newColour);
        });
    };
    colourSwatch.onclick = () => colourPickBtn.click();

    colourRow.append(colourSwatch, colourLabel, colourPickBtn);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Masquerade";
    Object.assign(addBtn.style, { width: "100%", padding: "6px", borderRadius: "6px", marginBottom: "12px", cursor: "pointer" });

    addBtn.onclick = () => {
        const name = nameInput.value.trim();
        const avatar = avatarInput.value.trim();
        if (!name || !avatar) return;
        const anyActive = MASQ_LIST.some(m => m.enabled);
        const entry = { name, avatar, enabled: !anyActive };
        if (pendingColour) entry.colour = pendingColour;
        MASQ_LIST.push(entry);
        localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
        renderMasqList();
        nameInput.value = "";
        avatarInput.value = "";
        updateColourUI(null);
    };

    container.appendChild(nameInput);
    container.appendChild(avatarInput);
    container.appendChild(colourRow);
    container.appendChild(addBtn);

    const listWrapper = document.createElement("div");
    container.appendChild(listWrapper);

    function renderMasqList() {
        listWrapper.innerHTML = "";
        MASQ_LIST = JSON.parse(localStorage.getItem(STORAGE_LIST) || "[]");
        MASQ_LIST.forEach((m, i) => {
            const row = document.createElement("div");
            Object.assign(row.style, { display: "flex", alignItems: "center", marginBottom: "6px", gap: "4px" });

            const btn = document.createElement("button");
            btn.style.flex = "1";
            btn.style.padding = "6px";
            btn.style.borderRadius = "6px";
            btn.style.border = "none";
            btn.style.cursor = "pointer";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.gap = "8px";
            btn.style.position = "relative";
            btn.style.background = "rgba(255,255,255,0.08)";

            const img = document.createElement("img");
            img.src = m.avatar;
            img.style.width = "24px";
            img.style.height = "24px";
            img.style.borderRadius = "50%";
            img.style.objectFit = "cover";

            const nameSpan = document.createElement("span");
            nameSpan.style.flex = "1";
            nameSpan.style.textAlign = "left";

            if (m.colour) {
                if (m.colour.includes("gradient")) {
                    nameSpan.style.backgroundImage = m.colour;
                    nameSpan.style.webkitBackgroundClip = "text";
                    nameSpan.style.backgroundClip = "text";
                    nameSpan.style.webkitTextFillColor = "transparent";
                    nameSpan.style.color = "transparent";
                } else {
                    nameSpan.style.color = m.colour;
                }
            } else {
                nameSpan.style.color = "#fff";
            }
            nameSpan.textContent = m.name;

            btn.appendChild(img);
            btn.appendChild(nameSpan);

            if (m.colour) {
                const dot = document.createElement("div");
                Object.assign(dot.style, {
                    width: "10px", height: "10px", borderRadius: "50%", flexShrink: "0",
                    background: m.colour,
                    border: "1px solid rgba(255,255,255,0.2)",
                });
                btn.appendChild(dot);
            }

            const check = document.createElement("span");
            check.textContent = "✔";
            Object.assign(check.style, {
                position: "absolute",
                right: "6px",
                top: "6px",
                fontSize: "12px",
                color: m.enabled ? "#0f0" : "transparent",
                fontWeight: "bold"
            });
            btn.appendChild(check);

            btn.onclick = () => {
                MASQ_LIST.forEach((x, idx) => x.enabled = idx === i);
                localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
                renderMasqList();
            };

            const editColourBtn = document.createElement("button");
            editColourBtn.textContent = "🎨";
            editColourBtn.title = "Edit color";
            Object.assign(editColourBtn.style, {
                marginLeft: "2px", cursor: "pointer", fontSize: "14px",
                background: "rgba(255,255,255,0.08)", border: "none",
                borderRadius: "6px", padding: "4px 6px",
            });
            editColourBtn.onclick = () => {
                openColorPickerDialog(m.colour || null, (newColour) => {
                    if (newColour === null) {
                        delete MASQ_LIST[i].colour;
                    } else {
                        MASQ_LIST[i].colour = newColour;
                    }
                    localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
                    renderMasqList();
                });
            };

            const delBtn = document.createElement("button");
            delBtn.textContent = "✕";
            Object.assign(delBtn.style, { marginLeft: "2px", cursor: "pointer" });
            delBtn.onclick = () => {
                MASQ_LIST.splice(i, 1);
                localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
                renderMasqList();
            };

            row.appendChild(btn);
            row.appendChild(editColourBtn);
            row.appendChild(delBtn);
            listWrapper.appendChild(row);
        });
    }

    renderMasqList();
    const refreshButton = document.createElement('div')
    refreshButton.textContent='↺'
    Object.assign(refreshButton.style,{
        position:'absolute',
        right:'36px',
        top:'16px',
        cursor:'pointer'
    });
    refreshButton.onclick = ()=>{
        renderMasqList()
    }
    header.appendChild(refreshButton)

    panel.appendChild(header);
    panel.appendChild(container);
    document.body.appendChild(panel);
}

function injectSettingsButton() {
    if (document.getElementById("avia-masq-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");
    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-masq-btn";

    const btn = clone.querySelector("button");
    btn.onclick = toggleMasqPanel;

    const spanIcon = clone.querySelector("span.material-symbols-outlined");

    spanIcon.textContent = "domino_mask";
    spanIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    spanIcon.style.color = "#e3e3e3";

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

new MutationObserver(injectSettingsButton)
.observe(document.body, { childList: true, subtree: true });

injectSettingsButton();

})();



})();
