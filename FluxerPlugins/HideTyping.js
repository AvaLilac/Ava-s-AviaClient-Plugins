/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/HideTyping.js
  @VERSION: 1.0
*/

(() => {
    if (window.__HideTyping) return;
    window.__HideTyping = true;

    const STORAGE_KEY = "AviaHideTyping";
    let enabled = localStorage.getItem(STORAGE_KEY) === "true";

    const isTypingRequest = (url, method) => {
        if (method?.toUpperCase() !== "POST") return false;

        let decoded = String(url);

        for (let i = 0; i < 3; i++) {
            try {
                const next = decodeURIComponent(decoded);
                if (next === decoded) break;
                decoded = next;
            } catch {
                break;
            }
        }

        return /\/api\/v\d+\/channels\/[^/?]+\/typing(?:[?#]|$)/i.test(decoded);
    };

    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
        const url = typeof input === "string" ? input : input?.url || "";
        const method = init?.method || input?.method || "GET";

        if (enabled && isTypingRequest(url, method)) {
            return Promise.resolve(new Response(null, { status: 204 }));
        }

        return originalFetch.apply(this, arguments);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this.__aviaMethod = method;
        this.__aviaUrl = url;

        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        if (enabled && isTypingRequest(this.__aviaUrl, this.__aviaMethod)) {
            const xhr = this;

            Object.defineProperties(xhr, {
                readyState: { configurable: true, get: () => 4 },
                status: { configurable: true, get: () => 204 },
                statusText: { configurable: true, get: () => "No Content" },
                response: { configurable: true, get: () => null },
                responseText: { configurable: true, get: () => "" },
                responseURL: { configurable: true, get: () => String(xhr.__aviaUrl) }
            });

            queueMicrotask(() => {
                xhr.dispatchEvent(new Event("readystatechange"));
                xhr.dispatchEvent(new ProgressEvent("load"));
                xhr.dispatchEvent(new ProgressEvent("loadend"));
            });

            return;
        }

        return originalSend.apply(this, arguments);
    };

    const update = () => {
        window.AviaToolbar.update({
            id: "hide_typing",
            name: enabled ? "Typing Indicator Disabled" : "Typing Indicator Enabled",
            icon: enabled ? "x_circle" : "check_circle"
        });
    };

    window.AviaToolbar.register({
        id: "hide_typing",
        name: enabled ? "Typing Indicator Disabled" : "Typing Indicator Enabled",
        icon: enabled ? "x_circle" : "check_circle",
        onClick: () => {
            enabled = !enabled;
            localStorage.setItem(STORAGE_KEY, String(enabled));
            update();
        }
    });
})();