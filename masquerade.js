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
                        avatar: activeMasq.avatar
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
    Object.assign(nameInput.style, { width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: "none" });

    const avatarInput = document.createElement("input");
    avatarInput.placeholder = "Avatar URL";
    Object.assign(avatarInput.style, { width: "100%", marginBottom: "6px", padding: "6px", borderRadius: "6px", border: "none" });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Masquerade";
    Object.assign(addBtn.style, { width: "100%", padding: "6px", borderRadius: "6px", marginBottom: "12px", cursor: "pointer" });

    addBtn.onclick = () => {
        const name = nameInput.value.trim();
        const avatar = avatarInput.value.trim();
        if (!name || !avatar) return;
        const anyActive = MASQ_LIST.some(m => m.enabled);
        MASQ_LIST.push({ name, avatar, enabled: !anyActive });
        localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
        renderMasqList();
        nameInput.value = "";
        avatarInput.value = "";
    };

    container.appendChild(nameInput);
    container.appendChild(avatarInput);
    container.appendChild(addBtn);

    const listWrapper = document.createElement("div");
    container.appendChild(listWrapper);

    function renderMasqList() {
        listWrapper.innerHTML = "";
        MASQ_LIST = JSON.parse(localStorage.getItem(STORAGE_LIST) || "[]");
        MASQ_LIST.forEach((m, i) => {
            const row = document.createElement("div");
            Object.assign(row.style, { display: "flex", alignItems: "center", marginBottom: "6px" });

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
            nameSpan.textContent = m.name;
            nameSpan.style.flex = "1";

            btn.appendChild(img);
            btn.appendChild(nameSpan);

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

            const delBtn = document.createElement("button");
            delBtn.textContent = "✕";
            Object.assign(delBtn.style, { marginLeft: "6px", cursor: "pointer" });
            delBtn.onclick = () => {
                MASQ_LIST.splice(i, 1);
                localStorage.setItem(STORAGE_LIST, JSON.stringify(MASQ_LIST));
                renderMasqList();
            };

            row.appendChild(btn);
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
