(function () {
    function isBlockedElement(node) {
        if (!(node instanceof HTMLElement)) return false;

        if (node.tagName !== "DIV") return false;

        const ripple = node.querySelector(":scope > md-ripple");
        const path = node.querySelector(":scope > svg > path");

        if (!ripple || !path) return false;

        const d = path.getAttribute("d");
        if (d !== "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z") return false;

        const text = node.textContent?.trim().toLowerCase();
        if (!text) return false;

        if (!text.endsWith("blocked message") && !text.endsWith("blocked messages")) return false;

        return true;
    }

    function removeBlocked(root = document) {
        const nodes = root.querySelectorAll("div");

        for (const node of nodes) {
            if (isBlockedElement(node)) {
                node.remove();
            }
        }
    }

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (isBlockedElement(node)) {
                    node.remove();
                } else if (node.querySelectorAll) {
                    removeBlocked(node);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    removeBlocked();
})();
