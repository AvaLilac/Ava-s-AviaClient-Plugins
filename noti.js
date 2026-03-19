(function() {
    let myId = null;
    const channelMap = {};

    function notifySystem(title, message) {
        new Notification(title, { body: message });
    }

    function getCurrentChannelId() {
        const activeChat = document.querySelector('[data-testid="channel-view"]');
        return activeChat ? activeChat.getAttribute("data-channel") : null;
    }

    function handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "Ready") {
                myId = data.users?.find(u => u.relationship === "User")?._id || data.user_id;
                if (Array.isArray(data.channels)) {
                    data.channels.forEach(c => { channelMap[c._id] = c.channel_type; });
                }
            }
            if (data.type === "ChannelCreate") channelMap[data.channel._id] = data.channel.channel_type;
            if (data.type === "ChannelUpdate") channelMap[data.channel._id] = data.channel.channel_type;
            if (data.type === "MessageCreate") {
                if (!myId) return;
                const channelType = channelMap[data.channel];
                const isDM = channelType === "DirectMessage" || channelType === "SavedMessages";
                const isMention =
                    (Array.isArray(data.mentions) && data.mentions.includes(myId)) ||
                    (typeof data.content === "string" && data.content.includes(`<@${myId}>`));
                if (isDM || isMention) {
                    const currentChannel = getCurrentChannelId();
                    if (currentChannel === data.channel) return;
                    const author = data.member?.nickname || data.author || "Someone";
                    const content = data.content || "[no text]";
                    notifySystem(isDM ? "New DM" : "Mention", `${author}: ${content}`);
                }
            }
        } catch (_) {}
    }

    window.__AVIA_WS_ORIGINAL__ = window.WebSocket;
    window.WebSocket = function(...args) {
        const socket = new window.__AVIA_WS_ORIGINAL__(...args);
        socket.addEventListener("message", handleMessage);
        console.log("Avia: hooked WebSocket", args[0]);
        return socket;
    };
    window.WebSocket.prototype = window.__AVIA_WS_ORIGINAL__.prototype;

    console.log("Avia: WebSocket wrapped, waiting for next connection...");
})();
