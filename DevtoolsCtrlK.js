(function () {

    if (window.__AVIA_CTRLK_DEVTOOLS__) return;
    window.__AVIA_CTRLK_DEVTOOLS__ = true;

    console.log("[Avia] Ctrl+K DevTools plugin loaded");

    function toggleDevTools() {
        try {
            const { remote } = require("electron");
            const win = remote.getCurrentWindow();

            if (win.webContents.isDevToolsOpened()) {
                win.webContents.closeDevTools();
            } else {
                win.webContents.openDevTools({ mode: "detach" });
            }

        } catch (e) {
            console.warn("[Avia] Electron access failed. Falling back to shortcut method.");

            // Fallback: simulate Ctrl+Shift+I
            document.dispatchEvent(new KeyboardEvent("keydown", {
                key: "I",
                code: "KeyI",
                ctrlKey: true,
                shiftKey: true,
                bubbles: true
            }));
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            toggleDevTools();
        }
    });

})();
