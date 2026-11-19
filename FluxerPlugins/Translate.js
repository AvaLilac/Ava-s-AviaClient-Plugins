/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/Translate.js
  @VERSION: 1.1
*/

(function() {
    if (window.__AVIA_TRANSLATE__) return;
    window.__AVIA_TRANSLATE__ = true;

    const STORAGE_LANG = "avia_translate";

    const savedLang = localStorage.getItem(STORAGE_LANG);
    let TARGET_LANG = savedLang === null ? "" : savedLang;

    const originalFetch = window.fetch.bind(window);

    const languages = {
        af: "Afrikaans",
        ar: "Arabic",
        bn: "Bengali",
        bg: "Bulgarian",
        zh: "Chinese",
        hr: "Croatian",
        cs: "Czech",
        da: "Danish",
        nl: "Dutch",
        en: "English",
        fi: "Finnish",
        fr: "French",
        de: "German",
        el: "Greek",
        he: "Hebrew",
        hi: "Hindi",
        hu: "Hungarian",
        id: "Indonesian",
        it: "Italian",
        ja: "Japanese",
        ko: "Korean",
        no: "Norwegian",
        pl: "Polish",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        es: "Spanish",
        sv: "Swedish",
        th: "Thai",
        tr: "Turkish",
        uk: "Ukrainian",
        vi: "Vietnamese"
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
            return {
                translated,
                detectedLang
            };
        } catch {
            return null;
        }
    }

    const MODAL_HOST_ID = "avia-translate-modal-host";
    const MODAL_CLOSE_MS = 150;

    const MODAL_CSS = `
    * {
        box-sizing: border-box;
    }

    .overlay {
        position: absolute;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(0, 0, 0, 0.65);
        pointer-events: auto;
        font-family: Arial, Helvetica, sans-serif;
        color: #f2f3f5;
    }

    .modal {
        width: 100%;
        max-width: 440px;
        max-height: calc(100% - 48px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #23252a;
        color: #f2f3f5;
        border: 1px solid #ffffff12;
        border-radius: 12px;
        box-shadow: 0 10px 30px #00000060;
    }

    .overlay.closing {
        pointer-events: none;
        animation: fade-out ${MODAL_CLOSE_MS}ms ease-in forwards;
    }

    .overlay.closing .modal {
        animation: modal-out ${MODAL_CLOSE_MS}ms ease-in forwards;
    }

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 20px 24px 0;
    }

    .title {
        margin: 0;
        color: #f2f3f5;
        font-size: 20px;
        font-weight: 700;
        line-height: 1.25;
    }

    .close {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #949ba4;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
    }

    .close:hover {
        background: #ffffff12;
        color: #ffffff;
    }

    .description {
        margin: 8px 24px 20px;
        color: #b5bac1;
        font-size: 14px;
        line-height: 1.4;
    }

    .body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0 24px 24px;
        overflow-y: auto;
        min-height: 0;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .label {
        color: #f2f3f5;
        font-size: 14px;
        font-weight: 600;
    }

    .input {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid #ffffff20;
        border-radius: 6px;
        outline: none;
        background: #1e1f22;
        color: #f2f3f5;
        font-family: inherit;
        font-size: 14px;
        transition: border-color 120ms ease;
    }

    .input::placeholder {
        color: #949ba4;
    }

    .input:focus {
        border-color: #5865f2;
    }

    .empty {
        display: none;
        color: #b5bac1;
        font-size: 14px;
        line-height: 1.4;
    }

    .empty.visible {
        display: block;
    }

    .footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px 24px;
        background: #292b30;
    }

    .button {
        min-height: 38px;
        min-width: 80px;
        padding: 0 16px;
        border: 0;
        border-radius: 6px;
        color: #ffffff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 120ms ease, opacity 120ms ease;
    }

    .button.primary {
        background: #5865f2;
    }

    .button.primary:hover {
        background: #4752c4;
    }

    .switch-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 320px;
        overflow-y: auto;
        padding-right: 4px;
    }

    .item {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        padding: 10px 12px;
        border: 1px solid #ffffff20;
        border-radius: 6px;
        background: #1e1f22;
    }

    .item[hidden] {
        display: none;
    }

    .item-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        min-width: 0;
    }

    .item-label {
        flex: 1;
        min-width: 0;
        color: #f2f3f5;
        font-size: 14px;
        font-weight: 500;
        text-align: left;
        user-select: none;
    }

    .label-text {
        overflow-wrap: anywhere;
    }

    .switch-container {
        display: flex;
        flex-shrink: 0;
        align-items: center;
    }

    .switch {
        position: relative;
        flex-shrink: 0;
        width: 42px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 12px;
        background: #4e5058;
        cursor: pointer;
        transition: background 120ms ease;
    }

    .switch[data-state="checked"] {
        background: #5865f2;
    }

    .switch:focus-visible {
        outline: 2px solid #949cf7;
        outline-offset: 2px;
    }

    .switch-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #ffffff;
        color: #4e5058;
        transition: transform 120ms ease, color 120ms ease;
    }

    .switch-thumb[data-state="checked"] {
        transform: translateX(18px);
        color: #5865f2;
    }

    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes modal-out {
        from {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .switch,
        .switch-thumb {
            transition: none;
        }
    }

    @media (max-width: 480px) {
        .overlay {
            padding: 16px;
        }

        .header {
            padding: 18px 18px 0;
        }

        .description {
            margin: 8px 18px 18px;
        }

        .body {
            padding: 0 18px 20px;
        }

        .footer {
            padding: 14px 18px;
        }
    }
`;

    const SWITCH_ICON_UNCHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path></svg>`;
    const SWITCH_ICON_CHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"></path></svg>`;

    let switchCounter = 0;

    function createSwitchItem({
        label,
        checked = false,
        onToggle = () => {}
    }) {
        const uid = `avia-translate-switch-${++switchCounter}`;

        const item = document.createElement("div");
        item.className = "item";

        const content = document.createElement("div");
        content.className = "item-content";

        const labelEl = document.createElement("div");
        labelEl.className = "item-label";

        const labelText = document.createElement("span");
        labelText.className = "label-text";
        labelText.id = `${uid}-label`;
        labelText.textContent = label;
        labelEl.appendChild(labelText);

        const container = document.createElement("div");
        container.className = "switch-container";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "switch";
        button.setAttribute("role", "switch");
        button.value = "on";
        button.id = `${uid}-switch`;
        button.setAttribute("aria-labelledby", labelText.id);

        const thumb = document.createElement("span");
        thumb.className = "switch-thumb";
        button.appendChild(thumb);
        container.appendChild(button);

        function setChecked(value) {
            checked = !!value;
            const state = checked ? "checked" : "unchecked";
            button.setAttribute("aria-checked", String(checked));
            button.setAttribute("data-state", state);
            thumb.setAttribute("data-state", state);
            thumb.innerHTML = checked ? SWITCH_ICON_CHECKED : SWITCH_ICON_UNCHECKED;
        }

        setChecked(checked);

        button.addEventListener("click", () => onToggle(!checked));

        content.appendChild(labelEl);
        content.appendChild(container);
        item.appendChild(content);

        return {
            item,
            button,
            setChecked,
            isChecked: () => checked
        };
    }

    function closeTranslateModal() {
        const host = document.getElementById(MODAL_HOST_ID);
        if (!host) return;

        if (host.dataset.closing === "true") return;
        host.dataset.closing = "true";

        const overlay = host.shadowRoot?.querySelector(".overlay");
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        if (!overlay || reduceMotion) {
            host.remove();
            return;
        }

        overlay.classList.add("closing");
        setTimeout(() => host.remove(), MODAL_CLOSE_MS);
    }

    function openTranslateModal() {
        if (document.getElementById(MODAL_HOST_ID)) {
            closeTranslateModal();
            return;
        }

        const titlebar = document.querySelector('[data-flx="app.native-titlebar.titlebar"]') || document.querySelector("[data-native-titlebar]");
        const titlebarHeight = titlebar?.getBoundingClientRect().height || 0;

        const host = document.createElement("div");
        host.id = MODAL_HOST_ID;
        Object.assign(host.style, {
            position: "fixed",
            top: `${titlebarHeight}px`,
            right: "0",
            bottom: "0",
            left: "0",
            zIndex: "100000",
            pointerEvents: "none"
        });

        const shadow = host.attachShadow({
            mode: "open"
        });

        const style = document.createElement("style");
        style.textContent = MODAL_CSS;
        shadow.appendChild(style);

        const overlay = document.createElement("div");
        overlay.className = "overlay";

        const modal = document.createElement("div");
        modal.className = "modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "avia-translate-modal-title");

        const header = document.createElement("div");
        header.className = "header";

        const title = document.createElement("h2");
        title.className = "title";
        title.id = "avia-translate-modal-title";
        title.textContent = "Avia Translate";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "close";
        closeButton.setAttribute("aria-label", "Close");
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24px" width="24px" fill="#e3e3e3"><path d="M6.4,19L5,17.6L10.6,12L5,6.4L6.4,5L12,10.6L17.6,5L19,6.4L13.4,12L19,17.6L17.6,19L12,13.4L6.4,19Z"/></svg>`;

        const description = document.createElement("p");
        description.className = "description";
        description.textContent = "Choose the language that messages are translated into.";

        const body = document.createElement("div");
        body.className = "body";

        const footer = document.createElement("div");
        footer.className = "footer";

        header.appendChild(title);
        header.appendChild(closeButton);
        modal.appendChild(header);
        modal.appendChild(description);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        shadow.appendChild(overlay);

        const searchField = document.createElement("div");
        searchField.className = "field";

        const searchLabel = document.createElement("div");
        searchLabel.className = "label";
        searchLabel.textContent = "Language";

        const search = document.createElement("input");
        search.id = "avia-translate-search";
        search.setAttribute("aria-label", "Language");
        search.className = "input";
        search.type = "text";
        search.placeholder = "Search language...";
        search.autocomplete = "off";
        search.spellcheck = false;

        searchField.appendChild(searchLabel);
        searchField.appendChild(search);

        const group = document.createElement("div");
        group.className = "switch-group";

        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No languages found.";

        const entries = Object.entries(languages)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => {
                const sw = createSwitchItem({
                    label: name,
                    checked: code === TARGET_LANG,
                    onToggle: (wanted) => {
                        TARGET_LANG = wanted ? code : "";
                        localStorage.setItem(STORAGE_LANG, TARGET_LANG);
                        entries.forEach(entry => entry.sw.setChecked(entry.code === TARGET_LANG));
                    }
                });
                group.appendChild(sw.item);
                return {
                    code,
                    name,
                    sw
                };
            });

        search.addEventListener("input", () => {
            const q = search.value.trim().toLowerCase();
            let visible = 0;
            entries.forEach(entry => {
                const match = !q || entry.name.toLowerCase().includes(q);
                entry.sw.item.hidden = !match;
                if (match) visible++;
            });
            empty.classList.toggle("visible", visible === 0);
        });

        search.addEventListener("paste", (e) => {
            if (!e.defaultPrevented) return;
            const text = (e.clipboardData?.getData("text/plain") || "").replace(/[\r\n]+/g, " ").trim();
            if (!text) return;
            const start = search.selectionStart ?? search.value.length;
            const end = search.selectionEnd ?? search.value.length;
            search.setRangeText(text, start, end, "end");
            search.dispatchEvent(new Event("input", {
                bubbles: true
            }));
        });

        body.appendChild(searchField);
        body.appendChild(group);
        body.appendChild(empty);

        const doneButton = document.createElement("button");
        doneButton.type = "button";
        doneButton.className = "button primary";
        doneButton.textContent = "Done";
        doneButton.addEventListener("click", closeTranslateModal);
        footer.appendChild(doneButton);

        closeButton.addEventListener("click", closeTranslateModal);

        overlay.addEventListener("mousedown", (event) => {
            if (event.target === overlay) closeTranslateModal();
        });

        host.addEventListener("keydown", (event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
                event.preventDefault();
                closeTranslateModal();
            }
        });

        ["paste", "copy", "cut", "keyup", "keypress"].forEach((type) => {
            host.addEventListener(type, (event) => event.stopPropagation());
        });

        document.body.appendChild(host);
        search.focus();
    }

    const TOOLBAR_ID = "avia_translate";

    function registerToolbarButton() {
        window.AviaToolbar.register({
            id: TOOLBAR_ID,
            name: "Translate",
            icon: "translate",
            onClick: () => openTranslateModal()
        });
    }

    if (window.AviaToolbar?.register) {
        registerToolbarButton();
    } else {
        const wait = setInterval(() => {
            if (window.AviaToolbar?.register) {
                clearInterval(wait);
                registerToolbarButton();
            }
        }, 250);
        setTimeout(() => clearInterval(wait), 15000);
    }

    const TT_CHILD_STYLE = `
  --tooltip-active-surface: var(--tooltip-surface);
  --tooltip-active-border-color: var(--tooltip-border-color);
  transform-origin: 50% 100%;
  --tooltip-surface: var(--settings-surface-background,var(--form-surface-background));
  --tooltip-border-width: .0625rem;
  --tooltip-border-color: var(--settings-border-color,var(--background-modifier-accent));
  --tooltip-shadow: 0 .5rem 1rem rgba(0,0,0,.22);
  --tooltip-pointer-surface: var(--tooltip-active-surface);
  --tooltip-pointer-border: var(--tooltip-active-border-color);
  --tooltip-pointer-size: .625rem;
  --tooltip-pointer-half-size: calc(var(--tooltip-pointer-size) / 2);
  z-index: var(--z-index-tooltip);
  pointer-events: none;
  box-sizing: border-box;
  border: var(--tooltip-border-width) solid var(--tooltip-active-border-color);
  background: var(--tooltip-active-surface);
  color: var(--text-primary);
  word-wrap: break-word;
  box-shadow: var(--tooltip-shadow);
  border-radius: .5rem;
  font-size: .8125rem;
  font-weight: 500;
  line-height: 1.125rem;
  position: relative;
  max-width: 21.875rem;
`;

    const TT_POINTER_1_STYLE = `
  -webkit-clip-path: polygon(100% 0,100% 100%,0 100%);
  clip-path: polygon(100% 0,100% 100%,0 100%);
  box-sizing: border-box;
  width: var(--tooltip-pointer-size);
  height: var(--tooltip-pointer-size);
  background: var(--tooltip-pointer-border);
  border: 0;
  display: block;
  transform: rotate(45deg);
  top: calc(100% - var(--tooltip-pointer-half-size));
  margin-left: calc(-1 * var(--tooltip-pointer-half-size));
  position: absolute;
  left: 50%;
  pointer-events: none;
`;

    const TT_POINTER_2_STYLE = `
  top: calc(100% - var(--tooltip-pointer-half-size));
  margin-left: calc(-1 * var(--tooltip-pointer-half-size));
  position: absolute;
  left: 50%;
  pointer-events: none;
`;

    const TT_CONTENT_STYLE = `
  white-space: normal;
  word-break: break-word;
  text-align: center;
  padding: .4375rem .625rem;
  overflow: hidden;
`;

    const TT_ROOT_ID = "avia-translate-tooltip-root";
    let ttAnchor = null;
    let ttWatch = null;

    function hideTooltip() {
        if (ttWatch) {
            clearInterval(ttWatch);
            ttWatch = null;
        }
        ttAnchor = null;
        document.getElementById(TT_ROOT_ID)?.remove();
    }

    function showTooltip(text, anchor) {
        hideTooltip();

        const root = document.createElement("div");
        root.id = TT_ROOT_ID;
        root.style.cssText = `
        pointer-events: none;
        z-index: var(--z-index-tooltip);
        background: 0 0;
        position: fixed;
        top: 0; bottom: 0; left: 0; right: 0;
    `;

        root.innerHTML = `
      <div data-floating-ui-portal="">
        <div role="tooltip" data-avia-tooltip="true" style="position: fixed; left: 0px; top: 0px; z-index: var(--z-index-tooltip); visibility: hidden; opacity: 1; transform: none;">
          <div style="${TT_CHILD_STYLE}">
            <div data-avia-tt="p1" style="${TT_POINTER_1_STYLE}"></div>
            <div data-avia-tt="p2" style="${TT_POINTER_2_STYLE}"></div>
            <div data-avia-tt="content" style="${TT_CONTENT_STYLE}"></div>
          </div>
        </div>
      </div>
    `;

        root.querySelector('[data-avia-tt="content"]').textContent = text;
        document.body.appendChild(root);

        const tooltip = root.querySelector('[data-avia-tooltip]');
        const p1 = root.querySelector('[data-avia-tt="p1"]');
        const p2 = root.querySelector('[data-avia-tt="p2"]');

        const rect = anchor.getBoundingClientRect();
        const w = tooltip.offsetWidth;
        const h = tooltip.offsetHeight;

        const left = Math.max(8, Math.min(
            rect.left + rect.width / 2 - w / 2,
            window.innerWidth - w - 8
        ));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.top - h - 8}px`;
        tooltip.style.visibility = "visible";

        const pointerLeft = rect.left + rect.width / 2 - left;
        p1.style.left = `${pointerLeft}px`;
        p2.style.left = `${pointerLeft}px`;

        ttAnchor = anchor;
        ttWatch = setInterval(() => {
            const r = ttAnchor?.getBoundingClientRect();
            if (!ttAnchor || !ttAnchor.isConnected || !r || (r.width === 0 && r.height === 0)) {
                hideTooltip();
            }
        }, 150);
    }

    window.addEventListener("blur", hideTooltip);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") hideTooltip();
    });

    const SEL_ACTION_BAR = '[data-flx="channel.message-action-bar.message-action-bar-core.action-bar"]';
    const SEL_MESSAGE = '[role="article"][data-message-id]';
    const SEL_MSG_TEXT = '[data-search-highlight-scope="message"]';
    const SEL_BAR_ITEM = '[class*="ActionToolbar.module__item"]';

    const TRANSLATE_TOOLTIP_TEXT = "Translate Message";

    const TRANSLATE_ICON_PATH = "M11.9,22l4.55-12h2.1L23.1,22H21l-1.07-3.05H15.08L14,22H11.9ZM4,19L2.6,17.6l5.05-5.05q-0.88-0.88-1.59-2T4.75,8h2.1q0.5 0.97 1 1.7t1.2 1.45q0.82-0.82 1.71-2.31T12.1,6H1V4H8V2h2V4h7V6H14.1q-0.53,1.8-1.58,3.7t-2.07,2.9l2.4,2.45L12.1,17.1L9.05,13.98L4,19Zm11.7-1.8h3.6l-1.8-5.1l-1.8,5.1Z";

    function getMessageText(message) {
        const markup = message.querySelector(SEL_MSG_TEXT);
        if (!markup) return {
            markup: null,
            text: ""
        };

        const text = (markup.getAttribute("data-message-copy-text") || markup.innerText || "").trim();
        return {
            markup,
            text
        };
    }

    function insertTranslationBlock(markup, text) {
        const block = document.createElement("div");
        block.className = "avia-inline-translation";
        block.textContent = text;
        Object.assign(block.style, {
            marginTop: "6px",
            padding: "8px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.06)",
            fontSize: "13px",
            userSelect: "text"
        });
        markup.insertAdjacentElement("afterend", block);
    }

    async function onTranslateClick(btn, bar, e) {
        e.stopPropagation();
        e.preventDefault();
        hideTooltip();

        const message = bar.closest(SEL_MESSAGE);
        if (!message) return;

        const existing = message.querySelector(".avia-inline-translation");
        if (existing) {
            existing.remove();
            return;
        }

        const {
            markup,
            text
        } = getMessageText(message);
        if (!markup || !text) return;

        if (!TARGET_LANG) {
            insertTranslationBlock(markup, "No language selected. Turn one on in Avia Translate.");
            return;
        }

        btn.style.opacity = "0.4";
        const result = await translateWithDetect(text, TARGET_LANG);
        btn.style.opacity = "1";

        if (!result) return;

        if (message.querySelector(".avia-inline-translation")) return;

        let detectedCode = (result.detectedLang || "").toLowerCase();
        if (detectedCode.includes("-")) detectedCode = detectedCode.split("-")[0];
        const detectedName = languages[detectedCode] || detectedCode || "Unknown";

        insertTranslationBlock(markup, result.translated + " - Translated from " + detectedName);
    }

    function injectToolbarTranslate() {
        if (ttAnchor && !ttAnchor.isConnected) hideTooltip();

        document.querySelectorAll(SEL_ACTION_BAR).forEach(bar => {

            if (bar.querySelector("[data-avia-translate]")) return;

            const refBtn =
                bar.querySelector('button[aria-label="Forward"]') ||
                bar.querySelector('button[aria-label="Create thread"]') ||
                bar.querySelector(`button${SEL_BAR_ITEM}:not([aria-label^="React with"])`);
            if (!refBtn) return;

            const btn = refBtn.cloneNode(true);
            btn.setAttribute("data-avia-translate", "true");
            btn.setAttribute("aria-label", TRANSLATE_TOOLTIP_TEXT);
            btn.removeAttribute("data-action");
            btn.removeAttribute("data-flx");

            const svg = btn.querySelector("svg");
            if (svg) {
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.removeAttribute("class");
                svg.innerHTML = `<path d="${TRANSLATE_ICON_PATH}"></path>`;
            }

            btn.addEventListener("click", (e) => onTranslateClick(btn, bar, e));
            btn.addEventListener("mouseenter", () => showTooltip(TRANSLATE_TOOLTIP_TEXT, btn));
            btn.addEventListener("mouseleave", hideTooltip);


            const moreBtn = bar.querySelector('button[aria-label="More"]');
            if (moreBtn) bar.insertBefore(btn, moreBtn);
            else bar.appendChild(btn);
        });
    }

    let injectScheduled = false;

    function scheduleInject() {
        if (injectScheduled) return;
        injectScheduled = true;
        requestAnimationFrame(() => {
            injectScheduled = false;
            injectToolbarTranslate();
        });
    }

    new MutationObserver(scheduleInject)
        .observe(document.body, {
            childList: true,
            subtree: true
        });

    injectToolbarTranslate();

})();