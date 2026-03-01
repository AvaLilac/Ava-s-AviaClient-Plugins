(function () {

    if (window.__AVIA_DEVTOOLS_BUILTIN__) return;
    window.__AVIA_DEVTOOLS_BUILTIN__ = true;

    console.log("[Avia] Built-in DevTools Plugin Loaded");

    function triggerDevTools() {
        window.dispatchEvent(new KeyboardEvent("keydown", {
            key: "I",
            code: "KeyI",
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        }));
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

        if (document.getElementById("avia-devtools-button")) return;

        const newBtn = appearanceBtn.cloneNode(true);
        newBtn.id = "avia-devtools-button";

        const textNode = Array.from(newBtn.querySelectorAll("div"))
            .find(d => d.children.length === 0);

        if (textNode) textNode.textContent = "(Avia) DevTools";

        setIcon(newBtn);

        newBtn.addEventListener("click", triggerDevTools);

        appearanceBtn.parentElement.insertBefore(newBtn, appearanceBtn.nextSibling);
    }

    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            triggerDevTools();
        }
    });

    const observer = new MutationObserver(() => injectButton());
    observer.observe(document.body, { childList: true, subtree: true });

    injectButton();

})();
