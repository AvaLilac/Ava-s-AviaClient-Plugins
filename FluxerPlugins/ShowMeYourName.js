/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/ShowMeYourName.js
  @VERSION: 1.0
*/

(function() {
    if (window.__SHOWMEYOURNAME__) return;
    window.__SHOWMEYOURNAME__ = true;

    const originalParse = JSON.parse;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const MESSAGE_SELECTOR = '[data-flx="channel.message.article.alt-click"]';
    const USERNAME_SELECTOR = '[data-flx="channel.message-username.context-menu-underline.key-down"]';
    const LABEL_CLASS = "avia-username-label";

    function processMessage(element) {
        if (!element?.matches?.(MESSAGE_SELECTOR)) return;

        const nickname = element.getAttribute("data-flx-author-name");
        const username = element.getAttribute("data-flx-author-username");

        if (!nickname || !username || nickname === username) return;

        let usernameElement = element.querySelector(USERNAME_SELECTOR);

        if (!usernameElement) {
            const author = element.querySelector('[data-flx="channel.user-message.message-author-name"]');

            if (author?.matches?.("[data-user-id]")) {
                usernameElement = author;
            } else {
                usernameElement = author?.querySelector("[data-user-id]");
            }
        }

        if (!usernameElement) return;

        let label = usernameElement.querySelector(`.${LABEL_CLASS}`);

        if (!label) {
            label = document.createElement("span");
            label.className = LABEL_CLASS;
            usernameElement.appendChild(label);
        }

        const display = ` (${username})`;

        if (label.textContent !== display) {
            label.textContent = display;
        }
    }

    function scanMessages() {
        document.querySelectorAll(MESSAGE_SELECTOR).forEach(processMessage);
    }

    function scheduleRouteScan() {
        requestAnimationFrame(() => {
            requestAnimationFrame(scanMessages);
        });

        setTimeout(scanMessages, 300);
        setTimeout(scanMessages, 1000);
    }

    function findMessage(message) {
        if (!message?.id || !message?.channel_id) return;

        const elementId = `chat-messages-${message.channel_id}-${message.id}`;
        let attempts = 0;

        function locate() {
            let element = document.getElementById(elementId);

            if (!element) {
                element = document.querySelector(
                    `${MESSAGE_SELECTOR}[id$="-${message.id}"]`
                );
            }

            if (element) {
                processMessage(element);
                return;
            }

            if (++attempts < 120) {
                requestAnimationFrame(locate);
            }
        }

        requestAnimationFrame(locate);
    }

    function hookedParse(...args) {
        const result = originalParse.apply(this, args);

        try {
            if (result?.op === 0 && result?.t === "MESSAGE_CREATE") {
                findMessage(result.d);
            }
        } catch (error) {}

        return result;
    }

    function hookedPushState(...args) {
        const result = originalPushState.apply(this, args);
        scheduleRouteScan();
        return result;
    }

    function hookedReplaceState(...args) {
        const result = originalReplaceState.apply(this, args);
        scheduleRouteScan();
        return result;
    }

    function onPopState() {
        scheduleRouteScan();
    }

    JSON.parse = hookedParse;
    history.pushState = hookedPushState;
    history.replaceState = hookedReplaceState;
    window.addEventListener("popstate", onPopState);

    scanMessages();
})();