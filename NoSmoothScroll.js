(function () {
    if (window.__noSmoothScroll) return;
    window.__noSmoothScroll = true;

    function killScroll(el) {
        if (!el || el.__wheelPatched) return;
        el.__wheelPatched = true;

        el.addEventListener("wheel", function (e) {
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
            el.scrollLeft += e.deltaX;
        }, { passive: false, capture: true });
    }

    function patchAll() {
        document.querySelectorAll("*").forEach(el => {
            const style = getComputedStyle(el);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;
            if (["auto", "scroll"].includes(overflowY) || ["auto", "scroll"].includes(overflowX)) {
                killScroll(el);
            }
        });
    }

    patchAll();
    new MutationObserver(patchAll).observe(document.body, { childList: true, subtree: true });
})();
