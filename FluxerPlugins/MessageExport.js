/*
  @UPDATEURL: https://codeberg.org/AvaLilac/Ava-s-AviaClient-Plugins/raw/branch/main/FluxerPlugins/MessageExport.js
  @VERSION: 1.0
*/

(function() {
    if (window.__MESSAGE_EXPORT__) return;
    window.__MESSAGE_EXPORT__ = true;

    const ACTION_MENU_ID = "avia_message_export";
    const TOOLTIP_TEXT = "Export Message";
    const ICON_VIEWBOX = "0 0 24 24";
    const EXPORT_ICON_PATH = "M12,12ZM5.05,22.38l-1.4-1.43L6.6,18H4.35V16H10v5.65H8V19.43L5.05,22.38ZM12,22V20h6V9H13V4H6V14H4V4Q4,3.17 4.59,2.59T6,2h8l6,6V20q0,0.82-0.59,1.41T18,22H12Z";

    function getApiBase() {
        const activeAccountKey = localStorage.getItem("fluxer:auth:active-account-key");

        if (!activeAccountKey) {
            throw new Error("Could not find the active Fluxer account.");
        }

        const separator = activeAccountKey.lastIndexOf("::");

        if (separator === -1) {
            throw new Error("Invalid active account configuration.");
        }

        const apiBase = activeAccountKey.slice(0, separator).trim();

        if (!/^https?:\/\/.+\/api\/?$/i.test(apiBase)) {
            throw new Error("Invalid Fluxer API address.");
        }

        return apiBase.replace(/\/+$/, "");
    }

    function getMessageInfo(messageId) {
        const elements = document.querySelectorAll("[data-message-id]");

        for (const element of elements) {
            if (element.dataset.messageId === String(messageId)) {
                const channelId =
                    element.dataset.channelId ||
                    element.dataset.flxChannelId;

                if (channelId) {
                    return {
                        channelId
                    };
                }
            }
        }

        return null;
    }

    async function downloadMessage(messageId) {
        try {
            const messageInfo = getMessageInfo(messageId);

            if (!messageInfo) {
                throw new Error("Could not find the message in the current channel.");
            }

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("Could not find your Fluxer auth token. Which is required to fetch the Message Via the Fluxer API");
            }

            const apiBase = getApiBase();
            const endpoint =
                `/v1/channels/${messageInfo.channelId}/messages/${messageId}`;

            const requestUrl = location.protocol === "fluxer-app:" ?
                `fluxer-app://app/api/${encodeURIComponent(apiBase)}${endpoint}` :
                `${apiBase}${endpoint}`;

            const response = await fetch(requestUrl, {
                headers: {
                    Authorization: token
                }
            });

            const body = await response.text();

            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}.`;

                try {
                    const errorData = JSON.parse(body);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch {}

                throw new Error(errorMessage);
            }

            const message = JSON.parse(body);
            const username = message.author?.username || "Unknown";

            const filename = `Message-${username}-${message.id}.json`
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

            const blob = new Blob([body], {
                type: "application/json;charset=utf-8"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            link.style.display = "none";

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            window.alert(`Message export failed: ${error.message}`);
        }
    }

    function registerActionMenuButton() {
        window.AviaActionMenu.register({
            id: ACTION_MENU_ID,
            name: TOOLTIP_TEXT,
            svg: EXPORT_ICON_PATH,
            viewBox: ICON_VIEWBOX,
            onClick: ({
                messageId
            }) => downloadMessage(messageId)
        });
    }

    if (window.AviaActionMenu?.register) {
        registerActionMenuButton();
    } else {
        const waitActionMenu = setInterval(() => {
            if (window.AviaActionMenu?.register) {
                clearInterval(waitActionMenu);
                registerActionMenuButton();
            }
        }, 250);

        setTimeout(() => clearInterval(waitActionMenu), 15000);
    }
})();