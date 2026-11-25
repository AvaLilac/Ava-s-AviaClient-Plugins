/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/AutoCapitalize.js
  @VERSION: 1.0
*/

(function () {
    if (window.__AUTO_CAPITALIZE__) return;
    window.__AUTO_CAPITALIZE__ = true;
    
    const STORAGE_KEY = "avia_autocap_enabled";
    const SUBMENU_PARENT = "avia_autocap";
    const EDITOR_SELECTOR = '[data-flx="lexical.composer.lexical-composer-input.composer-inner.editable"][contenteditable="true"]';

    let enabled = localStorage.getItem(STORAGE_KEY) !== "false";

    function shouldCapitalize(editor) {
        const selection = window.getSelection();

        if (!selection || !selection.rangeCount) return false;

        const range = selection.getRangeAt(0);

        if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return false;

        const selectedText = selection.toString();
        const editorText = editor.innerText.replace(/\n/g, "");

        const isEntireMessageSelected =
            selectedText.length > 0 &&
            selectedText.trim() === editorText.trim();

        if (isEntireMessageSelected) return true;

        if (!selection.isCollapsed) return false;

        const node = range.startContainer;
        const offset = range.startOffset;

        let textBefore = "";

        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        let current;

        while ((current = walker.nextNode())) {
            if (current === node) {
                textBefore += current.textContent.slice(0, offset);
                break;
            }

            textBefore += current.textContent;
        }

        return textBefore.trim().length === 0 || /[.!?]\s+$/.test(textBefore);
    }

    document.addEventListener("beforeinput", event => {
        if (!enabled || !event.cancelable) return;
        if (event.inputType !== "insertText") return;
        if (!event.data || !/[a-z]/i.test(event.data[0])) return;

        const editor = event.target?.closest?.(EDITOR_SELECTOR);

        if (!editor || !shouldCapitalize(editor)) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const text = event.data;
        document.execCommand(
            "insertText",
            false,
            text[0].toUpperCase() + text.slice(1)
        );
    }, true);

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
                localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
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