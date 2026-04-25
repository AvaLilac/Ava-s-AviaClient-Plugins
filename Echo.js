(function () {
    if (window.__ECHO__) return;
    window.__ECHO__ = true;

    function injectHideStyle() {
        if (document.getElementById("avia-search-hide")) return;
        const style = document.createElement("style");
        style.id = "avia-search-hide";
        style.textContent = `input[placeholder="Search messages..."] { display: none !important; }`;
        document.head.appendChild(style);
    }

    function removeHideStyle() {
        document.getElementById("avia-search-hide")?.remove();
    }

    injectHideStyle();

    function findSearchInput() {
        return document.querySelector('input[placeholder="Search messages..."]');
    }

    function findPinButton() {
        return document.querySelector('button[aria-label="View pinned messages"]');
    }

    function findInjectedBtn() {
        return document.querySelector("[data-avia-search-btn]");
    }

    let searchTooltip = null;

    function showTooltip(btn) {
        if (searchTooltip) return;
        searchTooltip = document.createElement("div");
        searchTooltip.style.cssText = "position:fixed;z-index:999;pointer-events:none;";
        const inner = document.createElement("div");
        inner.className = "c_white bg_black p_var(--gap-md) bdr_var(--borderRadius-md) lh_0.875rem fs_0.6875rem ls_0.03125rem fw_500";
        inner.textContent = "Search";
        searchTooltip.appendChild(inner);
        document.body.appendChild(searchTooltip);

        requestAnimationFrame(() => {
            const rect = btn.getBoundingClientRect();
            const tw = searchTooltip.getBoundingClientRect().width;
            searchTooltip.style.left = (rect.left + rect.width / 2 - tw / 2) + "px";
            searchTooltip.style.top = (rect.bottom + 6) + "px";
        });
    }

    function hideTooltip() {
        if (searchTooltip) {
            searchTooltip.remove();
            searchTooltip = null;
        }
    }

    function injectSearchButton() {
        if (findInjectedBtn()) return;

        const searchInput = findSearchInput();
        const pinBtn = findPinButton();
        if (!searchInput || !pinBtn) return;

        const btn = pinBtn.cloneNode(false);
        btn.setAttribute("data-avia-search-btn", "true");
        btn.setAttribute("aria-label", "Search messages");

        const ripple = document.createElement("md-ripple");
        ripple.setAttribute("aria-hidden", "true");
        btn.appendChild(ripple);

        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.style.cssText = "display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:24px;";
        icon.textContent = "search";
        btn.appendChild(icon);

        let isOpen = false;

        btn.addEventListener("mouseenter", () => showTooltip(btn));
        btn.addEventListener("mouseleave", hideTooltip);

        btn.addEventListener("click", () => {
            hideTooltip();
            isOpen = !isOpen;

            if (isOpen) {
                removeHideStyle();
                icon.style.fontVariationSettings = "'FILL' 1,'wght' 400,'GRAD' 0";
                requestAnimationFrame(() => findSearchInput()?.focus());
            } else {
                injectHideStyle();
                icon.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
                const input = findSearchInput();
                if (input) {
                    input.value = "";
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                }
            }
        });

        searchInput.insertAdjacentElement("beforebegin", btn);
    }

    const observer = new MutationObserver(() => {
        if (!findInjectedBtn()) {
            injectHideStyle();
            injectSearchButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    injectSearchButton();
})();