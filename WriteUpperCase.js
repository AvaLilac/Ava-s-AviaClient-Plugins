(function () {

    const STORAGE_KEY = "avia_autocap_enabled";
    const SUBMENU_PARENT = "avia_autocap";

    let enabled = localStorage.getItem(STORAGE_KEY) !== "false";

    function saveState() {
        localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    }

    function hookEditor(editor) {
        if (editor.__autoCapHooked) return;
        editor.__autoCapHooked = true;
        editor.addEventListener("beforeinput", (e) => {
            if (!enabled) return;
            if (e.inputType !== "insertText") return;
            if (!e.data || !/^[a-z]$/.test(e.data)) return;
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            const preRange = range.cloneRange();
            preRange.selectNodeContents(editor);
            preRange.setEnd(range.startContainer, range.startOffset);
            const textBefore = preRange.toString();
            const isStart = textBefore.trim().length === 0;
            const afterPunctuationWithSpace = /[.!?]\s+$/.test(textBefore);
            if (isStart || afterPunctuationWithSpace) {
                e.preventDefault();
                document.execCommand("insertText", false, e.data.toUpperCase());
            }
        });
    }

    const observer = new MutationObserver(() => {
        const editor = document.querySelector(".cm-content[contenteditable='true']");
        if (editor) hookEditor(editor);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function updateToggleBtn() {
        if (!window.AviaMenu) return;
        window.AviaMenu.updatesubmenu({
            parent: SUBMENU_PARENT,
            id: "avia_autocap_toggle",
            text: enabled ? "Enabled" : "Disabled",
            icon: enabled ? "toggle_on" : "toggle_off"
        });
    }

    function registerMenu() {
        window.AviaMenu.submenuregister({
            id: SUBMENU_PARENT,
            name: "Auto Capitalize",
            icon: "title"
        });

        window.AviaMenu.submenu({
            parent: SUBMENU_PARENT,
            id: "avia_autocap_toggle",
            name: enabled ? "Enabled" : "Disabled",
            icon: enabled ? "toggle_on" : "toggle_off",
            onClick: () => {
                enabled = !enabled;
                saveState();
                updateToggleBtn();
            }
        });
    }

    if (window.AviaMenu) {
        registerMenu();
    } else {
        const interval = setInterval(() => {
            if (window.AviaMenu) {
                clearInterval(interval);
                registerMenu();
            }
        }, 100);
    }

})();