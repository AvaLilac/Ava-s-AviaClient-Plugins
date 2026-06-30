(function () {
    if (window.__UNSENT_MESSAGE_TOOLBAR__) return;
    window.__UNSENT_MESSAGE_TOOLBAR__ = true;

    const TOOLBAR_ATTR = "data-avia-failed-toolbar";

    function getMessageText(msgEl) {
        return msgEl.querySelector(".wb_break-word")?.innerText?.trim() || "";
    }

    function findContextItem(text) {
        return [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim().toLowerCase() === text.toLowerCase());
    }

    function openContextMenu(msgEl) {
        return new Promise(resolve => {
            const hide = document.createElement("style");
            hide.id = "avia-ctx-hide";
            hide.textContent = ".d_flex.flex-d_column.p_var\\(--gap-md\\)_0.ov_hidden.bdr_var\\(--borderRadius-xs\\).bg_var\\(--md-sys-color-surface-container\\) { opacity: 0 !important; }";
            document.head.appendChild(hide);
            msgEl.dispatchEvent(new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                button: 2,
                buttons: 2,
                clientX: 400,
                clientY: 400
            }));
            setTimeout(resolve, 80);
        });
    }

    function closeContextMenu() {
        document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        document.getElementById("avia-ctx-hide")?.remove();
    }

    async function clickContextItem(msgEl, label) {
        await openContextMenu(msgEl);
        const item = findContextItem(label);
        if (item) {
            item.click();
        } else {
            closeContextMenu();
            return;
        }
        document.getElementById("avia-ctx-hide")?.remove();
    }

    function makeToolbarBtn(svgPath, title, onClick) {
        const wrap = document.createElement("div");
        wrap.title = title;
        wrap.className = "cursor_pointer pos_relative p_var(--gap-sm)";
        wrap.style.cssText = "display:flex;align-items:center;justify-content:center;";

        const ripple = document.createElement("md-ripple");
        ripple.setAttribute("aria-hidden", "true");
        wrap.appendChild(ripple);

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("viewBox", "0 0 24 24");

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", svgPath);
        svg.appendChild(path);
        wrap.appendChild(svg);

        wrap.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
        });

        return wrap;
    }

    function injectToolbar(msgEl) {
        const toolbar = document.createElement("div");
        toolbar.setAttribute(TOOLBAR_ATTR, "1");
        toolbar.className = "Toolbar";
        Object.assign(toolbar.style, {
            position: "absolute",
            top: "-18px",
            right: "16px",
            display: "none",
            alignItems: "center",
            overflow: "hidden",
            borderRadius: "var(--borderRadius-xs)",
            boxShadow: "0 0 3px var(--md-sys-color-shadow)",
            fill: "var(--md-sys-color-on-secondary-container)",
            background: "var(--md-sys-color-secondary-container)",
            zIndex: "10"
        });

        const retryBtn = makeToolbarBtn(
            "M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z",
            "Retry sending",
            () => clickContextItem(msgEl, "Retry sending")
        );

        const copyBtn = makeToolbarBtn(
            "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z",
            "Copy text",
            () => {
                const text = getMessageText(msgEl);
                if (text) navigator.clipboard.writeText(text).catch(() => {});
            }
        );

        const deleteBtn = makeToolbarBtn(
            "M16 9v10H8V9zm-1.5-6h-5l-1 1H5v2h14V4h-3.5zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2z",
            "Delete message",
            () => clickContextItem(msgEl, "Delete message")
        );
        deleteBtn.style.fill = "var(--md-sys-color-error)";

        toolbar.appendChild(retryBtn);
        toolbar.appendChild(copyBtn);
        toolbar.appendChild(deleteBtn);

        msgEl.style.position = "relative";
        msgEl.appendChild(toolbar);

        msgEl.addEventListener("mouseenter", () => { toolbar.style.display = "flex"; });
        msgEl.addEventListener("mouseleave", () => { toolbar.style.display = "none"; });
    }

    const injected = new WeakSet();

    function isFailedMessage(el) {
        const text = el.querySelector(".d_flex.ai_center.gap_var\\(--gap-sm\\).c_var\\(--md-sys-color-outline\\)")?.textContent;
        return !!(text?.includes("Failed to send") || text?.includes("Unsent message"));
    }

    function tryInject(el) {
        if (!el || el.nodeType !== 1) return;
        if (injected.has(el)) return;
        if (el.classList.contains("group") && el.classList.contains("pos_relative") && isFailedMessage(el)) {
            injected.add(el);
            injectToolbar(el);
            return;
        }
        el.querySelectorAll(".group.pos_relative.d_flex.flex-d_column").forEach(child => {
            if (injected.has(child)) return;
            if (isFailedMessage(child)) {
                injected.add(child);
                injectToolbar(child);
            }
        });
    }

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                tryInject(node);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll(".group.pos_relative.d_flex.flex-d_column").forEach(el => {
        if (isFailedMessage(el)) {
            injected.add(el);
            injectToolbar(el);
        }
    });
})();