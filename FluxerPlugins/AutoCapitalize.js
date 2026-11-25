/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/AutoCapitalize.js
  @VERSION: 1.1
*/

(function () {
    if (window.__AUTO_CAPITALIZE__) return;
    window.__AUTO_CAPITALIZE__ = true;
    const STORAGE_KEY = "avia_autocap_enabled";
    const SUBMENU_PARENT = "avia_autocap";
    const MESSAGE_ENDPOINT = /\/api\/v\d+\/channels\/\d+\/messages(?:[?#]|$)/;

    let enabled = localStorage.getItem(STORAGE_KEY) !== "false";

    function saveState() {
        localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    }

    function isMessageRequest(url) {
        let value = String(url);

        for (let i = 0; i < 3; i++) {
            if (MESSAGE_ENDPOINT.test(value)) return true;

            try {
                value = decodeURIComponent(value);
            } catch {
                break;
            }
        }

        return MESSAGE_ENDPOINT.test(value);
    }

    function capitalizeContent(content) {
        if (typeof content !== "string" || !content) return content;

        return content.replace(
            /(^[ \t]*|[.!?]\s+|\n[ \t]*)([a-z])/g,
            (match, prefix, character) => prefix + character.toUpperCase()
        );
    }

    function modifyBody(body) {
        if (typeof body !== "string") return body;

        try {
            const payload = JSON.parse(body);

            if (typeof payload.content !== "string") return body;

            const original = payload.content;
            payload.content = capitalizeContent(original);

            if (payload.content !== original) {
                return JSON.stringify(payload);
            }
        } catch (error) {
            console.error("[Auto Capitalize] Failed to modify message:", error);
        }

        return body;
    }

    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
        if (!enabled) {
            return originalFetch.apply(this, arguments);
        }

        try {
            const url = input instanceof Request ? input.url : input;

            if (isMessageRequest(url)) {
                if (init && typeof init.body === "string") {
                    init = {
                        ...init,
                        body: modifyBody(init.body)
                    };
                } else if (input instanceof Request && (!init || init.body === undefined)) {
                    const request = new Request(input, init);
                    const body = await request.clone().text();
                    const modifiedBody = modifyBody(body);

                    if (modifiedBody !== body) {
                        input = new Request(request, {
                            body: modifiedBody
                        });
                        init = undefined;
                    }
                }
            }
        } catch (error) {
            console.error("[Auto Capitalize] Fetch interception failed:", error);
        }

        return originalFetch.call(this, input, init);
    };

    const xhr = XMLHttpRequest.prototype;
    const originalOpen = xhr.open;
    const originalSend = xhr.send;

    xhr.open = function (method, url, ...args) {
        this.__autoCapUrl = String(url);
        return originalOpen.call(this, method, url, ...args);
    };

    xhr.send = function (body) {
        if (enabled && isMessageRequest(this.__autoCapUrl)) {
            body = modifyBody(body);
        }

        return originalSend.call(this, body);
    };

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