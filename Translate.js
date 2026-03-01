(function () {

if (window.__AVIA_TRANSLATE__) return;
window.__AVIA_TRANSLATE__ = true;

const STORAGE_LANG = "avia_translate_lang";
const STORAGE_ENABLED = "avia_translate_enabled";
const STORAGE_DEFAULT_TOOLBAR = "avia_default_toolbar_lang";

let TARGET_LANG = localStorage.getItem(STORAGE_LANG) || "de";
let ENABLED = localStorage.getItem(STORAGE_ENABLED) !== "false";
let DEFAULT_TOOLBAR_LANG = localStorage.getItem(STORAGE_DEFAULT_TOOLBAR) || null;

const originalFetch = window.fetch.bind(window);

const languages = {
    af:"Afrikaans", ar:"Arabic", bn:"Bengali", bg:"Bulgarian",
    zh:"Chinese", hr:"Croatian", cs:"Czech", da:"Danish",
    nl:"Dutch", en:"English", fi:"Finnish", fr:"French",
    de:"German", el:"Greek", he:"Hebrew", hi:"Hindi",
    hu:"Hungarian", id:"Indonesian", it:"Italian", ja:"Japanese",
    ko:"Korean", no:"Norwegian", pl:"Polish", pt:"Portuguese",
    ro:"Romanian", ru:"Russian", es:"Spanish", sv:"Swedish",
    th:"Thai", tr:"Turkish", uk:"Ukrainian", vi:"Vietnamese"
};

async function translateWithDetect(text, forceLang = null) {
    try {
        const target = forceLang || TARGET_LANG;
        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await originalFetch(url);
        const data = await res.json();
        const detectedLang = data?.[2];
        const translated = data?.[0]?.map(x => x[0]).join("") || text;
        return { translated, detectedLang };
    } catch {
        return null;
    }
}

async function translate(text) {
    const result = await translateWithDetect(text);
    return result?.translated || text;
}

window.fetch = async function (resource, config = {}) {
    try {
        const url = resource?.toString?.() || "";
        if (
            ENABLED &&
            config.method === "POST" &&
            url.includes("/api/channels/") &&
            url.includes("/messages") &&
            config.body &&
            typeof config.body === "string"
        ) {
            const parsed = JSON.parse(config.body);
            if (parsed && typeof parsed.content === "string") {
                parsed.content = await translate(parsed.content);
                config = { ...config, body: JSON.stringify(parsed) };
            }
        }
    } catch {}
    return originalFetch(resource, config);
};

function toggleTranslatePanel() {

    let panel = document.getElementById("avia-translate-panel");

    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-translate-panel";

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
    header.textContent = "Avia Translate";

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

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
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

    document.addEventListener("mousemove", (e) => {
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
    Object.assign(container.style, {
        flex: "1",
        overflowY: "auto",
        padding: "18px"
    });

    const search = document.createElement("input");
    search.placeholder = "Search language...";
    Object.assign(search.style, {
        width: "100%",
        padding: "8px",
        marginBottom: "12px",
        borderRadius: "8px",
        border: "none",
        outline: "none",
        background: "rgba(255,255,255,0.06)",
        color: "#fff"
    });
    container.appendChild(search);

    const listWrapper = document.createElement("div");
    container.appendChild(listWrapper);

    function renderLanguages(filter = "") {
        listWrapper.innerHTML = "";
        Object.entries(languages)
            .sort((a,b)=>a[1].localeCompare(b[1]))
            .filter(([code,name]) =>
                name.toLowerCase().includes(filter.toLowerCase())
            )
            .forEach(([code, name]) => {

                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.marginBottom = "6px";

                const btn = document.createElement("button");
                btn.textContent = name;

                Object.assign(btn.style, {
                    flex: "1",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: code === TARGET_LANG
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.06)",
                    color: "#fff"
                });

                btn.onclick = () => {
                    TARGET_LANG = code;
                    localStorage.setItem(STORAGE_LANG, code);
                    renderLanguages(search.value);
                };

                const defaultBtn = document.createElement("button");
                defaultBtn.textContent =
                    DEFAULT_TOOLBAR_LANG === code ? "Default ✓" : "Set Default";

                Object.assign(defaultBtn.style, {
                    marginLeft: "6px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "11px",
                    background: DEFAULT_TOOLBAR_LANG === code
                        ? "rgba(0,200,0,0.3)"
                        : "rgba(255,255,255,0.08)",
                    color: "#fff"
                });

                defaultBtn.onclick = () => {
                    if (DEFAULT_TOOLBAR_LANG === code) {
                        DEFAULT_TOOLBAR_LANG = null;
                        localStorage.removeItem(STORAGE_DEFAULT_TOOLBAR);
                    } else {
                        DEFAULT_TOOLBAR_LANG = code;
                        localStorage.setItem(STORAGE_DEFAULT_TOOLBAR, code);
                    }
                    renderLanguages(search.value);
                };

                row.appendChild(btn);
                row.appendChild(defaultBtn);
                listWrapper.appendChild(row);
            });
    }

    search.addEventListener("input", () => {
        renderLanguages(search.value);
    });

    renderLanguages();

    panel.appendChild(header);
    panel.appendChild(container);
    document.body.appendChild(panel);
}

function injectToolbarTranslate() {

    document.querySelectorAll(".Toolbar").forEach(toolbar => {

        if (toolbar.dataset.aviaTranslateAttached) return;
        toolbar.dataset.aviaTranslateAttached = "true";

        const btn = document.createElement("div");
        btn.className = "cursor_pointer pos_relative p_var(--gap-sm)";

        btn.innerHTML = `
            <md-ripple aria-hidden="true"></md-ripple>
            <span class="material-symbols-outlined"
                  style="display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;">
                translate
            </span>
        `;

        btn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (!ENABLED) return;

            const messageWrapper = toolbar.closest(".group");
            if (!messageWrapper) return;

            let existing = messageWrapper.querySelector(".avia-inline-translation");
            if (existing) {
                existing.remove();
                return;
            }

            const clone = messageWrapper.cloneNode(true);
            clone.querySelector(".Toolbar")?.remove();
            clone.querySelectorAll("time").forEach(t => t.remove());
            clone.querySelectorAll("[class*='time'], [class*='timestamp']").forEach(t => t.remove());
            clone.querySelectorAll(".white-space_nowrap.tov_ellipsis").forEach(el => el.remove());
            clone.querySelectorAll(".material-symbols-outlined").forEach(el => el.remove());
            clone.querySelectorAll("*").forEach(el => {
                if (el.textContent.trim() === "(edited)") el.remove();
            });

            const text = clone.innerText.trim();
            if (!text) return;

            btn.style.opacity = "0.4";

            const targetLang = DEFAULT_TOOLBAR_LANG || TARGET_LANG;
            const result = await translateWithDetect(text, targetLang);

            btn.style.opacity = "1";

            if (!result) return;

            const detectedName = languages[result.detectedLang] || result.detectedLang || "Unknown";

            const block = document.createElement("div");
            block.className = "avia-inline-translation";
            block.textContent = result.translated + " - Translated from " + detectedName;

            block.style.marginTop = "6px";
            block.style.padding = "8px";
            block.style.borderRadius = "8px";
            block.style.background = "rgba(255,255,255,0.06)";
            block.style.fontSize = "13px";

            messageWrapper.appendChild(block);
        };

        toolbar.appendChild(btn);
    });
}

new MutationObserver(injectToolbarTranslate)
.observe(document.body, { childList: true, subtree: true });

injectToolbarTranslate();

function injectSettingsButton() {

    if (document.getElementById("avia-translate-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");

    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-translate-btn";

    clone.querySelector("span.material-symbols-outlined").textContent = "translate";
    clone.querySelector("button").onclick = toggleTranslatePanel;

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

new MutationObserver(injectSettingsButton)
.observe(document.body, { childList: true, subtree: true });

injectSettingsButton();

})();
