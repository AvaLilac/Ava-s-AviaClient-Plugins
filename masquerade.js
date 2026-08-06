/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/masquerade.js
  @VERSION: 1.5
*/

(function(){
'@preserve - Built on 2026-08-06T22:24:05.190Z';

/* --- masquerade (1).js --- */
if(window.__US_BUILDER_MASQUERADE_1_JS__){return;}window.__US_BUILDER_MASQUERADE_1_JS__=true;

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
    disclaimer.textContent = "⚠️ Masquerade only works in servers/groups/ with permission, DM's Are supported";
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

    const gifBtn = gifSpan.closest("button");
    if (!gifBtn) return;

    const wrapper = gifBtn.parentElement;
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-masq-btn";
    clone.style.position = "relative";

    const btn = clone.querySelector("button");
    btn.onclick = toggleMasqPanel;
    btn.style.position = "relative";

    const spanIcon = clone.querySelector("span.material-symbols-outlined");

    spanIcon.textContent = "domino_mask";
    spanIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24";
    spanIcon.style.color = "#e3e3e3";

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

function uninjectSettingsButton(){
  const button = document.getElementById('avia-masq-btn')
  if(button){
    button.parentElement.removeChild(button)
  }
}

new MutationObserver(()=>{
  const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
  .find(s => s.textContent.trim() === "gif");
  if(!gifSpan){
    uninjectSettingsButton()
    return;
  }
  injectSettingsButton()
})
.observe(document.body, { childList: true, subtree: true });

injectSettingsButton();

})();


/* --- impersonate.js --- */
if(window.__US_BUILDER_IMPERSONATE_JS__){return;}window.__US_BUILDER_IMPERSONATE_JS__=true;

(function () {
  if (window.__IMPERSONATE__) return;
  window.__IMPERSONATE__ = true;

  function impersonate() {
    if(!localStorage.getItem('avia_masq_list')){
        console.warn(`Ava's masquerade plugin is required for this plugin to function!`)
        return;
    }

    const username = document.querySelector(`div[aria-label='Click to copy username']`)
    const copyuseridbutton = document.querySelector(`a:has(svg>path[d='M20 7h-5V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m-9 0V4h2v5h-2zm9 13H4V9h5c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2h5z'])`)
    const profilebutton = document.querySelector(`a:has(svg>path[d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2M7.35 18.5C8.66 17.56 10.26 17 12 17s3.34.56 4.65 1.5c-1.31.94-2.91 1.5-4.65 1.5s-3.34-.56-4.65-1.5m10.79-1.38a9.95 9.95 0 0 0-12.28 0A7.96 7.96 0 0 1 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.95-.7 3.73-1.86 5.12'])`)
    const addfriendbutton = document.querySelector(`a:has(svg>path[d='M20 9V6h-2v3h-3v2h3v3h2v-3h3V9zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m6.39 8.56C13.71 13.7 11.53 13 9 13s-4.71.7-6.39 1.56A2.97 2.97 0 0 0 1 17.22V20h16v-2.78c0-1.12-.61-2.15-1.61-2.66M15 18H3v-.78c0-.38.2-.72.52-.88C4.71 15.73 6.63 15 9 15s4.29.73 5.48 1.34c.32.16.52.5.52.88z'])`)
    const messagebutton = document.querySelector(`a:has(svg>path[d='M4 4h16v12H5.17L4 17.17zm0-2c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm2 10h8v2H6zm0-3h12v2H6zm0-3h12v2H6z'])`)
    if((profilebutton||(messagebutton&&!messagebutton.href)||addfriendbutton||(username&&copyuseridbutton))&&!document.getElementById('impersonate')){
      let impersonatebutton;
      let button;
      if(profilebutton){
        impersonatebutton = profilebutton.cloneNode(true)
        button = profilebutton
      }else{
        if(messagebutton&&!messagebutton.href){
          impersonatebutton = messagebutton.cloneNode(true)
          button = messagebutton
        }else if(addfriendbutton){
          impersonatebutton = addfriendbutton.cloneNode(true)
          button = addfriendbutton
        }else{
          impersonatebutton = copyuseridbutton.cloneNode(true)
          button = copyuseridbutton
        }
      }

      impersonatebutton.querySelector(`span`).textContent = 'Impersonate'
      impersonatebutton.querySelector('path').setAttribute('d','M10.25 13a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M15 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10M10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12M4.42 9.47a8.05 8.05 0 0 0 3.66-4.44 8.05 8.05 0 0 0-3.66 4.44M20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 0 1-7.76-3.69A10.02 10.02 0 0 1 4 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8')
      impersonatebutton.id='impersonate'
      impersonatebutton.querySelectorAll(`path[d]`).forEach(path=>{
        if(path.getAttribute('d')!='M10.25 13a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M15 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10M10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12M4.42 9.47a8.05 8.05 0 0 0 3.66-4.44 8.05 8.05 0 0 0-3.66 4.44M20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 0 1-7.76-3.69A10.02 10.02 0 0 1 4 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8'){
          path.remove()
        }
      })
      impersonatebutton.querySelector('circle')?.remove()

      impersonatebutton.onclick = async function(){
        const username = document.querySelector(`div[aria-label='Click to copy username']`)
        if(!username) return alert('Impersonating via right clicking isn\'t supported!');

        const parent = username.offsetParent
        let pfp = parent.querySelector(`svg`).querySelector(`img`).src
        if(!pfp.includes('default_avatar')){
          if(!pfp.includes('/original')) pfp = pfp+'/original'
          const res = await fetch(pfp)
          pfp = res.url
        }

        const balls = parent.querySelector(`svg`).nextSibling
        let displayname;
        if(balls.firstChild.tagName=='SPAN'){
          displayname = balls.firstChild.textContent
        }else{
          displayname = username.textContent.replace(/#[0-9]{4}/,'')
        }

        const masquerades = JSON.parse(localStorage.getItem('avia_masq_list') || "[]")
        const existingmasq = masquerades.find(m=>m.name==displayname&&m.avatar==pfp)
        const activemasq = masquerades.find(m=>m.enabled)
        if(activemasq&&activemasq!=existingmasq){
          masquerades.splice(masquerades.indexOf(activemasq),1)
          activemasq.enabled=false
          masquerades.push(activemasq)
        }

        if(!existingmasq){
          masquerades.push({name:displayname,avatar:pfp,enabled:true})
        }else if(existingmasq!=activemasq){
          masquerades.splice(masquerades.indexOf(existingmasq),1)
          existingmasq.enabled=true
          masquerades.push(existingmasq)
        }
        localStorage.setItem('avia_masq_list',JSON.stringify(masquerades))
      }

      console.log(button)
      button.parentElement.appendChild(impersonatebutton)
    }
  }

  const observer = new MutationObserver(() => {
    impersonate();
  });

  function init() {
    impersonate();
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


})();
