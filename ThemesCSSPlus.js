(function () {

    if (window.__AVIA_THEMES_MONACO__) return;
    window.__AVIA_THEMES_MONACO__ = true;

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    function getThemeName(css) {
        return css?.match(/@name\s+(.+)/)?.[1]?.trim() || "Untitled Theme";
    }

    function applyThemesLive() {
        const themes = JSON.parse(localStorage.getItem("avia_themes") || "[]");
        document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
        themes.forEach(t => {
            if (!t.enabled) return;
            const style = document.createElement("style");
            style.className = "avia-theme-style";
            style.textContent = t.css;
            document.head.appendChild(style);
        });
        if (typeof window.__avia_refresh_themes_panel === "function") {
            window.__avia_refresh_themes_panel();
        }
    }

    let monacoEditorInstance = null;

    async function openMonacoThemeEditor(themeId) {
        await preloadMonaco();

        const native = document.getElementById("avia-theme-editor");
        if (native) native.style.display = "none";

        const themes = JSON.parse(localStorage.getItem("avia_themes") || "[]");
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        let panel = document.getElementById("avia-themes-monaco-panel");

        if (panel) {
            panel.style.display = "flex";
            panel.querySelector("#avia-themes-monaco-title").textContent = "Theme Editor — " + getThemeName(theme.css);
            if (monacoEditorInstance) {
                monacoEditorInstance._aviaThemeId = themeId;
                const model = monacoEditorInstance.getModel();
                if (model) model.setValue(theme.css || "");
            }
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-themes-monaco-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "650px",
            height: "420px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.id = "avia-themes-monaco-title";
        header.textContent = "Theme Editor — " + getThemeName(theme.css);
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            color: "#fff",
            flex: "0 0 auto"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute", top: "12px", right: "16px",
            cursor: "pointer", opacity: "0.7", color: "#fff"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => panel.style.display = "none";

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        let isDragging = false, offsetX, offsetY;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => { isDragging = false; document.body.style.userSelect = ""; });
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });

        monacoEditorInstance = monaco.editor.create(editorContainer, {
            value: theme.css || "",
            language: "css",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on"
        });

        monacoEditorInstance._aviaThemeId = themeId;

        monacoEditorInstance.onDidChangeModelContent(() => {
            const id = monacoEditorInstance._aviaThemeId;
            if (!id) return;
            const value = monacoEditorInstance.getValue();
            const all = JSON.parse(localStorage.getItem("avia_themes") || "[]");
            const target = all.find(t => t.id === id);
            if (!target) return;
            target.css = value;
            localStorage.setItem("avia_themes", JSON.stringify(all));
            applyThemesLive();
        });
    }

    function tagEditButtons(panel) {
        panel.querySelectorAll("button").forEach(btn => {
            if (btn.__aviaMonacoHijacked__) return;
            if (btn.textContent.trim() !== "Edit") return;
            btn.__aviaMonacoHijacked__ = true;

            btn.addEventListener("click", e => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                const card = btn.parentElement?.parentElement;
                if (!card) return;
                const list = card.parentElement;
                if (!list) return;
                const index = Array.from(list.children).indexOf(card);
                if (index === -1) return;

                const themes = JSON.parse(localStorage.getItem("avia_themes") || "[]");
                const theme = themes[index];
                if (!theme?.id) return;

                openMonacoThemeEditor(theme.id);
            }, true); 
        });
    }

    preloadMonaco();

    new MutationObserver(() => {

        const native = document.getElementById("avia-theme-editor");
        if (native && native.style.display !== "none") native.style.display = "none";

        const panel = document.getElementById("avia-themes-panel");
        if (panel) tagEditButtons(panel);
    }).observe(document.body, { childList: true, subtree: true });

})();
