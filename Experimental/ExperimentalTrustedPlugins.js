(function () {

if (window.__AVIA_TRUSTED_PLUGINS_LOADED__) return;
window.__AVIA_TRUSTED_PLUGINS_LOADED__ = true;

function getSavedNotesAnchor() {
    return [...document.querySelectorAll("a")].find(a =>
        a.querySelector(".flex-g_1")?.textContent.trim() === "Saved Notes"
    ) || null;
}

function buildButton() {
    const a = document.createElement("a");
    a.id = "avia-trusted-plugins-btn";
    a.style.cursor = "pointer";
    a.style.textDecoration = "none";

    const inner = document.createElement("div");
    inner.className = "flex-sh_0 fw_500 fs_15px us_none cursor_pointer pos_relative d_flex ai_center m_0_var(--gap-md) p_0_var(--gap-md) bdr_var(--borderRadius-xl) c_var(--color) fill_var(--color) h_42px gap_var(--gap-md) bg_transparent";
    inner.style.setProperty("--color", "var(--md-sys-color-outline)");

    const ripple = document.createElement("md-ripple");
    ripple.setAttribute("aria-hidden", "true");

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.className = "material-symbols-outlined fs_inherit fw_undefined!";
    icon.style.cssText = 'display: block; font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0;';
    icon.textContent = "extension";

    const labelWrap = document.createElement("div");
    labelWrap.className = "flex-g_1 min-w_0";

    const labelInner = document.createElement("div");
    labelInner.className = "gap_var(--gap-md) h_100% d_flex ai_center";
    labelInner.textContent = "Trusted Plugins";

    labelWrap.appendChild(labelInner);
    inner.appendChild(ripple);
    inner.appendChild(icon);
    inner.appendChild(labelWrap);
    a.appendChild(inner);

    a.addEventListener("click", (e) => {
        e.preventDefault();
        const url = "https://avalilac.github.io/PluginRepo/";
        if (window.__TAURI__) {
            window.__TAURI__.shell.open(url);
        } else if (window.require) {
            try {
                window.require("electron").shell.openExternal(url);
            } catch {
                window.open(url, "_blank");
            }
        } else {
            window.open(url, "_blank");
        }
    });

    return a;
}

function injectButton() {
    const savedNotes = getSavedNotesAnchor();
    const existing = document.getElementById("avia-trusted-plugins-btn");

    if (!savedNotes) {
        if (existing) existing.remove();
        return;
    }

    if (existing) return;

    const btn = buildButton();
    savedNotes.insertAdjacentElement("afterend", btn);
}

new MutationObserver(() => {
    injectButton();
}).observe(document.body, { childList: true, subtree: true });

injectButton();

})();
