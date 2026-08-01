/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/Echo.js
  @VERSION: 1.0
*/

(function () {
    if (window.__ECHO__) return;
    window.__ECHO__ = true;

    function injectHideDefaultSearchStyle() {
        if (document.getElementById("avia-search-hide-default")) return;

        const css = `
@media (height <= 600px) or (width <= 840px) {
    .app_body button[data-avia-search-btn] {
        display: none;
    }
}`;

        var style = document.createElement('style');
        style.id = "avia-search-hide-default";
        style.type = 'text/css';
        if( style.styleSheet )
            style.styleSheet.cssText = css;
        else
            style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

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
        inner.style.cssText = "color: white; background-color: black; padding: var(--gap-md); border-radius: var(--borderRadius-md); line-height: 0.875rem; font-size: 0.6875rem; letter-spacing: 0.03125rem; font-weight: 500";
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
            injectHideDefaultSearchStyle();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    injectSearchButton();
    injectHideDefaultSearchStyle();
})();