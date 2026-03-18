(function() {
    const OriginalWebSocket = window.WebSocket;

    let myId = null;
    const channelMap = {};

    function notifySystem(title, message) {
        try {
            // Electron renderer
            if (window.require) {
                const { Notification } = window.require('electron');
                new Notification({ title, body: message }).show();
            } 
            // Browser fallback
            else if ("Notification" in window) {
                if (Notification.permission === "granted") {
                    new Notification(title, { body: message });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification(title, { body: message });
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Failed to send notification:", e);
        }
    }

    function getCurrentChannelId() {
        const activeChat = document.querySelector('[data-testid="channel-view"]');
        return activeChat ? activeChat.getAttribute("data-channel") : null;
    }

    window.WebSocket = function(...args) {
        const socket = new OriginalWebSocket(...args);

        socket.addEventListener("message", (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "Ready") {
                    myId = data.users?.find(u => u.relationship === "User")?._id || data.user_id;

                    if (Array.isArray(data.channels)) {
                        data.channels.forEach(c => {
                            channelMap[c._id] = c.channel_type;
                        });
                    }
                }

                if (data.type === "ChannelCreate") {
                    channelMap[data.channel._id] = data.channel.channel_type;
                }

                if (data.type === "ChannelUpdate") {
                    channelMap[data.channel._id] = data.channel.channel_type;
                }

                if (data.type === "MessageCreate") {
                    if (!myId) return;

                    const channelType = channelMap[data.channel];
                    const isDM = channelType === "DirectMessage" || channelType === "SavedMessages";
                    const isMention =
                        (Array.isArray(data.mentions) && data.mentions.includes(myId)) ||
                        (typeof data.content === "string" && data.content.includes(`<@${myId}>`));

                    if (isDM || isMention) {
                        const currentChannel = getCurrentChannelId();

                        // Only proceed if NOT in the same channel
                        if (currentChannel === data.channel) return;

                        const author = data.member?.nickname || data.author || "Someone";
                        const content = data.content || "[no text]";

                        // Debug log: only when notification will be sent
                        console.log("Notification triggered for channel:", data.channel, "Current:", currentChannel);
                        console.log("Author:", author, "Message:", content);

                        notifySystem(isDM ? "New DM" : "Mention", `${author}: ${content}`);
                    }
                }
            } catch (e) {}
        });

        return socket;
    };
})();
