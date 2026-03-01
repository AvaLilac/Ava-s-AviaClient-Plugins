(function () {

    if (window.__AVIA_DEVTOOLS_PLUGIN__) return;
    window.__AVIA_DEVTOOLS_PLUGIN__ = true;

    console.log("[Avia] DevTools Plugin Loaded");

    function openDevTools() {
        try {
            const electron = require("electron");
            const win = electron.remote
                ? electron.remote.getCurrentWindow()
                : electron.BrowserWindow.getFocusedWindow();

            if (!win) return;

            if (win.webContents.isDevToolsOpened()) {
                win.webContents.closeDevTools();
            } else {
                win.webContents.openDevTools();
            }

        } catch (err) {
            console.warn("[Avia] Unable to access Electron window.", err);
        }
    }

    function setIcon(button) {
        const oldSvg = button.querySelector("svg");
        if (oldSvg) oldSvg.remove();

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M3 4h18v12H3V4zm2 2v8h14V6H5zm3 12h8v2H8v-2z");
        svg.appendChild(path);

        button.insertBefore(svg, button.firstChild);
    }

    function injectButton() {
        const appearanceBtn = Array.from(document.querySelectorAll("a"))
            .find(a => a.textContent.trim() === "Appearance");

        if (!appearanceBtn) return;

        const targetBtn = document.querySelector(
            "a.pos_relative.min-w_0.d_flex.ai_center.p_6px_8px.bdr_8px.fw_500.me_12px.fs_15px.us_none.trs_background-color_0\\.1s_ease-in-out"
        );

        if (!targetBtn) return;
        if (document.getElementById("avia-devtools-button")) return;

        const newBtn = appearanceBtn.cloneNode(true);
        newBtn.id = "avia-devtools-button";

        const textNode = Array.from(newBtn.querySelectorAll("div"))
            .find(d => d.children.length === 0);

        if (textNode) textNode.textContent = "(Avia) DevTools";

        setIcon(newBtn);
        newBtn.addEventListener("click", openDevTools);

        targetBtn.parentElement.insertBefore(newBtn, targetBtn);
    }

    function registerKeybind() {
        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                openDevTools();
            }
        });
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) {
                obs.disconnect();
                callback();
            }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        registerKeybind();

        const observer = new MutationObserver(() => injectButton());
        observer.observe(document.body, { childList: true, subtree: true });

        injectButton();
    });

})();
